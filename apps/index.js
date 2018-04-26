const cofs = require("../common/cofs");
const store = {};

cofs.readDir('./apps/').then(function(filenames) {
    for (let filename of filenames) {
        if (!filename.startsWith("_") && filename != "index.js" && filename.endsWith(".js")) {
            let id = filename.slice(0, filename.length - 3);
            try {
                let App = require("./" + filename);
                store[id] = new App();
                store[id].id = id;
            } catch (err) {
				console.log(err);
            }
        }
    }
});

module.exports = store;