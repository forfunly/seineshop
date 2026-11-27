import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadPhoneCollection} from '../app/lib/iphone-pro-collection.server.js';
import {browsePhone, indexPhoneProduct} from '../app/lib/iphone-pro-collection.js';

function fixture(count, change) {
  const products = Array.from({length: count}, (_, i) => ({
    id: `gid://shopify/Product/${i + 1}`, handle: `item-${i}`, title: `Case ${i}`,
    productType: i % 2 ? 'Screen Protectors' : 'Phone Cases', vendor: 'Brand',
    specifications: {value: JSON.stringify({attributes: {Material: i % 3 ? 'TPU' : 'Glass'}})},
    priceRange: {minVariantPrice: {amount: String(i + 1), currencyCode: 'USD'}},
  }));
  const calls = [], cached = [];
  const storefront = {
    i18n: {country: 'US', language: 'EN'}, CacheShort: () => ({}), CacheCustom: (value) => value,
    query: async (query, {variables}) => {
      const name = /query (\w+)/.exec(query)[1];
      calls.push({name, ...variables});
      if (variables.ids) return {nodes: variables.ids.map((id) => products.find((p) => p.id === id))};
      const ranked = name.endsWith('Rank') ? [...products].reverse() : products;
      const ordered = variables.reverse ? [...ranked].reverse() : ranked;
      const after = variables.after ? Number(variables.after.slice(7)) + 1 : 0;
      const end = Math.min(ordered.length, after + 250);
      const response = {collection: {id: 'collection', products: {
        nodes: ordered.slice(after, end), pageInfo: {hasNextPage: end < ordered.length, endCursor: `opaque:${end - 1}`},
      }}};
      return change ? change(response, calls.length) : response;
    },
  };
  const context = {storefront, env: {PUBLIC_STORE_DOMAIN: 'shop.example'}, catalogCache: {run: async (options, fn) => {
    cached.push(options);
    return fn();
  }}};
  return {products, calls, cached, context};
}

for (const count of [0, 1, 249, 250, 251, 499, 500, 501, 1000, 2274, 2500]) {
  test(`two-ended reading preserves complete order and facets at ${count} products`, async () => {
    const {products, calls, context} = fixture(count);
    const result = await loadPhoneCollection(context, 'iphone-18-pro', new URLSearchParams());
    assert.deepEqual(result.phone, browsePhone(products.map(indexPhoneProduct), undefined, new URLSearchParams()));
    assert.deepEqual(result.collection.products.nodes.map((p) => p.id), products.slice(0, 80).map((p) => p.id));
    const rounds = calls.filter(({name}) => name.endsWith('Index')).length / 2;
    assert.equal(rounds, Math.floor(count / 500) + 1);
    if (count === 2274) assert.equal(rounds, 5); // Was ten serial Storefront requests.
  });
}

test('child filters, pagination, price and sales rank equal a complete sequential index', async () => {
  for (const query of ['page=3&size=40', 'sort=price-desc&min=30&max=900', 'filter.Material=Glass', 'sort=best-selling']) {
    const {products, context} = fixture(1001);
    const params = new URLSearchParams(query);
    const result = await loadPhoneCollection(context, 'iphone-18-pro-cases', params);
    const expected = browsePhone(products.map(indexPhoneProduct), {key: 'cases', topics: []}, params, [...products].reverse().map((p) => p.id));
    assert.deepEqual(result.phone, expected);
    assert.deepEqual(result.collection.products.nodes.map((p) => p.id), expected.ids);
  }
});

test('missing collections and malformed pagination fail instead of caching partial results', async () => {
  const missing = fixture(1000, () => ({collection: null}));
  await assert.rejects(loadPhoneCollection(missing.context, 'iphone-18-pro', new URLSearchParams()), (e) => e.status === 404);
  for (const change of [
    (r, n) => {if (n > 2) r.collection.products.pageInfo.endCursor = 'opaque:249'; return r;},
    (r) => {r.collection.products.pageInfo.endCursor = null; return r;},
    (r, n) => {if (n > 1) r.collection.products.nodes[0].id = 'gid://shopify/Product/1'; return r;},
    (r) => {delete r.collection.products; return r;},
  ]) {
    const {context} = fixture(1500, change);
    await assert.rejects(loadPhoneCollection(context, 'iphone-18-pro', new URLSearchParams()), /Incomplete/);
  }
});

test('index cache remains market/language scoped and live cards remain separate', async () => {
  const {context, cached, calls} = fixture(10);
  await loadPhoneCollection(context, 'iphone-18-pro', new URLSearchParams());
  assert.deepEqual(cached[0].cacheKey.slice(1), ['iphone-18-pro', 'shop.example', 'US', 'EN']);
  assert.deepEqual(cached[0].cacheStrategy, {mode: 'public', maxAge: 300, staleWhileRevalidate: 3600});
  assert.equal(calls.at(-1).name, 'IphoneProCollectionCards');
  assert.equal(cached[0].shouldCacheResult({collection: null}), false);
});
