const App = require("./_app");
const utils = require("../common/utils");

class Pojie52 extends App {
    init() {
        this.title = "52破解-自动签到";
        this.domain = "www.52pojie.cn";
        this.package = "com.tencent.mm";
    }
    async check(uid, req, res) {
        if (req.url.indexOf('home.php?mod=task&do=apply&id=2') >= 0) {
            return await super.check(uid, req, res);
        }
    }
    ok(data) {
        return data.indexOf("wbs.png") >= 0;
    }
}

module.exports = Pojie52;