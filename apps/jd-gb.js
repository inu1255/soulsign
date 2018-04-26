const App = require("./_app");
const utils = require("../common/utils");

class JdGb extends App {
    init() {
        this.title = "京东金融-签到领钢镚";
        this.domain = "ms.jr.jd.com";
        this.package = "com.jd.jrapp";
    }
    async check(uid, req, res) {
        if (req.url.indexOf('gw/generic/hy/h5/m/signIn') >= 0) {
            return await super.check(uid, req, res);
        }
    }
    ok(data) {
        if (typeof data == "string") {
            try { data = JSON.parse(data); } catch (err) {}
        }
        return data && data.resultCode == 0;
    }
}

module.exports = JdGb;