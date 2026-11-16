import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {request as httpRequest} from 'node:http';
import {signedHeaders, verifyBridge, seal, unseal, serviceOrigin} from '../app/lib/dropshipping-transport.server.js';
import {dropshipReturnPath, dropshipProductHandle} from '../app/lib/dropshipping.js';
import {localizedRedirectPath} from '../app/lib/locale.js';
import {dropshippingLoader, dropshippingAction} from '../app/lib/dropshipping.server.js';
import {createPrivateStore, STORE_QUERY, STORE_MUTATION} from '../apps/dropshipping/seine-shop-dropshipping-dev/src/private-store.mjs';
import {createMerchantService} from '../apps/dropshipping/seine-shop-dropshipping-dev/src/merchant-service.mjs';
import {restoreSession} from '../apps/dropshipping/seine-shop-dropshipping-dev/src/app-sdk.mjs';
import {createServiceServer} from '../apps/dropshipping/seine-shop-dropshipping-dev/src/service-server.mjs';
import {TEST_SHOP, ImportError} from '../apps/dropshipping/seine-shop-dropshipping-dev/src/catalog-plan.mjs';

const secret = 'ab'.repeat(32), tenant = 'gid://shopify/Customer/123', other = 'gid://shopify/Customer/456';
const state = () => ({version: 1, entries: {}});
function memoryStore() {
  const data = {vault: state(), ledger: state()};
  return {data, get: async (name) => structuredClone(data[name]), update: async (name, mutate) => {
    data[name] = mutate(structuredClone(data[name]));return structuredClone(data[name]);
  }};
}
function session(expired = false) {
  return restoreSession({id: 'offline_test', shop: TEST_SHOP, state: '', isOnline: false,
    scope: 'write_products,write_metaobjects,read_metaobject_definitions', accessToken: 'not-a-real-token',
    ...(expired ? {expires: new Date(0), refreshToken: 'not-a-real-refresh', refreshTokenExpires: new Date(Date.now() + 600000)} : {})});
}
function merchant(options = {}) {
  const store = memoryStore();
  return {store, service: createMerchantService({store, secret, clients: {developmentSession: async () => session(), admin: async () => ({}), source: async () => ({})}, ...options})};
}

test('bridge authenticates all request context, rejects tampering, expiry and replay', async () => {
  const body = '{"action":"workspace"}', now = Date.now();
  const headers = await signedHeaders(secret, tenant, 'POST', '/internal/merchant', body, now);
  const req = () => new Request('http://127.0.0.1:3460/internal/merchant', {method: 'POST', headers});
  const seen = new Map();
  assert.equal(await verifyBridge(secret, req(), body, seen, now), tenant);
  await assert.rejects(verifyBridge(secret, req(), body, seen, now), /replayed/);
  for (const [url, change, content] of [
    ['http://127.0.0.1:3460/elsewhere', {}, body],
    [req().url, {'X-Seine-Tenant': other}, body],
    [req().url, {}, '{"action":"import"}'],
  ]) await assert.rejects(verifyBridge(secret, new Request(url, {method: 'POST', headers: {...headers, ...change}}), content, new Map(), now), /forbidden/);
  await assert.rejects(verifyBridge(secret, req(), body, new Map(), now + 60001), /forbidden/);
});

test('encrypted authorization cannot be read under another tenant, shop or purpose', async () => {
  const encrypted = await seal(secret, {token: 'not-a-real-token'}, `${tenant}:${TEST_SHOP}`);
  assert.deepEqual(await unseal(secret, encrypted, `${tenant}:${TEST_SHOP}`), {token: 'not-a-real-token'});
  for (const context of [`${other}:${TEST_SHOP}`, `${tenant}:other.myshopify.com`, 'oauth-ticket'])
    await assert.rejects(unseal(secret, encrypted, context), /invalid-authorization/);
  assert.doesNotMatch(encrypted, /not-a-real-token/);
});

test('service addresses and login returns refuse insecure or arbitrary destinations', () => {
  assert.equal(serviceOrigin('http://127.0.0.1:3460', 'http://localhost:3000'), 'http://127.0.0.1:3460');
  for (const value of ['http://remote.example', 'https://user:pass@example.com', 'https://example.com/path', 'https://example.com/?a=1'])
    assert.throws(() => serviceOrigin(value, 'https://www.seineshop.com'), /unconfigured/);
  assert.throws(() => serviceOrigin('http://127.0.0.1:3460', 'https://www.seineshop.com'), /unconfigured/);
  for (const value of ['/dropshipping', '/de/dropshipping?product=test-item', '/jp/dropshipping']) assert.equal(dropshipReturnPath(value), value);
  for (const value of ['//evil.test', '/dropshipping?returnTo=https://evil.test', '/dropshipping/../account', '/dropshipping#x', '/dropshipping?product=x&other=y']) assert.equal(dropshipReturnPath(value), null);
  assert.equal(localizedRedirectPath('/de/dropshipping?product=test-item', '/account/authorize'), '/de/dropshipping?product=test-item');
  assert.equal(localizedRedirectPath('/jp/account/orders', '/account/authorize'), '/jp/account/orders');
  assert.equal(localizedRedirectPath('/account/orders', '/de/account/login'), '/de/account/orders');
  assert.equal(dropshipProductHandle('https://www.seineshop.com/de/products/test-item?Color=Black'), 'test-item');
  for (const value of ['https://www.seineshop.com.evil.test/products/item', 'https://evil.test/products/item', 'http://www.seineshop.com/products/item', 'https://x@www.seineshop.com/products/item', 'https://www.seineshop.com/cart']) assert.equal(dropshipProductHandle(value), null);
});

function shopState() {
  return {shop: {id: 'gid://shopify/Shop/1', myshopifyDomain: TEST_SHOP, vault: null, ledger: null},
    vaultDefinition: {type: {name: 'json'}, access: {storefront: 'NONE'}}, ledgerDefinition: {type: {name: 'json'}, access: {storefront: 'NONE'}}};
}
test('private storage creates with null digest, retries conflicts with fresh state and preserves concurrent rows', async () => {
  const data = shopState(), calls = [];let conflict = true;
  const store = createPrivateStore(async (query, variables) => {
    if (query === STORE_QUERY) return structuredClone(data);
    assert.equal(query, STORE_MUTATION);
    const row = variables.metafields[0];calls.push(row);
    if (conflict) {
      conflict = false;
      data.shop.vault = {jsonValue: {version: 1, entries: {['c'.repeat(64)]: {tenant: other}}}, compareDigest: 'new-digest'};
      return {metafieldsSet: {userErrors: [{code: 'INVALID_COMPARE_DIGEST'}]}};
    }
    data.shop.vault = {jsonValue: JSON.parse(row.value), compareDigest: 'saved-digest'};
    return {metafieldsSet: {metafields: [{key: row.key}], userErrors: []}};
  });
  await store.update('vault', (value) => {value.entries['d'.repeat(64)] = {tenant};return value;});
  assert.equal(calls[0].compareDigest, null);assert.equal(calls[1].compareDigest, 'new-digest');
  assert.equal(Object.keys((await store.get('vault')).entries).length, 2);
});
test('private storage refuses public definitions, wrong target, corrupt values and capacity overflow before writes', async () => {
  for (const mutate of [
    (d) => {d.shop.myshopifyDomain = 'other.myshopify.com';},
    (d) => {d.vaultDefinition.access.storefront = 'PUBLIC_READ';},
    (d) => {d.shop.vault = {jsonValue: null};},
    (d) => {d.shop.ledger = {jsonValue: {version: 1, entries: []}};},
  ]) {
    const data = shopState();mutate(data);
    await assert.rejects(createPrivateStore(async (q) => {assert.equal(q, STORE_QUERY);return data;}).get('vault'));
  }
  const store = createPrivateStore(async (q) => {assert.equal(q, STORE_QUERY);return shopState();});
  await assert.rejects(store.update('vault', (v) => {
    for (let i = 0; i < 21; i++) v.entries[i.toString(16).padStart(64, '0')] = {tenant};return v;
  }), /storage-full/);
});

test('workspace isolates tenants and encrypted sessions, prevents another account claiming an active shop', async () => {
  const {service, store} = merchant();
  const connected = await service.connectDevelopment(tenant);
  assert.equal(connected.kind, 'development');
  assert.doesNotMatch(JSON.stringify(await service.workspace(tenant)), /not-a-real-token|encrypted|refreshToken/);
  assert.doesNotMatch(JSON.stringify(store.data.vault), /not-a-real-token/);
  assert.equal((await service.workspace(other)).connections.length, 0);
  await assert.rejects(service.connectDevelopment(other), /shop-already-connected/);
  await assert.rejects(service.products(other, connected.id), /connection-not-found/);
  await assert.rejects(service.disconnect(other, connected.id), /connection-not-found/);
  await service.disconnect(tenant, connected.id);
  await assert.rejects(service.products(tenant, connected.id), /connection-not-found/);
  assert.equal((await service.workspace(tenant)).connections[0].status, 'inactive');
});

test('a token refresh finishing after disconnect cannot reactivate the connection', async () => {
  let release;const gate = new Promise((r) => {release = r;});
  let entered;const started = new Promise((r) => {entered = r;});
  const {service} = merchant({sdk: {auth: {refreshToken: async () => {entered();await gate;return {session: session()};}}}});
  const connected = await service.saveConnection(tenant, session(true), 'oauth');
  const work = service.products(tenant, connected.id);
  await started;
  await service.disconnect(tenant, connected.id);release();
  await assert.rejects(work, /connection-not-found|reconnect-required/);
  assert.equal((await service.workspace(tenant)).connections[0].status, 'inactive');
});

test('failed import tasks persist for explicit recovery; concurrent repeats are blocked', async () => {
  let fail = true, release;const gate = new Promise((r) => {release = r;});
  const {service} = merchant({importer: async () => {
    if (fail) {fail = false;throw new ImportError('import-uncertain');}
    await gate;return {status: 'recovered', targetProductId: 'gid://shopify/Product/98'};
  }});
  const connection = await service.connectDevelopment(tenant);
  await assert.rejects(service.importProduct(tenant, connection.id, 'test-product'), /import-uncertain/);
  assert.equal((await service.workspace(tenant)).tasks[0].status, 'needs-review');
  const retry = service.importProduct(tenant, connection.id, 'test-product');
  await new Promise((r) => setImmediate(r));
  await assert.rejects(service.importProduct(tenant, connection.id, 'test-product'), /in-progress/);
  release();assert.equal((await retry).status, 'recovered');
  assert.equal((await service.workspace(tenant)).tasks[0].status, 'completed');
  assert.equal((await service.workspace(other)).tasks.length, 0);
});

test('HTTP service rejects rebinding, unsigned, replayed and malformed requests without invoking work', async (t) => {
  let calls = 0;
  const server = createServiceServer({DROPSHIP_TOKEN_ENCRYPTION_KEY: secret}, {port: 0, sdk: {}, service: {workspace: async (id) => {calls++;return {tenant: id};}}});
  server.listen(0, '127.0.0.1');await once(server, 'listening');t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`, path = '/internal/merchant', body = '{"action":"workspace"}';
  const headers = await signedHeaders(secret, tenant, 'POST', path, body);
  const first = await fetch(base + path, {method: 'POST', headers, body});assert.equal(first.status, 200);assert.equal((await first.json()).tenant, tenant);
  assert.equal((await fetch(base + path, {method: 'POST', headers, body})).status, 409);
  assert.equal((await fetch(base + path, {method: 'POST', headers: {'Content-Type': 'application/json'}, body})).status, 403);
  const rebound = await new Promise((resolve, reject) => {
    const req = httpRequest(base + path, {method: 'POST', headers: {...headers, Host: 'evil.test'}}, (res) => {res.resume();resolve(res.statusCode);});
    req.on('error', reject);req.end(body);
  });
  assert.equal(rebound, 403);
  const malformed = 'null';
  assert.equal((await fetch(base + path, {method: 'POST', headers: await signedHeaders(secret, tenant, 'POST', path, malformed), body: malformed})).status, 400);
  assert.equal(calls, 1);
});

test('official OAuth begin preserves both signed state cookies and encrypted tenant binding', async (t) => {
  const env = {DROPSHIP_APP_CLIENT_ID: 'a'.repeat(32), DROPSHIP_APP_CLIENT_SECRET: 'not-a-real-secret', DROPSHIP_TOKEN_ENCRYPTION_KEY: secret,
    DROPSHIP_OAUTH_ORIGIN: 'https://service.example', DROPSHIP_STOREFRONT_ORIGIN: 'https://store.example'};
  const server = createServiceServer(env, {port: 0, service: {saveConnection: () => assert.fail('No callback authorized')}});
  server.listen(0, '127.0.0.1');await once(server, 'listening');t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const ticket = await seal(secret, {tenant, shop: TEST_SHOP, locale: 'de', expires: Date.now() + 60000}, 'oauth-ticket');
  const browserAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36';
  const response = await fetch(`${base}/auth/start?ticket=${encodeURIComponent(ticket)}`, {redirect: 'manual', headers: {'User-Agent': browserAgent}});
  assert.equal(response.status, 302);
  const cookies = response.headers.getSetCookie();
  assert.ok(cookies.some((value) => value.startsWith('shopify_app_state=')));
  const flowCookie = cookies.find((value) => value.startsWith('seine_oauth_flow='));
  assert.ok(flowCookie);assert.match(flowCookie, /HttpOnly/);assert.match(flowCookie, /Secure/);
  const location = new URL(response.headers.get('location'));
  assert.equal(location.hostname, TEST_SHOP);assert.equal(location.searchParams.get('redirect_uri'), 'https://service.example/auth/callback');
  const invalidCallback = await fetch(`${base}/auth/callback?shop=${TEST_SHOP}&hmac=invalid&state=wrong`, {headers: {Cookie: flowCookie.split(';')[0], 'User-Agent': browserAgent}, redirect: 'manual'});
  assert.equal(invalidCallback.status, 503);
});

function context(authenticated = true) {
  const values = new Map([['businessVisitor', crypto.randomUUID()], ['businessCsrf', 'test-csrf']]);
  return {env: {DROPSHIP_SERVICE_URL: 'http://127.0.0.1:3460', DROPSHIP_TOKEN_ENCRYPTION_KEY: secret},
    session: {get: (k) => values.get(k), set: (k, v) => values.set(k, v)}, storefront: {i18n: {language: 'EN'}},
    customerAccount: {isLoggedIn: async () => authenticated, query: async () => ({data: {customer: {id: tenant}}})}};
}
test('OAuth callback accepts Node SDK direct headers and uses only the configured storefront destination', async (t) => {
  let saved;
  const server = createServiceServer({DROPSHIP_TOKEN_ENCRYPTION_KEY: secret, DROPSHIP_OAUTH_ORIGIN: 'https://service.example', DROPSHIP_STOREFRONT_ORIGIN: 'https://store.example'},
    {port: 0, sdk: {auth: {callback: async ({rawResponse}) => {rawResponse.setHeader('Set-Cookie', ['sdk_state=; Max-Age=0']);return {session: session()};}}},
      service: {saveConnection: async (id, value, kind) => {saved = {id, shop: value.shop, kind};}}});
  server.listen(0, '127.0.0.1');await once(server, 'listening');t.after(() => new Promise((resolve) => server.close(resolve)));
  const flow = await seal(secret, {tenant, shop: TEST_SHOP, locale: 'de', expires: Date.now() + 60000}, 'oauth-flow');
  const response = await fetch(`http://127.0.0.1:${server.address().port}/auth/callback?shop=${TEST_SHOP}&returnTo=https://evil.test`,
    {headers: {Cookie: `seine_oauth_flow=${flow}`}, redirect: 'manual'});
  assert.equal(response.status, 303);assert.equal(response.headers.get('location'), 'https://store.example/de/dropshipping');
  assert.deepEqual(saved, {id: tenant, shop: TEST_SHOP, kind: 'oauth'});
  assert.ok(response.headers.getSetCookie().some((c) => c.startsWith('sdk_state=')));
  assert.ok(response.headers.getSetCookie().some((c) => c.startsWith('seine_oauth_flow=;')));
});
function request(body, extra = {}) {
  return new Request('http://localhost:3000/api/dropshipping', {method: 'POST', headers: {'Content-Type': 'application/json', Origin: 'http://localhost:3000', 'X-Seine-CSRF': 'test-csrf', ...extra}, body: typeof body === 'string' ? body : JSON.stringify(body)});
}
test('storefront API derives tenant from login, forwards only allowed fields and protects private responses', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    assert.equal(init.headers['X-Seine-Tenant'], tenant);
    assert.deepEqual(JSON.parse(init.body), {action: 'import', connectionId: 'a'.repeat(64), handle: 'test-product', locale: 'en'});
    return Response.json({success: true, status: 'reused'});
  });
  const response = await dropshippingAction({request: request({action: 'import', tenant: other, token: 'ignore-me', connectionId: 'a'.repeat(64), handle: 'test-product'}), context: context()});
  assert.equal(response.status, 200);assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow');
});
test('storefront blocks guests, bad CSRF, invalid JSON and oversized bodies before service calls', async (t) => {
  t.mock.method(globalThis, 'fetch', () => assert.fail('No service request is allowed'));
  for (const [req, ctx, status] of [
    [request({action: 'import'}), context(false), 401],
    [request({action: 'import'}, {'X-Seine-CSRF': 'wrong'}), context(), 403],
    [request('null'), context(), 400],
    [request('x'.repeat(9000)), context(), 413],
  ]) assert.equal((await dropshippingAction({request: req, context: ctx})).status, status);
  const guest = await (await dropshippingLoader({request: new Request('http://localhost:3000/dropshipping'), context: context(false)})).json();
  assert.equal(guest.authenticated, false);assert.equal(guest.workspace, null);
});
