const childProcess = require('child_process');
const mocha = require("mocha");
const fs = require("fs");

const tests = JSON.parse(fs.readFileSync(__dirname + "/tests.json", "utf8"));

mocha.describe("GSuite Automation Scripts", () => {
    for (let t of tests) {
        runTest(t.description, t.script);
    }
});

function runTest(description, scriptFileName) {
    mocha.it(description, (done) => {
        runScript('./' + scriptFileName, function (err) {
            if (err) throw err;
            done();
        });
    }).timeout(100000);
}

function runScript(scriptPath, callback) {
    // keep track of whether callback has been invoked to prevent multiple invocations
    let invoked = false;
    let process = childProcess.fork(scriptPath);

    process.on('error', function (err) {
        if (invoked) return;
        invoked = true;
        callback(err);
    });

    process.on('exit', function (code) {
        if (invoked) return;
        invoked = true;
        let err = code === 0 ? null : new Error('exit code ' + code);
        callback(err);
    });
}