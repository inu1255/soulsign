const App = require("./_app");
const utils = require("../common/utils");

class JdDou extends App {
    init() {
        this.title = "京东-领取京东豆";
        this.domain = "api.m.jd.com";
        this.package = "com.jingdong.app.mall";
    }
    async check(uid, req, res) {
        if (req.url.indexOf('signBeanStart') >= 0) {
            let params = {
                cookie: req.headers.cookie,
                sign: req.url.replace(`/client.action?`, '')
            };
            if (await this.is_online(params)) {
                await this.save(uid, params);
                this.send(uid, "检测到签到操作，请进行翻牌操作");
            }
        }
        if (req.url.indexOf('getCardResult') >= 0) {
            let params = {
                cookie: req.headers.cookie,
                card: req.url.replace(`/client.action?`, '')
            };
            if (await this.is_online(params)) {
                await this.success(uid, params);
                return true;
            }
        }
    }
    ok(data) {
        if (typeof data == "string") {
            try {
                data = JSON.parse(data);
            } catch (err) {}
        }
        return data && data.code == 0;
    }
    sign(params) {
        return this.r.postForm("http://api.m.jd.com/client.action?" + params.sign, { body: '{"rnVersion":"3.3"}' }, {
            cookie: params.cookie,
        }).then(data => this.ok(data));
    }
    card(params) {
        return this.r.postForm("http://api.m.jd.com/client.action?" + params.card, { body: '{"index":2}' }, {
            cookie: params.cookie,
        }).then(data => this.ok(data));
    }
    run(params) {
        if (params.sign && params.card) return this.sign(params).then(x => this.card(params));
        if (params.sign) return this.sign(params);
        if (params.card) return this.card(params);
        return false;
    }
    is_online(params) {
        return this.run(params);
    }
}

module.exports = JdDou;