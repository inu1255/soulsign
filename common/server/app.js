/**
 * Created Date: 2017-09-25 17:30:38
 * Author: inu1255
 * E-Mail: 929909260@qq.com
 */
const express = require("express");
const bodyParser = require('body-parser');
const hot = require("node-hot-require");
hot.filter = function(filename) {
    if (filename.endsWith("common/storage.js")) {
        return false;
    }
    return true;
};
const router = hot.require("../../router/index.js");
const session = require("../session");
const connectLogger = require("../log").connectLogger;
const app = express();

const utils = require("../utils");

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(connectLogger);
app.use("/api", session);
// if (config.dev) {
//     app.use("/api", function(req, res, next) {
//         if (!req.session.user)
// 			req.session.user = { id: 1 };
// 		next();
//     });
// }
app.use("/api", utils.cross);
app.use("/api", router);

app.get("/upgrade", function(req, res) {
    hot.reloadAll();
    res.send(router.version());
});

app.get('*', function(req, res) {
    res.sendFile(__dirname + "../../public/index.html");
});

module.exports = app;