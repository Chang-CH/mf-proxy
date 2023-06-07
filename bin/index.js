#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a;
const yargs = require('yargs');
const http = require('http');
const fs = require('fs');
const { load } = require('js-yaml');
/**
 * Reads mf-scripts config file
 */
function readConfig(configFile, request) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield fs.readFileSync(configFile, 'utf8');
        let result;
        if (configFile.endsWith('.json5') || configFile.endsWith('.json')) {
            result = require('json5').parse(data);
        }
        else if (configFile.endsWith('.js') || configFile.endsWith('.cjs')) {
            result = require(configFile);
            if (result.default != null) {
                result = result.default;
            }
            if (typeof result === 'function') {
                result = result(request);
            }
            result = yield Promise.resolve(result);
        }
        else if (configFile.endsWith('.toml')) {
            result = require('toml').parse(data);
        }
        else {
            result = load(data);
        }
        return { result, configFile };
    });
}
/**
 * Starts mf-scripts server
 * @param {object} config
 * @param {string} host
 * @param {number} port
 */
function startServer(config, host, port) {
    const requestListener = function (req, res) {
        if (req.method === 'GET') {
            fs.readFile(__dirname + '/index.html', (err, contents) => {
                if (err) {
                    res.writeHead(500);
                    res.end(err);
                }
                res.setHeader('Content-Type', 'text/html');
                res.writeHead(200);
                res.end(contents);
            });
        }
    };
    const server = http.createServer(requestListener);
    server.listen({
        port,
        host,
    });
    server.on('error', e => {
        if (e.code === 'EADDRINUSE') {
            console.error('Address in use, retrying...');
            setTimeout(() => {
                server.close();
                server.listen({ port: 0, host });
            }, 1000);
        }
    });
    server.on('listening', () => {
        console.log(`Server is running on http://${host}:${server.address().port}`);
    });
}
/**
 * Get options
 */
const options = yargs
    .usage('$0 <cmd> [args]')
    .option('p', {
    alias: 'port',
    describe: 'mf-scripts server port',
    type: 'number',
    demandOption: false,
})
    .help().argv;
const host = 'localhost';
const port = (_a = options.port) !== null && _a !== void 0 ? _a : 8080;
// TODO: support other types
readConfig('mf.config.json', {
    options,
})
    .then(({ result: config }) => {
    console.log(config);
    startServer(config, host, port);
})
    .catch(err => console.error(err));
//# sourceMappingURL=index.js.map