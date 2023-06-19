import { generateHome } from './generateSite';
import { IncomingMessage, Server, ServerResponse } from 'http';
import http from 'http';
import bonjourConstructor, { RemoteService } from 'bonjour';
import { WebSocket, WebSocketServer } from 'ws';

/**
 * HTTP server for html hosting and proxy routes
 * @param req
 * @param res
 */
const createListener =
  (
    config: { [key: string]: any },
    locals: { [key: string]: RemoteService },
    preference: { [key: string]: 'local' | 'remote' }
  ) =>
  (req: IncomingMessage, res: ServerResponse) => {
    // @ts-ignore
    const baseURL = req.protocol + '://' + req.headers.host + '/';
    const reqUrl = new URL(req.url ?? '/', baseURL);

    /** Base path: render admin panel */
    if (reqUrl.pathname == '/') {
      res.setHeader('Content-Type', 'text/html');
      res.writeHead(200);
      res.end(generateHome(config?.remotes ?? {}));
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

    let url: string;
    if (locals[module] && preference[module] !== 'remote') {
      // proxy to local dev server
      const local = locals[module];
      url = `http://localhost:${local.port}/${path}`;
    } else {
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

const createSocketListener =
  (preference: { [key: string]: 'local' | 'remote' }) => (data: any) => {
    const message = JSON.parse(data.toString());
    if (!message || !message.module || !message.source) return;

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
export default function startServer(
  config: { [key: string]: any },
  host: string,
  port: number
) {
  let server: Server;

  const locals: { [key: string]: RemoteService } = {}; // local dev servers of known module names
  const preference: { [key: string]: 'local' | 'remote' } = {}; // user preference for local/remote

  const httpListener = createListener(config, locals, preference);
  const wsListener = createSocketListener(preference);

  server = http.createServer(httpListener);

  server.on('error', (e: Error & { code: string }) => {
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
    console.log(
      `Server is running on http://${host}${addr?.port ? `:${addr.port}` : ''}`
    );
  });

  const wss = new WebSocketServer({
    noServer: true,
  });

  const clients: WebSocket[] = [];
  wss.on('connection', (ws: WebSocket) => {
    clients.push(ws);
    ws.on('error', console.error);
    ws.on('message', wsListener);

    // Send client currently known local webpack serverss
    const message: { [key: string]: number } = {};
    for (const [key, value] of Object.entries(locals)) {
      message[key] = value.port;
    }
    ws.send(JSON.stringify(message));
  });

  server.on('upgrade', (request: IncomingMessage, socket: any, head: any) => {
    // TODO: detect inactive sockets?
    wss.handleUpgrade(request, socket, head, (ws: any) => {
      wss.emit('connection', ws, request);
    });
  });

  const bonjour = bonjourConstructor();
  // TODO: detect webpack server dead
  const browser = bonjour.find(
    { type: 'http', subtypes: ['webpack'] },
    (data: RemoteService) => {
      locals[data.name] = data;
      const message: { [key: string]: number } = {};
      message[data.name] = data.port;
      console.log('webpack server registered: ', data.name);
      for (const client of clients) {
        client.send(JSON.stringify(message));
      }
    }
  );
  browser.start();

  server.listen({
    port,
    host,
  });
}
