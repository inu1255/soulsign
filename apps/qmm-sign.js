const App = require("./_app");
const utils = require("../common/utils");

class QmmSign extends App {
    init() {
        this.title = "券妈妈-签到";
        this.domain = "app.quanmama.com";
        this.package = "com.android.app.quanmama";
    }
    async check(uid, req, res) {
        if (req.url.indexOf('ajax/qiandao.ashx') >= 0) {
            req.body = await utils.streamToBuffer(req);
            if (req.body.toString().indexOf("action=checkin&") >= 0) {
                return await super.check(uid, req, res);
            }
        }
    }
    ok(data) {
        try { data = JSON.parse(data); } catch (err) {}
        return data && data.IsSigned == "True";
    }
}

module.exports = QmmSign;