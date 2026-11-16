import {createServer} from 'node:http';
import {pathToFileURL} from 'node:url';
import {DropshipError, PRIVATE_HEADERS, verifyBridge, seal, unseal} from '../../../../app/lib/dropshipping-transport.server.js';
import {createAppSdk} from './app-sdk.mjs';
import {createDevelopmentClients} from './shopify-client.mjs';
import {createPrivateStore} from './private-store.mjs';
import {createMerchantService} from './merchant-service.mjs';
import {TEST_SHOP} from './catalog-plan.mjs';

async function bodyOf(req) {
  const chunks = [];let size = 0;
  for await (const chunk of req) {
    size += chunk.length;if (size > 32768) throw new DropshipError('too-large', 413);chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}
const cookie = (request, name) => (request.headers.cookie || '').split(';').map((v) => v.trim()).find((v) => v.startsWith(`${name}=`))?.slice(name.length + 1);

export function createServiceServer(env, {port = 3460, service: suppliedService, sdk: suppliedSdk} = {}) {
  const oauthOrigin = env.DROPSHIP_OAUTH_ORIGIN || null;
  const returnOrigin = env.DROPSHIP_STOREFRONT_ORIGIN || null;
  // HTTPS origins must be separately registered and configured before live customer OAuth.
  for (const value of [oauthOrigin, returnOrigin].filter(Boolean)) {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new DropshipError('unconfigured');
  }
  const sdk = suppliedSdk || createAppSdk(env, oauthOrigin || `http://localhost:${port}`);
  const clients = suppliedService ? null : createDevelopmentClients(env);
  const service = suppliedService || createMerchantService({store: createPrivateStore(clients.admin), clients, sdk,
    secret: env.DROPSHIP_TOKEN_ENCRYPTION_KEY, oauthOrigin, returnOrigin});
  const seen = new Map();
  return createServer(async (req, res) => {
    const json = (value, status = 200) => {res.writeHead(status, {...PRIVATE_HEADERS, 'Content-Type': 'application/json; charset=utf-8', 'X-Content-Type-Options': 'nosniff'});res.end(JSON.stringify(value));};
    try {
      if (!["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(req.socket.remoteAddress) ||
        ![`127.0.0.1:${res.socket.localPort}`, `localhost:${res.socket.localPort}`, `[::1]:${res.socket.localPort}`].includes(req.headers.host)) throw new DropshipError('forbidden', 403);
      const url = new URL(req.url, `http://127.0.0.1:${res.socket.localPort}`);
      if (req.method === 'POST' && url.pathname === '/internal/merchant') {
        if (!req.headers['content-type']?.startsWith('application/json')) throw new DropshipError('invalid', 415);
        const body = await bodyOf(req);
        const request = new Request(url, {method: 'POST', headers: req.headers, body});
        const tenant = await verifyBridge(env.DROPSHIP_TOKEN_ENCRYPTION_KEY, request, body, seen);
        let input;try {input = JSON.parse(body);} catch {throw new DropshipError('invalid', 400);}
        if (!input || typeof input !== 'object' || Array.isArray(input)) throw new DropshipError('invalid', 400);
        let result;
        switch (input.action) {
          case 'workspace': result = await service.workspace(tenant);break;
          case 'connect-development': result = await service.connectDevelopment(tenant);break;
          case 'disconnect': result = await service.disconnect(tenant, input.connectionId);break;
          case 'connect': result = await service.prepareOAuth(tenant, input.shop, input.locale);break;
          case 'products': result = await service.products(tenant, input.connectionId);break;
          case 'import': result = await service.importProduct(tenant, input.connectionId, input.handle);break;
          default: throw new DropshipError('invalid', 400);
        }
        return json({success: true, ...result});
      }
      if (req.method === 'GET' && url.pathname === '/auth/start' && oauthOrigin && returnOrigin) {
        const flow = await unseal(env.DROPSHIP_TOKEN_ENCRYPTION_KEY, url.searchParams.get('ticket'), 'oauth-ticket');
        if (!Number.isFinite(flow.expires) || flow.expires < Date.now() || flow.expires > Date.now() + 60000 || flow.shop !== TEST_SHOP) throw new DropshipError('expired', 401);
        const metadata = await seal(env.DROPSHIP_TOKEN_ENCRYPTION_KEY, flow, 'oauth-flow');
        const flowCookie = `seine_oauth_flow=${metadata}; HttpOnly; Secure; SameSite=Lax; Path=/auth; Max-Age=60`;
        // The Node SDK replaces Set-Cookie during begin; preserve both its signed state and our tenant binding.
        const response = new Proxy(res, {get(target, name) {
          if (name === 'setHeader') return (header, value) => target.setHeader(header, header.toLowerCase() === 'set-cookie' ? [flowCookie, ...(Array.isArray(value) ? value : [value])] : value);
          const value = Reflect.get(target, name);return typeof value === 'function' ? value.bind(target) : value;
        }});
        return await sdk.auth.begin({shop: flow.shop, callbackPath: '/auth/callback', isOnline: false, rawRequest: req, rawResponse: response});
      }
      if (req.method === 'GET' && url.pathname === '/auth/callback' && oauthOrigin && returnOrigin) {
        const flow = await unseal(env.DROPSHIP_TOKEN_ENCRYPTION_KEY, cookie(req, 'seine_oauth_flow'), 'oauth-flow');
        if (!Number.isFinite(flow.expires) || flow.expires < Date.now() || flow.shop !== url.searchParams.get('shop') || flow.shop !== TEST_SHOP) throw new DropshipError('expired', 401);
        const {session, headers} = await sdk.auth.callback({expiring: true, rawRequest: req, rawResponse: res});
        await service.saveConnection(flow.tenant, session, 'oauth');
        // The official Node adapter applies callback cookies directly and returns no header object.
        for (const [name, value] of Object.entries(headers || {})) res.setHeader(name, value);
        const current = res.getHeader('Set-Cookie');
        res.setHeader('Set-Cookie', [...(Array.isArray(current) ? current : current ? [current] : []), 'seine_oauth_flow=; HttpOnly; Secure; SameSite=Lax; Path=/auth; Max-Age=0']);
        const origin = new URL(returnOrigin);
        if (origin.protocol !== 'https:') throw new DropshipError('unconfigured');
        const path = flow.locale === 'ja' ? '/jp/dropshipping' : flow.locale === 'de' ? '/de/dropshipping' : '/dropshipping';
        res.writeHead(303, {...PRIVATE_HEADERS, Location: new URL(path, origin).href});return res.end();
      }
      throw new DropshipError('not-found', 404);
    } catch (error) {
      if (!res.headersSent) json({success: false, code: error instanceof DropshipError ? error.code : 'unavailable'}, error instanceof DropshipError ? error.status : 503);
      else res.end();
    }
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const server = createServiceServer(process.env);
    server.on('error', () => {process.stderr.write('Dropshipping service could not start.\n');process.exitCode = 1;});
    server.listen(3460, '127.0.0.1', () => process.stdout.write('Seine Shop development service listening on http://127.0.0.1:3460\n'));
  } catch {process.stderr.write('Dropshipping service is not configured.\n');process.exitCode = 1;}
}
