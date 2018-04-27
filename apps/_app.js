const db = require("../common/db");
const Request = require("../common/request");
const ws = require("../common/server/ws");
const logger = require("../common/log");
const utils = require("../common/utils");

class App {
    constructor() {
        this.r = new Request();
        this.init();
        this.log = logger.getLogger(this.title);
    }
    init() {
        this.title = this.constructor.name;
        this.domain = null;
        this.url = null;
        this.params = null;
        this.desc = "";
    }
    info() {
        let info = { id: this.id, title: this.title };
        if (this.domain) info.domain = this.domain;
        if (this.package) info.package = this.package;
        if (this.url) info.url = this.url;
        if (this.params) info.params = this.params;
        if (this.desc) info.desc = this.desc;
        if (this.imageCode) info.imageCode = Boolean(this.getImageCode);
        return info;
    }
    send(uid, msg) {
        ws.with(uid, s => s.emit("msg", msg));
    }
    success(uid, params) {
        ws.with(uid, s => s.emit("cookie_success", this.id));
        if (params)
            return this.save(uid, params);
    }
    async save(uid, params) {
        let row = await db.select("up", ["params"]).where({ aid: this.id, uid }).first();
        if (row) {
            params = Object.assign(JSON.parse(row.params), params);
            await db.update("up", { online: 5, enable: 1, params }).where({ aid: this.id, uid });
        } else {
            await db.insert("up", { aid: this.id, uid, params: JSON.stringify(params), online: 5, enable: true });
        }
    }
    async check(uid, req, res) {
        req.body = await utils.streamToBuffer(req);
        let params = {
            method: req.method,
            url: req.url,
            headers: req.headers,
            body: req.body.toString("base64"),
        };
        if (await this.is_online(params)) {
            this.success(uid, params);
            return true;
        }
    }
    ok(data) {
        this.log.info("获得数据", data instanceof Buffer ? data.toString("base64") : data);
        return true;
    }
    async run(params) {
        return this.r.request(params.url, new Buffer(params.body, "base64"), params.method, params.headers);
    }
    // getImageCode  获取图像验证码，返回图像地址
    async login(params) {

    }
    is_online(params) {
        return this.run(params).then(x => this.ok(x));
    }
    start(uid, params) {
        return this.run(params).then(data => {
            let ok = this.ok(data);
            if (ok) {
                this.log.info(`uid:${uid} 执行成功`);
                return ok;
            }
            this.log.info(`uid:${uid} 执行失败`, data);
            if (this.params) {
                this.log.info(`uid:${uid} 尝试登录`);
                return this.login(params).then(data => {
                    let ok = this.ok(data);
                    if (ok) {
                        this.log.info(`uid:${uid} 登录并执行成功`);
                        return ok;
                    }
                    this.log.info(`uid:${uid} 登录失败`);
                    return false;
                });
            }
            return false;
        }).then(ok => {
            let t = new Date().getTime();
            if (ok) return db.update("up", { update_at: t, success_at: t, num: db.Raw("num+1"), online: 5 }).where({ aid: this.id, uid: uid }).then(() => ok);
            return db.update("up", { update_at: t, failure_at: t, online: db.Raw("online-2") }).where({ aid: this.id, uid: uid }).then(() => false);
        }, err => {
            let t = new Date().getTime();
            return db.update("up", { update_at: t, failure_at: t, online: db.Raw("online-2") }).where({ aid: this.id, uid: uid }).then(() => false);
        });
    }
}

module.exports = App;