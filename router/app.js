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
    return db.select("up").where({ uid: user.id });
};

exports.proxy = async function(req, res) {
    let body = req.body;
    let user = req.session.user;
    /** @type {App} */
    let app = apps[body.aid];
    if (!app) return 404;
    if (!app.domain) return 405;
    let port = await proxy.proxy(user.id, app.domain, app.check.bind(app, user.id));
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
    let { aid, ...data } = body;
    return db.update("up", data).where({ aid, uid: user.id });
};

function taskLoop() {
    if (store.taskLoop != taskLoop) return;
    let sql = `select * from up where enable=1 and online>0 and floor(success_at/86400000)<? limit 50`;
    return db.execSQL(sql, [Math.floor(new Date().getTime() / 86400e3)], true).then(rows => Promise.all(rows.map(x => {
        /** @type {App} */
        let app = apps[x.aid];
        if (!app) return null;
        return app.start(x.uid, JSON.parse(x.params));
    }))).then(x => setTimeout(taskLoop, x.filter(x => x).length ? 0 : 5e3), err => {
        console.log(err);
        setTimeout(taskLoop, 0);
    });
}
store.taskLoop = taskLoop;
taskLoop();

function loginLoop() {
    if (store.loginLoop != loginLoop) return;
    let sql = `select * from up where enable=1 and online>0 and login_at<? limit 50`;
    return db.execSQL(sql, [new Date().getTime() - 600e3], true).then(rows => Promise.all(rows.map(x => {
        /** @type {App} */
        let app = apps[x.aid];
        if (!app) return null;
        let params = JSON.parse(x.params);
        return app.is_online(params).then(ok => {
            let t = new Date().getTime();
            if (ok) return db.update("up", { login_at: t, online_at: t, online: 5 }).where({ aid: x.aid, uid: x.uid });
            return db.update("up", { login_at: t, online: db.Raw("online-1") }).where({ aid: x.aid, uid: x.uid });
        }, e => {
            let t = new Date().getTime();
            return db.update("up", { login_at: t, online: db.Raw("online-1") }).where({ aid: x.aid, uid: x.uid });
        });
    }))).then(x => setTimeout(loginLoop, x.length ? 0 : 5e3), err => {
        console.log(err);
        setTimeout(loginLoop, 0);
    });
}
store.loginLoop = loginLoop;
loginLoop();