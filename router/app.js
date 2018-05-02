const proxy = require("../common/proxy");
const App = require("../apps/_app");
const db = require("../common/db");
const storage = require("../common/storage");
const apps = require("../apps");
const store = require("../common/storage")("loop-cache");

exports.status = function(req, res) {
    console.log(store);
    return apps;
};

exports.list = function(req, res) {
    return Object.values(apps).filter(x => x.info).map(x => x.info());
};

exports.mines = function(req, res) {
    let user = req.session.user;
    let selects = ["aid", "uid", "enable", "num", "online", "online_at", "login_at", "update_at", "success_at", "failure_at", "create_at"];
    return db.select("up", selects).where({ uid: user.id });
};

exports.proxy = async function(req, res) {
    let body = req.body;
    let user = req.session.user;
    /** @type {App} */
    let app = apps[body.aid];
    if (!app) return 404;
    if (!app.domain) return 405;
    let port = await proxy.proxy(user.id, app.host || app.domain, app.check.bind(app, user.id));
    await db.update("up", { enable: false }).where({ aid: body.aid, uid: user.id });
    return { port };
};

exports.run = function(req, res) {
    let body = req.body;
    let user = req.session.user;
    /** @type {App} */
    let app = apps[body.aid];
    if (!app) return 404;
    return db.select("up", ["params"]).where({ aid: body.aid, uid: user.id }).first().then((data) => {
        if (!data) return 404;
        let params = JSON.parse(data.params);
        return app.start(user.id, params);
    });
};

exports.set = function(req, res) {
    let body = req.body;
    let user = req.session.user;
    let aid = body.aid;
    delete body.aid;
    return db.update("up", body).where({ aid, uid: user.id });
};

function taskLoop() {
    taskLoop.running = taskLoop.running || {};
    if (store.taskLoop != taskLoop) return;
    let ids = Object.keys(taskLoop.running);
    let sql = `select * from up where enable=1 and online>0 and floor(success_at/86400000)<? ${ids.length?'and id not in (?)':''} limit 50`;
    return db.execSQL(sql, [Math.floor(new Date().getTime() / 86400e3), ids], true).then(rows => Promise.all(rows.map(x => {
        taskLoop.running[x.id] = true;
        /** @type {App} */
        let app = apps[x.aid];
        if (!app) return null;
        return app.start(x.uid, JSON.parse(x.params)).then(y => {
            delete taskLoop.running[x.id];
            return y;
        }, e => {
            delete taskLoop.running[x.id];
            return Promise.reject(e);
        });
    }))).then(x => setTimeout(taskLoop, x.filter(x => x).length ? 30e3 : 90e3), err => {
        console.log(err);
        setTimeout(taskLoop, 30e3);
    });
}
store.taskLoop = taskLoop;
taskLoop();

function loginLoop() {
    loginLoop.running = loginLoop.running || {};
    if (store.loginLoop != loginLoop) return;
    let ids = Object.keys(loginLoop.running);
    let sql = `select * from up where enable=1 and online>0 and login_at<? ${ids.length?'and id not in (?)':''} limit 50`;
    return db.execSQL(sql, [new Date().getTime() - 600e3, ids], true).then(rows => Promise.all(rows.map(x => {
        loginLoop.running[x.id] = true;
        /** @type {App} */
        let app = apps[x.aid];
        if (!app) return null;
        let params = JSON.parse(x.params);
        return app.is_online(params).then(ok => {
            let t = new Date().getTime();
            delete loginLoop.running[x.id];
            if (ok) return db.update("up", { login_at: t, online_at: t, online: 5 }).where({ id: x.id });
            return db.update("up", { login_at: t, online: db.Raw("online-1") }).where({ id: x.id });
        }, e => {
            delete loginLoop.running[x.id];
            let t = new Date().getTime();
            return db.update("up", { login_at: t, online: db.Raw("online-1") }).where({ id: x.id });
        });
    }))).then(x => setTimeout(loginLoop, x.length ? 60e3 : 120e3), err => {
        console.log(err);
        setTimeout(loginLoop, 60e3);
    });
}
store.loginLoop = loginLoop;
loginLoop();