#!/usr/bin/env node
const yargs = require('yargs');
const http = require('http');
const fs = require('fs');
const { load } = require('js-yaml');
const { generateHome } = require('./generateHtml');

export interface Remote {
  remoteUrl: string;
  localPath: string;
  localCommand: string;
}

/**
 * Reads mf-scripts config file
 */
async function readConfig(configFile, request) {
  const data = await fs.readFileSync(configFile, 'utf8');
  let result;
  if (configFile.endsWith('.json5') || configFile.endsWith('.json')) {
    result = require('json5').parse(data);
  } else if (configFile.endsWith('.js') || configFile.endsWith('.cjs')) {
    result = require(configFile);
    if (result.default != null) {
      result = result.default;
    }
    if (typeof result === 'function') {
      result = result(request);
    }
    result = await Promise.resolve(result);
  } else if (configFile.endsWith('.toml')) {
    result = require('toml').parse(data);
  } else {
    result = load(data);
  }
  return { result, configFile };
}

/**
 * Starts mf-scripts server
 * @param {object} config
 * @param {string} host
 * @param {number} port
 */
function startServer(config, host, port) {
  const requestListener = function (req, res) {
    res.setHeader('Content-Type', 'text/html');
    res.writeHead(200);
    res.end(
      generateHome(config?.remotes ?? {}, (key: string, remote: Remote) => {
        return `<div>`;
      })
    );
  };

  const server = http.createServer(requestListener);

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
  server.listen({
    port,
    host,
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
const port = options.port ?? 8080;
// TODO: support other types
readConfig('mf.config.json', {
  options,
})
  .then(({ result: config }) => {
    console.log(config);
    startServer(config, host, port);
  })
  .catch(err => console.error(err));
