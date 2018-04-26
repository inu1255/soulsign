const App = require("../apps/_app");
const db = require("../common/db");

exports.list = function(req, res) {
    let user = req.session.user;
    return db.select("black_list").where({ uid: user.id });
};

exports.add = function(req, res) {
    let body = req.body;
    let user = req.session.user;
    body.uid = user.id;
    return db.insert("black_list", body);
};

exports.del = function(req, res) {
    let body = req.body;
    let user = req.session.user;
    return db.delete("black_list").where({ id: body.id, uid: user.id });
};

exports.set = function(req, res) {
    let body = req.body;
    let user = req.session.user;
    let id = body.id;
    delete body.id;
    return db.update("black_list", body).where({ id, uid: user.id });
};