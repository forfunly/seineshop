import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {addPurchaseLines, bulkQuantityLimits, canShowBulkBuy, purchaseLines, validBulkQuantity} from '../app/lib/bulk-buy.js';
import {productVariantsLoader} from '../app/lib/product-variants.server.js';

const line = (id = 1, quantity = 2) => ({merchandiseId: `gid://shopify/ProductVariant/${id}`, quantity});

test('bulk modal keeps pointer interaction when its hover panel stops receiving pointer events', () => {
  const styles = readFileSync(new URL('../app/styles/brand.css', import.meta.url), 'utf8');
  assert.match(styles, /\.pdp-bulk-dialog\{[^}]*pointer-events:auto/);
  assert.match(styles, /\.pdp-bulk-dialog::backdrop\{[^}]*pointer-events:auto/);
});

test('bulk modal form is portaled outside collection filter forms after hydration', () => {
  const component = readFileSync(new URL('../app/components/ProductBulkBuy.jsx', import.meta.url), 'utf8');
  const hook = readFileSync(new URL('../app/lib/use-modal-dialog.js', import.meta.url), 'utf8');
  assert.match(component, /setPortalTarget\(document\.body\)/);
  assert.match(component, /portalTarget && createPortal\(<dialog/);
  assert.match(component, /enabled: Boolean\(portalTarget\)/);
  assert.match(hook, /if \(!enabled\) return/);
  assert.match(hook, /\[lightDismiss, enabled\]/);
});

test('bulk purchase forwards all chosen variants and strips client prices and optimistic metadata', async () => {
  const inputs = [{...line(), price: '0.01', selectedVariant: {price: '0.01'}, attributes: [{key: 'discount', value: '100%'}]}, line(2, 3)];
  const result = await addPurchaseLines(inputs, {addLines: async (lines) => {
    assert.deepEqual(lines, [line(), line(2, 3)]);
    return {cart: {id: 'saved-cart'}};
  }});
  assert.equal(result.cart.id, 'saved-cart');
  assert.equal(inputs[0].price, '0.01');
});

test('rejects duplicates, invalid variants, quantities and oversized requests before Shopify writes', async () => {
  for (const inputs of [undefined, {}, [], [null], [line(), line()], [line(0)], [{...line(), merchandiseId: 'gid://shopify/Product/1'}], ...[0, -1, 1.5, 10000, '2', null, Infinity].map((q) => [line(1, q)]), Array.from({length: 251}, (_, i) => line(i + 1))]) {
    assert.equal(purchaseLines(inputs), null);
    const result = await addPurchaseLines(inputs, {addLines: () => assert.fail('Invalid lines must not mutate Shopify')});
    assert.ok(result.errors.length);
  }
  assert.equal(purchaseLines(Array.from({length: 250}, (_, i) => line(i + 1, 9999))).length, 250);
});

test('preserves stock warnings and marks uncertain writes without retrying or exposing errors', async () => {
  const partial = {cart: {id: 'saved'}, warnings: [{message: 'Adjusted stock'}]};
  assert.deepEqual(await addPurchaseLines([line()], {addLines: async () => partial}), partial);
  let calls = 0;
  const result = await addPurchaseLines([line()], {addLines: async () => {calls++; throw new Error('private details');}});
  assert.equal(calls, 1);
  assert.equal(result.uncertain, true);
  assert.ok(!JSON.stringify(result).includes('private details'));
});

test('bulk quantity input rejects fractions, scientific notation and empty values', () => {
  for (const value of ['0', '1', '9999', 5]) assert.equal(validBulkQuantity(value), true);
  for (const value of ['', ' ', '1.5', '1e2', '-1', '10000', null]) assert.equal(validBulkQuantity(value), false);
});

test('card bulk entry needs distinct options and a purchasable variant, not a price threshold', () => {
  const variant = (id, availableForSale = true, quantityRule) => ({id, availableForSale, quantityRule});
  const product = (nodes) => ({variants: {nodes}});
  for (const value of [null, {}, product([]), product([variant('a')]), product([variant('a'), variant('a')]), product([variant('a', false), variant('b', false)])]) assert.equal(canShowBulkBuy(value), false);
  assert.equal(canShowBulkBuy(product([variant('a'), variant('b', false)])), true);
  assert.equal(canShowBulkBuy(product([variant('a', true, {minimum: 10000}), variant('b', false)])), false);
  assert.equal(canShowBulkBuy({...product([variant('a', false), variant('b', false)]), selectedOrFirstAvailableVariant: variant('after-first-100')}), true);
});

test('bulk quantities honor actual minimum, maximum and increments, with zero meaning not selected', () => {
  const rule = {minimum: 6, maximum: 30, increment: 3};
  for (const quantity of [0, 6, 9, 30]) assert.equal(validBulkQuantity(quantity, rule), true);
  for (const quantity of [1, 3, 7, 31, '1e1']) assert.equal(validBulkQuantity(quantity, rule), false);
  assert.deepEqual(bulkQuantityLimits({minimum: 2, maximum: 20000, increment: 2}), {minimum: 2, maximum: 9999, increment: 2});
  assert.equal(validBulkQuantity(9999, {increment: 2}), false);
});

test('variant paging forwards locale and cursor without app credentials or private fields', async () => {
  const product = {id: 'gid://shopify/Product/1', variants: {nodes: [line()], pageInfo: {hasNextPage: true, endCursor: 'next'}}};
  const response = await productVariantsLoader({request: new Request('https://example.com/jp/api/product-variants?handle=charger&after=previous'), context: {storefront: {
    i18n: {country: 'JP', language: 'JA'}, CacheNone: () => 'no-store', query: async (query, options) => {
      assert.deepEqual(options, {variables: {handle: 'charger', after: 'previous', country: 'JP', language: 'JA'}, cache: 'no-store'});
      assert.match(query, /variants\(first: 50, after: \$after\)/);
      assert.match(query, /quantityRule \{ minimum maximum increment \}/);
      assert.doesNotMatch(query, /metafield|source_|customer|email|token/i);
      return {product};
    },
  }}});
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
  assert.match(response.headers.get('X-Robots-Tag'), /noindex/);
  assert.deepEqual(await response.json(), {product});
});

test('invalid paging never queries Shopify and lookup failures remain private and recoverable', async () => {
  for (const query of ['', '?handle=../bad', '?handle=good&after=', `?handle=good&after=${'x'.repeat(1025)}`]) {
    const response = await productVariantsLoader({request: new Request(`https://example.com/api/product-variants${query}`), context: {storefront: {query: () => assert.fail('Invalid query')}}});
    assert.equal(response.status, 400);
  }
  for (const [query, status] of [[async () => ({product: null}), 404], [async () => {throw new Error('secret');}, 503]]) {
    const response = await productVariantsLoader({request: new Request('https://example.com/api/product-variants?handle=good'), context: {storefront: {CacheNone: () => ({}), query}}});
    assert.equal(response.status, status);
    assert.match(response.headers.get('X-Robots-Tag'), /noindex/);
    assert.doesNotMatch(await response.text(), /secret/);
  }
});
