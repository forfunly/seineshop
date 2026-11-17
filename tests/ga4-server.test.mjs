import {test} from 'node:test';
import assert from 'node:assert/strict';
import {anonymousContext, checkoutServerAttributes, dispatchCartAnalytics, hmac, readServerProof, sendGa4, SERVER_PROOF_KEY, validWebhook} from '../app/lib/ga4-server.server.js';
import {analyticsAccessToken, deliverPurchase, orderStore, purchaseParams} from '../app/lib/ga4-orders.server.js';
import {checkoutReceipt, paidWebhook} from '../app/lib/ga4-endpoints.server.js';

const now = 1800000000000;
const env = {GA4_SERVER_ENABLED: 'true', GA4_SERVER_PURCHASE_ENABLED: 'true', GA4_API_SECRET: 'test-only-api-secret',
  GA4_ADMIN_ACCESS_TOKEN: 'test-only-admin', GA4_WEBHOOK_SECRET: 'test-only-webhook', SESSION_SECRET: 'test-only-session', PUBLIC_STORE_DOMAIN: 'unit-test.myshopify.com'};
const identity = new Map([['gaClientId', '123.456'], ['gaSessionId', '789'], ['ga4', '1']]);
const money = (amount, currencyCode = 'USD') => ({presentmentMoney: {amount: String(amount), currencyCode}});
const order = () => ({id: 'gid://shopify/Order/123', test: false, cancelledAt: null, taxesIncluded: false,
  displayFinancialStatus: 'PAID', customAttributes: [], subtotalPriceSet: money(36), totalTaxSet: money(3), totalShippingPriceSet: money(12),
  lineItems: {pageInfo: {hasNextPage: false}, nodes: [{title: 'Charging station', variantTitle: 'Black', quantity: 2,
    variant: {id: 'gid://shopify/ProductVariant/42'}, originalUnitPriceSet: money(20), discountAllocations: [{allocatedAmountSet: money(4)}]}]}});

function memoryStore(initial) {
  let row = structuredClone(initial);
  let generation = 0;
  return {
    read: async () => structuredClone(row),
    write: async (previous, state) => {
      if ((previous.metafield?.compareDigest ?? null) !== (row.metafield?.compareDigest ?? null)) return null;
      row = {...row, metafield: {value: JSON.stringify(state), compareDigest: String(++generation)}};
      return structuredClone(row);
    },
  };
}
const consented = () => ({...order(), metafield: {value: JSON.stringify({consent: true, context: {client_id: '123.456', session_id: 789}}), compareDigest: '0'}});

test('signed checkout proof rejects forgery, expiration, future timestamps and unsafe identifiers', async () => {
  const [{value: proof}] = await checkoutServerAttributes(identity, env, now);
  assert.equal((await readServerProof(proof, env, now)).client_id, '123.456');
  assert.equal(await readServerProof(`${proof}x`, env, now), null);
  assert.equal(await readServerProof(proof, env, now + 86400001), null);
  assert.equal(await readServerProof(proof, env, now - 61000), null);
  assert.deepEqual(await checkoutServerAttributes(identity, {}, now), []);
  assert.deepEqual(await checkoutServerAttributes(new Map([...identity, ['ga4', '0']]), env, now), []);
  assert.equal(anonymousContext(new Map([['gaClientId', 'person@example.com'], ['gaSessionId', '789']])), null);
  assert.equal(anonymousContext(new Map([['gaClientId', '123.456'], ['gaSessionId', '99999999999999999999']])), null);
});

test('MP sends only anonymous IDs and server-mapped events; network uncertainty hides credentials', async () => {
  let body;
  const result = await sendGa4(env, {client_id: '123.456', session_id: 789}, [{name: 'purchase', params: purchaseParams(order())}], async (url, options) => {
    assert.equal(new URL(url).hostname, 'www.google-analytics.com');
    assert.equal(new URL(url).searchParams.get('measurement_id'), 'G-BKLZMJ9EP7');
    body = JSON.parse(options.body);
    return new Response(null, {status: 204});
  });
  assert.equal(result.status, 'accepted');
  assert.equal(body.events[0].params.session_id, 789);
  assert.equal(body.consent.ad_user_data, 'DENIED');
  assert.ok(!JSON.stringify(body).includes('test-only'));
  assert.deepEqual(await sendGa4(env, {}, [{name: 'purchase'}], async () => {throw new Error(env.GA4_API_SECRET);}), {status: 'uncertain'});
});

test('server cart ownership prevents browser double-send, and keeps the browser when unconfigured or unidentified', async () => {
  const result = {cart: {id: 'private'}, ga4: {events: [{currency: 'USD', value: 36, items: []}]}};
  const jobs = [];
  let calls = 0;
  const context = {env, waitUntil: (job) => jobs.push(job)};
  const dispatched = dispatchCartAnalytics(result, identity, context, async () => {calls++; return new Response(null, {status: 204});});
  assert.equal(dispatched.ga4, undefined);
  await Promise.all(jobs);
  assert.equal(calls, 1);
  assert.equal(dispatchCartAnalytics(result, identity, {...context, env: {}}), result);
  assert.equal(dispatchCartAnalytics(result, new Map([['ga4', '0']]), context), result);
  assert.equal(dispatchCartAnalytics(result, new Map([['ga4', '1']]), context), result);
});

test('order mapping uses presentment prices minus discounts and rejects unsupported or unpaid orders', () => {
  const params = purchaseParams(order());
  assert.equal(params.value, 36); assert.equal(params.items[0].price, 18);
  assert.equal(params.shipping, 12); assert.equal(params.tax, 3);
  assert.equal(params.transaction_id, '123');
  for (const change of [{test: true}, {cancelledAt: 'date'}, {displayFinancialStatus: 'PENDING'}, {subtotalPriceSet: money(35)}, {totalTaxSet: money(3, 'EUR')}]) {
    assert.equal(purchaseParams({...order(), ...change}), null);
  }
  const missingVariant = order(); missingVariant.lineItems.nodes[0].variant = null;
  assert.equal(purchaseParams(missingVariant), null);
});

test('tax-inclusive orders exclude item and shipping taxes from GA4 value and shipping', () => {
  const inclusive = {...order(), taxesIncluded: true, totalTaxSet: money(4)};
  inclusive.lineItems.nodes[0].taxLines = [{priceSet: money(3)}];
  const params = purchaseParams(inclusive);
  assert.equal(params.value, 33);
  assert.equal(params.items[0].price, 16.5);
  assert.equal(params.shipping, 11);
  assert.equal(params.tax, 4);
});

test('CAS allows one sender under concurrent callbacks and repeated paid notifications', async () => {
  const store = memoryStore(consented());
  const first = await store.read();
  let calls = 0;
  const send = async () => {calls++; return {status: 'accepted'};};
  const results = await Promise.all([deliverPurchase(first, store, env, send), deliverPurchase(first, store, env, send)]);
  assert.deepEqual(results.map(({status}) => status).sort(), ['accepted', 'conflict']);
  assert.equal((await deliverPurchase(await store.read(), store, env, send)).status, 'accepted');
  assert.equal(calls, 1);
});

test('uncertain or interrupted deliveries never automatically resend and unpaid/no-consent orders never send', async () => {
  const store = memoryStore(consented());
  let calls = 0;
  const send = async () => {calls++; return {status: 'uncertain'};};
  assert.equal((await deliverPurchase(await store.read(), store, env, send)).status, 'uncertain');
  assert.equal((await deliverPurchase(await store.read(), store, env, send)).status, 'uncertain');
  assert.equal(calls, 1);
  assert.equal((await deliverPurchase(order(), store, env, () => assert.fail())).status, 'awaiting-consent');
  assert.equal((await deliverPurchase({...consented(), displayFinancialStatus: 'PENDING'}, store, env, () => assert.fail())).status, 'ineligible');
});

async function webhook(payload, overrides = {}) {
  const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const signature = Buffer.from(await hmac(env.GA4_WEBHOOK_SECRET, body)).toString('base64');
  return new Request('https://example.com/api/ga4-orders-paid', {method: 'POST', body,
    headers: {'x-shopify-hmac-sha256': signature, 'x-shopify-topic': 'orders/paid', 'x-shopify-shop-domain': env.PUBLIC_STORE_DOMAIN, ...overrides}});
}

test('webhook verifies raw bytes, signature, shop and topic; malformed and oversized payloads do not read orders', async () => {
  const store = {read: () => assert.fail('Must reject before order access')};
  for (const headers of [{'x-shopify-hmac-sha256': 'fake'}, {'x-shopify-shop-domain': 'other.myshopify.com'}, {'x-shopify-topic': 'orders/create'}]) {
    assert.equal((await paidWebhook(await webhook({id: 123}, headers), env, store)).status, 401);
  }
  assert.equal((await paidWebhook(await webhook('null'), env, store)).status, 400);
  assert.equal((await paidWebhook(await webhook('{'), env, store)).status, 400);
  assert.equal((await paidWebhook(await webhook('x'.repeat(1024 * 1024 + 1)), env, store)).status, 413);
  assert.equal(await validWebhook(await webhook({id: 123}), new TextEncoder().encode('{"id":124}'), env), false);
});

test('paid webhook sends nothing without final consent; late allowed checkout receipt supplies it exactly once', async () => {
  const [{value: proof}] = await checkoutServerAttributes(identity, env, now);
  const row = order(); row.customAttributes = [{key: SERVER_PROOF_KEY, value: proof}];
  const store = memoryStore(row);
  let calls = 0;
  const send = async () => {calls++; return {status: 'accepted'};};
  assert.equal((await paidWebhook(await webhook({id: 123}), env, store, send)).status, 200);
  assert.equal(calls, 0);
  const receipt = () => new Request('https://example.com/api/ga4-checkout', {method: 'POST',
    headers: {'Content-Type': 'application/json'}, body: JSON.stringify({orderId: '123', proof, analyticsAllowed: true})});
  assert.equal((await checkoutReceipt(receipt(), env, store, send, now)).status, 200);
  assert.equal((await checkoutReceipt(receipt(), env, store, send, now)).status, 200);
  await paidWebhook(await webhook({id: 123}), env, store, send);
  assert.equal(calls, 1);
});

test('final consent can precede payment; later paid webhook sends the stored event', async () => {
  const [{value: proof}] = await checkoutServerAttributes(identity, env, now);
  const row = {...order(), displayFinancialStatus: 'PENDING', customAttributes: [{key: SERVER_PROOF_KEY, value: proof}]};
  const store = memoryStore(row);
  let calls = 0;
  const send = async () => {calls++; return {status: 'accepted'};};
  const receipt = new Request('https://example.com/api/ga4-checkout', {method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({orderId: '123', proof, analyticsAllowed: true})});
  await checkoutReceipt(receipt, env, store, send, now);
  assert.equal(calls, 0);
  const paid = {...await store.read(), displayFinancialStatus: 'PAID'};
  const paidStore = memoryStore(paid);
  await paidWebhook(await webhook({id: 123}), env, paidStore, send);
  assert.equal(calls, 1);
});

test('checkout receipt rejects another order, denied consent, expiry and body injection; CORS preflight needs no credentials', async () => {
  const [{value: proof}] = await checkoutServerAttributes(identity, env, now);
  const store = memoryStore(order());
  for (const payload of [{orderId: '123', proof, analyticsAllowed: false}, {orderId: '123', proof: `${proof}x`, analyticsAllowed: true}]) {
    const req = new Request('https://example.com/api/ga4-checkout', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)});
    assert.ok((await checkoutReceipt(req, env, store, () => assert.fail(), now)).status >= 400);
  }
  const mismatch = new Request('https://example.com/api/ga4-checkout', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({orderId: '123', proof, analyticsAllowed: true})});
  assert.equal((await checkoutReceipt(mismatch, env, store, () => assert.fail(), now)).status, 403);
  const preflight = await checkoutReceipt(new Request('https://example.com/api/ga4-checkout', {method: 'OPTIONS'}), {});
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('Access-Control-Allow-Origin'), '*');
  assert.equal(preflight.headers.get('Access-Control-Allow-Credentials'), null);
});

test('private ledger definition must already exist; a missing definition never implicitly creates schema', async () => {
  const store = orderStore(env, async () => Response.json({data: {order: order(), definition: null}}));
  await assert.rejects(store.read('gid://shopify/Order/123'), /definition/);
});

test('own-store client credentials share a concurrent token request and keep secrets out of token URLs', async () => {
  const config = {...env, GA4_ADMIN_ACCESS_TOKEN: undefined, GA4_ADMIN_CLIENT_ID: 'unit-client', GA4_ADMIN_CLIENT_SECRET: 'unit-client-secret'};
  let requests = 0;
  const fetcher = async (url, options) => {
    requests++;
    assert.equal(new URL(url).pathname, '/admin/oauth/access_token');
    assert.ok(!url.includes('secret'));
    assert.equal(options.redirect, 'error');
    assert.equal(new URLSearchParams(options.body).get('grant_type'), 'client_credentials');
    return Response.json({access_token: 'unit-ephemeral-token', expires_in: 86400});
  };
  assert.deepEqual(await Promise.all([analyticsAccessToken(config, fetcher), analyticsAccessToken(config, fetcher)]), ['unit-ephemeral-token', 'unit-ephemeral-token']);
  assert.equal(await analyticsAccessToken(config, fetcher), 'unit-ephemeral-token');
  assert.equal(requests, 1);
});
