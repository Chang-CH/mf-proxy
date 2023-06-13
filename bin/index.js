#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var yargs = require('yargs');
var startServer = require('./server');
var fs = require('fs');
var readConfig = require('./readConfig');
/**
 * Converts options to object if it is a promise
 */
function convertOptions(options, callback) {
    if (options instanceof Promise) {
        return options.then(function (opt) { return callback(opt); });
    }
    return callback(options);
}
function main() {
    var _a, _b, _c;
    /**
     * Get options
     */
    var options = yargs
        .usage('$0 <cmd> [args]')
        .option('p', {
        alias: 'port',
        describe: 'mf-scripts server port',
        type: 'number',
        demandOption: false,
    })
        .help().argv;
    convertOptions(options, function (opt) { return (options = opt); });
    var host = 'localhost';
    // @ts-ignore type validated by convertOptions
    var port = (_a = options === null || options === void 0 ? void 0 : options.p) !== null && _a !== void 0 ? _a : 8080;
    /**
     * Read all files in current directory
     */
    var files = fs.readdirSync(process.cwd());
    var configs = {};
    for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
        var file = files_1[_i];
        if (file.startsWith('mf-scripts') || file === '.mf-scripts') {
            var filespec = file.split('.');
            var type = filespec === null || filespec === void 0 ? void 0 : filespec[1];
            if (filespec.length === 4) {
                configs[filespec[1]] = file;
                continue;
            }
            configs['default'] = file;
        }
    }
    if (configs.default === null &&
        configs.dev === null &&
        configs.prod === null) {
        console.error('No mf-scripts config file found');
        return;
    }
    // TODO: support other types
    readConfig((_c = (_b = configs === null || configs === void 0 ? void 0 : configs.dev) !== null && _b !== void 0 ? _b : configs.default) !== null && _c !== void 0 ? _c : configs.prod, {
        options: options,
    })
        .then(function (result) {
        console.log(result);
        startServer(result, host, port);
    })
        .catch(function (err) { return console.error(err); });
}
main();
module.exports = {};
//# sourceMappingURL=index.js.map