const App = require("./_app");
const utils = require("../common/utils");

class QmmSign extends App {
    init() {
        this.title = "淘宝-淘金币";
        this.domain = "guide-acs.m.taobao.com";
        this.package = "com.taobao.taobao";
    }
    async check(uid, req, res) {
        if (req.url.indexOf('gw/mtop.matrixexchange.wireless.getallcoin.receive') >= 0) {
            return await super.check(uid, req, res);
        }
    }
    ok(data) {
        try { data = JSON.parse(data); } catch (err) {}
        return data && data.data && data.data.checkCodeResult && data.data.checkCodeResult.status;
    }
}

module.exports = QmmSign;