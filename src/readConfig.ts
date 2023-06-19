import fs from 'fs';
import yaml from 'js-yaml';

/**
 * Reads mf-proxy config file
 */
export default async function readConfig(
  filePath: string,
  args: { [key: string]: any }
) {
  const data = fs.readFileSync(filePath, 'utf8');
  let result;
  if (filePath.endsWith('.json5') || filePath.endsWith('.json')) {
    result = require('json5').parse(data);
  } else if (filePath.endsWith('.js') || filePath.endsWith('.cjs')) {
    result = require(filePath);
    if (result.default != null) {
      result = result.default;
    }
    if (typeof result === 'function') {
      result = result(args);
    }
    result = await Promise.resolve(result);
  } else if (filePath.endsWith('.toml')) {
    result = require('toml').parse(data);
  } else {
    result = yaml.load(data);
  }
  return result;
}
