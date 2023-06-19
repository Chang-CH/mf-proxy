#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const yargs_1 = __importDefault(require("yargs"));
const server_1 = __importDefault(require("./server"));
const fs_1 = __importDefault(require("fs"));
const readConfig_1 = __importDefault(require("./readConfig"));
/**
 * Converts options to object if it is a promise
 */
function convertOptions(options, callback) {
    if (options instanceof Promise) {
        return options.then(opt => callback(opt));
    }
    return callback(options);
}
function main() {
    /**
     * Get options
     */
    let options = yargs_1.default
        .usage('$0 <cmd> [args]')
        .option('p', {
        alias: 'port',
        describe: 'mfe-proxy server port',
        type: 'number',
        demandOption: false,
    })
        .help().argv;
    convertOptions(options, opt => (options = opt));
    const host = 'localhost';
    // @ts-ignore type validated by convertOptions
    const port = options?.p ?? 8080;
    /**
     * Read all files in current directory
     */
    const files = fs_1.default.readdirSync(process.cwd());
    const configs = {};
    for (const file of files) {
        if (file.startsWith('mfe-proxy') || file === '.mfe-proxy') {
            const filespec = file.split('.');
            const type = filespec?.[1];
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
        console.error('No mfe-proxy config file found');
        return;
    }
    // TODO: support other types
    (0, readConfig_1.default)(configs?.dev ?? configs.default ?? configs.prod, {
        options,
    })
        .then((result) => {
        (0, server_1.default)(result, host, port);
    })
        .catch((err) => console.error(err));
}
exports.default = main;
main();
//# sourceMappingURL=index.js.map