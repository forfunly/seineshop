import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';

const source = await readFile(new URL('../scripts/ga4-checkout-pixel.js', import.meta.url), 'utf8');

test('Shopify can discover the checkout subscriptions without executing dynamic event-name code', () => {
  const subscriptions = Array.from(source.matchAll(/analytics\.subscribe\(\s*(['"])([^'"]+)\1/g), (match) => match[2]);
  assert.deepEqual(subscriptions, ['checkout_started', 'payment_info_submitted', 'checkout_completed']);
});

function harness({allowed = true, storage = new Map(), blockedStorage = false, fetcher = async () => {throw new Error('Unexpected network');}} = {}) {
  const subscriptions = {};
  const scripts = [];
  let changeConsent;
  const window = {};
  vm.runInNewContext(source, {
    window, crypto: webcrypto, TextEncoder, Uint8Array, Date, fetch: fetcher,
    init: {customerPrivacy: {analyticsProcessingAllowed: allowed}},
    api: {customerPrivacy: {subscribe: (_event, callback) => {changeConsent = callback;}}},
    analytics: {subscribe: (name, callback) => {subscriptions[name] = callback;}},
    browser: {localStorage: {
      getItem: async (key) => {if (blockedStorage) throw new Error('Denied'); return storage.get(key);},
      setItem: async (key, value) => {if (blockedStorage) throw new Error('Denied'); storage.set(key, value);},
    }},
    document: {createElement: () => ({}), head: {appendChild: (script) => scripts.push(script)}},
  });
  return {
    send: (event) => subscriptions[event.name](event),
    consent: (allow) => changeConsent({customerPrivacy: {analyticsProcessingAllowed: allow}}),
    events: () => Array.from(window.dataLayer || [], (entry) => Array.from(entry)).filter(([action]) => action === 'event'),
    commands: () => Array.from(window.dataLayer || [], (entry) => Array.from(entry)), scripts, storage,
  };
}

test('server-mode purchase sends only the signed consent receipt and never a browser purchase', async () => {
  const requests = [];
  const pixel = harness({fetcher: async (url, options) => {
    requests.push({url, body: JSON.parse(options.body), credentials: options.credentials});
    return {ok: false, status: 503};
  }});
  const data = event('checkout_completed', {attributes: [{key: 'seine_ga_server_proof', value: 'signed-proof'}]});
  await pixel.send(data);
  await pixel.send(data);
  assert.equal(pixel.events().length, 0);
  assert.equal(pixel.scripts.length, 0);
  assert.equal(requests[0].url, 'https://www.seineshop.com/api/ga4-checkout');
  assert.equal(requests[0].credentials, 'omit');
  assert.deepEqual(requests[0].body, {orderId: '123', proof: 'signed-proof', analyticsAllowed: true});
  assert.ok(!JSON.stringify(requests).includes('private'));
  pixel.consent(false);
  await pixel.send(data);
  assert.equal(requests.length, 2);
});

function event(name, overrides = {}) {
  const now = Date.now();
  return {
    id: `event-${name}`, name, timestamp: new Date(now).toISOString(),
    context: {document: {location: {href: 'https://ps83if-c4.myshopify.com/checkouts/private-token?email=private@example.com'}}},
    data: {checkout: {
      token: 'private-checkout-token', currencyCode: 'USD', order: {id: 'gid://shopify/Order/123'},
      email: 'private@example.com', phone: '+123456789', shippingAddress: {address1: 'Private address'},
      attributes: [{key: 'seine_ga_client_id', value: '123.456'}, {key: 'seine_ga_session_id', value: '789'}, {key: 'seine_ga_captured_at', value: String(now)}],
      totalPrice: {amount: 51}, totalTax: {amount: 3}, shippingLine: {price: {amount: 12}},
      lineItems: [{quantity: 2, title: 'Station', variant: {id: 'gid://shopify/ProductVariant/42', title: 'Black', price: {amount: 20}, product: {title: 'Station'}}, finalLinePrice: {amount: 36}, discountAllocations: [{amount: {amount: 4}}]}],
      ...overrides,
    }},
  };
}

test('Shopify callbacks produce the three GA4 events with discounted value, shipping, tax and stable variant/order IDs', async () => {
  const pixel = harness();
  for (const name of ['checkout_started', 'payment_info_submitted', 'checkout_completed']) await pixel.send(event(name));
  assert.deepEqual(pixel.events().map((entry) => entry[1]), ['begin_checkout', 'add_payment_info', 'purchase']);
  const purchase = pixel.events()[2][2];
  assert.equal(purchase.value, 36);
  assert.equal(purchase.items[0].price, 18);
  assert.equal(purchase.items[0].item_id, '42');
  assert.equal(purchase.transaction_id, '123');
  assert.equal(purchase.tax, 3); assert.equal(purchase.shipping, 12);
  assert.equal(purchase.session_id, '789');
  assert.equal(pixel.commands().find(([action]) => action === 'config')[2].client_id, '123.456');
  assert.equal(pixel.scripts.length, 1);
  assert.ok(!JSON.stringify(pixel.commands()).includes('private'));
  assert.ok(!JSON.stringify([...pixel.storage.values()]).includes('private-checkout-token'));
  assert.ok(!pixel.events().some((entry) => ['page_view', 'session_start'].includes(entry[1])));
});

test('duplicate concurrent callbacks and reloads do not duplicate transactions or checkout steps', async () => {
  const storage = new Map();
  const pixel = harness({storage});
  await Promise.all([pixel.send(event('checkout_completed')), pixel.send(event('checkout_completed'))]);
  await pixel.send(event('checkout_started'));
  await pixel.send({...event('checkout_started'), id: 'different-callback-id'});
  assert.equal(pixel.events().length, 2);
  const reloaded = harness({storage});
  await reloaded.send(event('checkout_completed'));
  assert.equal(reloaded.events().length, 0);
});

test('analytics refusal, grant and revocation control both script loading and callbacks', async () => {
  const pixel = harness({allowed: false});
  await pixel.send(event('checkout_started'));
  assert.equal(pixel.scripts.length, 0);
  pixel.consent(true);
  await pixel.send(event('checkout_started'));
  assert.equal(pixel.events().length, 1);
  pixel.consent(false);
  await pixel.send(event('checkout_completed'));
  assert.equal(pixel.events().length, 1);
});

test('missing order and malformed prices do not invent revenue; fallback prices subtract discounts', async () => {
  const pixel = harness();
  await pixel.send(event('checkout_completed', {order: null}));
  await pixel.send(event('checkout_completed', {lineItems: [{quantity: 1, variant: {id: '42', price: {amount: 'NaN'}}}]}));
  assert.equal(pixel.events().length, 0);
  const fallback = event('checkout_completed');
  delete fallback.data.checkout.lineItems[0].finalLinePrice;
  await pixel.send(fallback);
  assert.equal(pixel.events()[0][2].value, 36);
});

test('expired session identity is not forced into a later checkout', async () => {
  const pixel = harness();
  const sample = event('checkout_completed');
  sample.data.checkout.attributes[2].value = String(Date.now() - 31 * 60000);
  await pixel.send(sample);
  assert.equal(pixel.events()[0][2].session_id, undefined);
  assert.equal(pixel.events()[0][2].client_id, '123.456');
});

test('restricted storage still permits one callback with in-memory deduplication', async () => {
  const pixel = harness({blockedStorage: true});
  await pixel.send(event('checkout_completed'));
  await pixel.send(event('checkout_completed'));
  assert.equal(pixel.events().length, 1);
});

test('a checkout with over 200 items keeps one purchase and full value instead of duplicate transactions', async () => {
  const pixel = harness();
  const sample = event('checkout_completed');
  sample.data.checkout.lineItems = Array.from({length: 250}, (_, i) => ({quantity: 1, title: `Item ${i}`, variant: {id: String(i + 1)}, finalLinePrice: {amount: 1}}));
  await pixel.send(sample);
  assert.equal(pixel.events().length, 1);
  assert.equal(pixel.events()[0][2].items.length, 200);
  assert.equal(pixel.events()[0][2].value, 250);
});
