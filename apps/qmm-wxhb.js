const App = require("./_app");
const utils = require("../common/utils");

class QmmSign extends App {
    init() {
        this.title = "券妈妈微信-签到红包";
        this.desc = "每天0.01元";
        this.domain = "www.quanmama.com";
        this.package = "com.tencent.mm";
    }
    async check(uid, req, res) {
        if (req.url.indexOf('ajax/hongbao/hongbaoInfo.ashx') >= 0) {
            req.body = await utils.streamToBuffer(req);
            if (req.body.toString().indexOf("action=pick&") >= 0) {
                return await super.check(uid, req, res);
            }
        }
    }
    ok(data) {
        try { data = JSON.parse(data); } catch (err) {}
        return data && data.redEnvelope && data.redEnvelope.isGeted == 1;
    }
}

module.exports = QmmSign;