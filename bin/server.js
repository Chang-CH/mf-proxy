"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const generateSite_1 = require("./generateSite");
const http_1 = __importDefault(require("http"));
const bonjour_1 = __importDefault(require("bonjour"));
const ws_1 = require("ws");
/**
 * HTTP server for html hosting and proxy routes
 * @param req
 * @param res
 */
const createServerListener = (config, locals, preference) => (req, res) => {
    // @ts-ignore
    const baseURL = req.protocol + '://' + req.headers.host + '/';
    const reqUrl = new URL(req.url ?? '/', baseURL);
    /** Base path: render admin panel */
    if (reqUrl.pathname == '/') {
        res.setHeader('Content-Type', 'text/html');
        res.writeHead(200);
        res.end((0, generateSite_1.generateHome)(config?.remotes ?? {}));
        return;
    }
    /** Proxy to remotes */
    const request = reqUrl.pathname.split('/');
    const module = request[1];
    // Not a valid module. return 404
    if (!(module in config?.remotes)) {
        res.writeHead(404);
        res.end();
        return;
    }
    const path = request.slice(2).join('/');
    let url;
    if (locals[module] && preference[module] !== 'remote') {
        // proxy to local dev server
        const local = locals[module];
        url = `http://localhost:${local.port}/${path}`;
    }
    else {
        // proxy to remote dev server
        url = `https://${config?.remotes?.[module]?.remoteUrl}/${path}`;
    }
    console.log('fetch: ', url);
    fetch(url)
        .then(response => {
        const body = response.body;
        if (!body) {
            res.writeHead(response.status);
            res.end();
            return;
        }
        response.text().then(text => {
            res.writeHead(response.status);
            res.end(text);
        });
    })
        .catch(err => {
        console.log('fetch error: ', err);
        res.writeHead(500);
        res.end();
    });
};
/**
 * Websocket for listening to local module server status
 * @param preference
 * @returns
 */
const createSocketListener = (preference) => (data) => {
    const message = JSON.parse(data.toString());
    if (!message || !message.module || !message.source)
        return;
    preference[message.module] =
        message.source === 'local' ? 'local' : 'remote';
    // TODO: sync up preference through websockets.
    console.log('updated preference: ', preference);
};
/**
 * Starts mfe-proxy server
 * @param {object} config
 * @param {string} host
 * @param {number} port
 */
function startServer(config, host, port) {
    let server;
    const locals = {}; // local dev servers of known module names
    const preference = {}; // user preference for local/remote
    const httpListener = createServerListener(config, locals, preference);
    const wsListener = createSocketListener(preference);
    server = http_1.default.createServer(httpListener);
    server.on('error', (e) => {
        console.error(e);
        if (e.code === 'EADDRINUSE') {
            console.error('Address in use, retrying...');
            setTimeout(() => {
                server.close();
                server.listen({ port: 0, host });
            }, 1000);
        }
    });
    server.on('listening', () => {
        const addr = server?.address();
        if (typeof addr === 'string') {
            console.log(`Server is running on ${addr}`);
            return;
        }
        console.log(`Server is running on http://${host}${addr?.port ? `:${addr.port}` : ''}`);
    });
    const wss = new ws_1.WebSocketServer({
        noServer: true,
    });
    const clients = [];
    wss.on('connection', (ws) => {
        clients.push(ws);
        ws.on('error', console.error);
        ws.on('message', wsListener);
        // Send client currently known local webpack serverss
        const message = {};
        for (const [key, value] of Object.entries(locals)) {
            message[key] = value.port;
        }
        ws.send(JSON.stringify(message));
    });
    server.on('upgrade', (request, socket, head) => {
        // TODO: detect inactive sockets?
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    });
    const bonjour = (0, bonjour_1.default)();
    // TODO: detect webpack server dead
    const browser = bonjour.find({ type: 'http', subtypes: ['webpack'] }, (data) => {
        locals[data.name] = data;
        const message = {};
        message[data.name] = data.port;
        console.log('webpack server registered: ', data.name);
        for (const client of clients) {
            client.send(JSON.stringify(message));
        }
    });
    browser.start();
    server.listen({
        port,
        host,
    });
}
exports.default = startServer;
//# sourceMappingURL=server.js.map