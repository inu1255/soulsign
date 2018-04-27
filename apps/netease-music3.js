const App = require("./_app");
const utils = require("../common/utils");

class NeteaseMusic extends App {
    init() {
        this.title = "网易云音乐-累计签到";
        this.domain = "music.163.com";
        this.package = "com.netease.cloudmusic";
    }
    async check(uid, req, res) {
        if (req.url.indexOf('store/eapi/activity/sign/award') >= 0) {
            return await super.check(uid, req, res);
        }
    }
	ok(data){
		return Boolean(data);
	}
}

module.exports = NeteaseMusic;