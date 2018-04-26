const net = require("net");
const Duplex = require('stream').Duplex;

exports.cross = function(req, res, next) {
    const origin = req.headers["origin"];
    if (origin) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Access-Control-Allow-Credentials", "true");
        res.setHeader("Access-Control-Allow-Headers", "content-type");
    }
    next();
};

/**
 * 检查端口是否占用
 * @param {number} port 端口
 */
exports.probe = function(port) {
    return new Promise(function(resolve) {
        var server = net.createServer().listen(port);

        var calledOnce = false;

        var timeoutRef = setTimeout(function() {
            calledOnce = true;
            resolve(true);
        }, 2000);

        server.on('listening', function() {
            clearTimeout(timeoutRef);

            if (server)
                server.close();

            if (!calledOnce) {
                calledOnce = true;
                resolve(false);
            }
        });

        server.on('error', function(err) {
            clearTimeout(timeoutRef);

            var result = false;
            if (err.code === 'EADDRINUSE')
                result = true;

            if (!calledOnce) {
                calledOnce = true;
                resolve(result);
            }
        });
    });
};

exports.streamToBuffer = function(stream) {
    return new Promise((resolve, reject) => {
        let buffers = [];
        stream.on('error', reject);
        stream.on('data', (data) => buffers.push(data));
        stream.on('end', () => resolve(Buffer.concat(buffers)));
    });
};

exports.bufferToStream = function(buffer) {
    let stream = new Duplex();
    stream.push(buffer);
    stream.push(null);
    return stream;
};

exports.sleep = function(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * 按顺序执行Promise
 * @param {Array<(ret:Any,i:Number)=>Promise>} tasks 
 * @param {Any} [init]
 * @returns {Promise}
 */
exports.flow = function(tasks, init) {
    return new Promise((resolve, reject) => {
        var i = 0;
        var ret = init;

        function next(data) {
            ret = data;
            i++;
            if (i < tasks.length)
                tasks[i](ret, i).then(next, reject).catch(reject);
            else
                resolve(ret);
        }
        tasks[i](ret, i).then(next, reject).catch(reject);
    });
};

/**
 * 把v转换为mysql可以接收的参数，把对象转换成json字符串
 * @param {any} v 值
 * @returns {String}
 */
exports.val = function(v) {
    if (v === undefined) v = null;
    return (v && typeof v === "object") ? JSON.stringify(v) : v;
};

/**
 * 如果args为undefined则返回 def||[] 
 * 如果args是一个Array则返回自己
 * 如果不是则返回[args]
 * @param {any} args 
 * @param {Array|undefined} def 
 * @returns {Array}
 */
exports.arr = function(args, def) {
    if (args instanceof Array) return args;
    return args === undefined ? def || [] : [args];
};

/**
 * @param {Array<Function>} middles 
 * @param {Function} cb 
 */
exports.withMiddles = function(context, middles, cb) {
    return function() {
        let args = Array.from(arguments);
        if (cb) middles = middles.concat([cb]);
        let fn = middles.map(x => (next) => x.apply(context, args.concat(next))).reverse().reduce((a, b) => () => b(a));
        return fn();
    };
};

exports.promisify = function(fn) {
    return function() {
        let args = arguments;
        let that = this;
        return new Promise(function(resolve, reject) {
            fn.apply(that, Array.from(args).concat(function(err, data) {
                if (err) reject(err);
                else resolve(data);
            }));
        });
    };
};

/**
 * @param {String} cookie 
 * @returns {Object}
 */
exports.parseResCookie = function(cookie) {
    let cc = cookie.split(";");
    let ss = cc[0].split("=");
    let item = {};
    item.name = ss[0];
    item.value = ss.slice(1).join("=");
    item.domain = arguments[2];
    for (let row of cc.slice(1)) {
        let ss = row.split("=");
        let name = ss[0].trim();
        if (name) {
            item[name.toLowerCase()] = ss[1] ? ss[1].trim() : 1;
        }
    }
    return item;
};

/**
 * @param {String} cookie 
 * @returns {Object}
 */
exports.parseReqCookie = function(cookie) {
    if (!cookie) return {};
    let cc = cookie.split(";");
    let item = {};
    for (let s of cc) {
        let ss = s.split("=");
        if (ss.length > 1) {
            item[ss[0].trim()] = ss[1].trim();
        }
    }
    return item;
};