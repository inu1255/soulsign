const App = require("./_app");
const utils = require("../common/utils");

class CmccZsyyt extends App {
    init() {
        this.title = "四川掌上营业厅-大转盘";
        this.domain = "218.205.252.24";
        this.package = "com.sunrise.scmbhc";
    }
    async check(uid, req, res) {
        let cookie = utils.parseReqCookie(req.headers.cookie);
        if (cookie.SSOCookie) {
            let params = { SSOCookie: cookie.SSOCookie };
            if (await this.is_online(params)) {
                await this.success(uid, params);
                return true;
            }
        }
    }
    ok(data) {
        data = (data && data.dzpDraw || data.result) || data;
        return data && (data.code == 0 || data.code == 4);
    }
    run(params) {
        return this.r.postForm("http://218.205.252.24:18081/scmccCampaign/dazhuanpan/dzpDraw.do", params);
    }
    is_online(params) {
        return this.r.postForm("http://218.205.252.24:18081/scmccCampaign/signCalendar/signed.do", params).then(data => this.ok(data));
    }
}

module.exports = CmccZsyyt;