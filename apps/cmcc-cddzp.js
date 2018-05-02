const App = require("./_app");
const utils = require("../common/utils");

class CmccCdjDzp extends App {
    init() {
        this.title = "成都移动公众号-大转盘";
        this.domain = "223.87.178.135";
        this.host = "dzp.cdydwx.cn";
        this.package = "com.tencent.mm";
    }
    async check(uid, req, res) {
        if (req.url.indexOf('GetPrize.ashx') >= 0) {
            return await super.check(uid, req, res);
        }
    }
    ok(data) {
        try { data = JSON.parse(data); } catch (err) {}
        return data && (data.Ret == 2 || data.Ret == 0);
    }
}

module.exports = CmccCdjDzp;