"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const js_yaml_1 = __importDefault(require("js-yaml"));
/**
 * Reads mfe-proxy config file
 */
async function readConfig(filePath, args) {
    const data = fs_1.default.readFileSync(filePath, 'utf8');
    let result;
    if (filePath.endsWith('.json5') || filePath.endsWith('.json')) {
        result = require('json5').parse(data);
    }
    else if (filePath.endsWith('.js') || filePath.endsWith('.cjs')) {
        result = require(filePath);
        if (result.default != null) {
            result = result.default;
        }
        if (typeof result === 'function') {
            result = result(args);
        }
        result = await Promise.resolve(result);
    }
    else if (filePath.endsWith('.toml')) {
        result = require('toml').parse(data);
    }
    else {
        result = js_yaml_1.default.load(data);
    }
    return result;
}
exports.default = readConfig;
//# sourceMappingURL=readConfig.js.map