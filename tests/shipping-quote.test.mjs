import {test} from 'node:test';
import assert from 'node:assert/strict';
import {shippingInput, shippingQuoteLoader, shippingQuoteAction} from '../app/lib/shipping-quote.server.js';

const input = () => ({merchandiseId: 'gid://shopify/ProductVariant/456', quantity: 2, countryCode: 'US', provinceCode: 'CA', city: 'Los Angeles', zip: '90012', address1: '200 N Spring St'});
const request = (value, headers = {}) => new Request('http://localhost:3000/api/shipping-quote', {
  method: 'POST', body: JSON.stringify(value), headers: {Origin: 'http://localhost:3000', 'X-Seine-CSRF': 'csrf', 'Content-Type': 'application/json', ...headers},
});
function context(mutate) {
  const values = new Map([['businessVisitor', crypto.randomUUID()], ['businessCsrf', 'csrf']]);
  return {
    session: {get: (key) => values.get(key), set: (key, value) => values.set(key, value)},
    cart: {create: () => assert.fail('Saved cart must not change'), setCartId: () => assert.fail('Saved cart cookie must not change')},
    storefront: {i18n: {country: 'US', language: 'EN'}, CacheNone: () => ({}), mutate},
  };
}
function result() {
  return {cartCreate: {userErrors: [], warnings: [], cart: {
    id: 'private-cart-key', checkoutUrl: 'private-checkout',
    lines: {nodes: [{quantity: 2, merchandise: {id: input().merchandiseId, requiresShipping: true}}]},
    deliveryGroups: {nodes: [{deliveryAddress: {address1: 'private address'}, deliveryOptions: [{title: 'Standard', description: 'Configured delivery', handle: 'private-handle', estimatedCost: {amount: '12.00', currencyCode: 'USD'}}]}], pageInfo: {hasNextPage: false}},
  }}};
}

test('shipping estimate sanitizes cart input and keeps the saved cart, addresses and identifiers private', async () => {
  let calls = 0;
  const ctx = context(async (query, options) => {
    calls++;
    assert.match(query, /cartCreate/);
    assert.deepEqual(options.variables, {input: shippingInput(input()), country: 'US', language: 'EN'});
    assert.doesNotMatch(JSON.stringify(options), /0\.01|customerAccessToken|email|discountCodes/);
    return result();
  });
  const response = await shippingQuoteAction({request: request({...input(), price: '0.01', email: 'private@email.test', customerAccessToken: 'private-token', discountCodes: ['discount']}), context: ctx});
  assert.equal(calls, 1);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
  assert.equal(response.headers.get('Set-Cookie'), null);
  assert.match(response.headers.get('X-Robots-Tag'), /noindex/);
  const body = await response.text();
  assert.doesNotMatch(body, /private|address|checkout|cart-key|handle|customer/i);
  assert.deepEqual(JSON.parse(body), {success: true, status: 'ready', groups: [{id: 'shipment-1', options: [{id: 'option-1', title: 'Standard', description: 'Configured delivery', cost: {amount: '12.00', currencyCode: 'USD'}}]}]});
});

test('rejects invalid destination, variant and quantity before creating a quote cart', async () => {
  for (const change of [
    {countryCode: 'ZZ'}, {countryCode: 'US', provinceCode: 'ON'}, {provinceCode: ''}, {provinceCode: 'California'},
    {address1: ' '}, {city: ''}, {zip: ''}, {zip: 'x'.repeat(33)}, {city: 'city\nname'},
    {quantity: 0}, {quantity: '2'}, {quantity: 1.5}, {quantity: 10000},
    {merchandiseId: ['gid://shopify/ProductVariant/456']}, {merchandiseId: 'gid://shopify/Product/456'},
  ]) {
    const invalid = {...input(), ...change};
    assert.equal(shippingInput(invalid), null);
    assert.equal((await shippingQuoteAction({request: request(invalid), context: context(() => assert.fail('Invalid input must not query Shopify'))})).status, 400);
  }
  assert.equal(shippingInput({...input(), countryCode: 'DE', provinceCode: ''}).buyerIdentity.countryCode, 'DE');
  assert.equal(shippingInput({...input(), countryCode: 'JP', provinceCode: 'JP-13'}).delivery.addresses[0].address.deliveryAddress.provinceCode, 'JP-13');
});

test('cross-site, missing CSRF and oversized estimates are refused before Shopify', async () => {
  for (const headers of [{Origin: 'https://evil.test'}, {'X-Seine-CSRF': ''}, {'sec-fetch-site': 'cross-site'}]) {
    const response = await shippingQuoteAction({request: request(input(), headers), context: context(() => assert.fail('Forbidden'))});
    assert.equal(response.status, 403);
  }
  const response = await shippingQuoteAction({request: request({...input(), extra: 'x'.repeat(9000)}), context: context(() => assert.fail('Oversized'))});
  assert.equal(response.status, 413);
});

test('empty rates are distinct from stock adjustments and service failure, with no automatic retries', async () => {
  for (const [modify, status, code] of [
    [(r) => {r.cartCreate.cart.deliveryGroups.nodes = [];}, 200, 'no-rates'],
    [(r) => {r.cartCreate.cart.deliveryGroups.nodes[0].deliveryOptions = [];}, 200, 'no-rates'],
    [(r) => {r.cartCreate.cart.lines.nodes[0].merchandise.requiresShipping = false;}, 200, 'not-required'],
    [(r) => {r.cartCreate.warnings = [{code: 'STOCK'}];}, 409, 'stock'],
    [(r) => {r.cartCreate.cart.lines.nodes[0].quantity = 1;}, 409, 'stock'],
    [(r) => {r.cartCreate.cart.lines.nodes = [];}, 409, 'stock'],
    [(r) => {r.cartCreate.userErrors = [{code: 'INVALID_ADDRESS', message: 'private'}];}, 503, 'unavailable'],
    [(r) => {r.errors = [{message: 'private'}];}, 503, 'unavailable'],
    [(r) => {r.cartCreate.cart.deliveryGroups.pageInfo.hasNextPage = true;}, 503, 'unavailable'],
    [(r) => {r.cartCreate.cart.deliveryGroups.nodes[0].deliveryOptions[0].estimatedCost.amount = '-1';}, 503, 'unavailable'],
  ]) {
    let calls = 0;
    const response = await shippingQuoteAction({request: request(input()), context: context(async () => {calls++; const r = result(); modify(r); return r;})});
    assert.equal(calls, 1);
    assert.equal(response.status, status);
    const data = await response.json();
    assert.equal(data.status || data.code, code);
    assert.doesNotMatch(JSON.stringify(data), /private/);
  }
  let calls = 0;
  const response = await shippingQuoteAction({request: request(input()), context: context(async () => {calls++; throw new Error('private');})});
  assert.equal(calls, 1);
  assert.equal(response.status, 503);
  assert.doesNotMatch(await response.text(), /private/);
});

test('shipping form loads only supported Shopify markets and a private CSRF token without a quote cart', async () => {
  const ctx = context(() => assert.fail('GET must not create a cart'));
  ctx.storefront.query = async (_query, options) => {
    assert.deepEqual(options.variables, ctx.storefront.i18n);
    return {localization: {availableCountries: [{isoCode: 'US', name: 'United States'}, {isoCode: 'ZZ', name: 'Unsupported'}]}};
  };
  const response = await shippingQuoteLoader({context: ctx});
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {success: true, csrf: 'csrf', country: 'US', countries: [{isoCode: 'US', name: 'United States'}]});
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
});
