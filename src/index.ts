#!/usr/bin/env node

import yargs from 'yargs';
import startServer from './server';
import fs from 'fs';
import readConfig from './readConfig';

/**
 * Converts options to object if it is a promise
 */
function convertOptions<T>(
  options: T | Promise<T>,
  callback: (options: T) => void
) {
  if (options instanceof Promise) {
    return options.then(opt => callback(opt));
  }
  return callback(options);
}

export default function main() {
  /**
   * Get options
   */
  let options = yargs
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
  const files: string[] = fs.readdirSync(process.cwd());
  const configs: { [key: string]: string } = {};
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

  if (
    configs.default === null &&
    configs.dev === null &&
    configs.prod === null
  ) {
    console.error('No mfe-proxy config file found');
    return;
  }

  // TODO: support other types
  readConfig(configs?.dev ?? configs.default ?? configs.prod, {
    options,
  })
    .then((result: { [key: string]: any }) => {
      startServer(result, host, port);
    })
    .catch((err: any) => console.error(err));
}

main();
