import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {test} from 'node:test';
import {buildClientSchema, parse, validate} from 'graphql';

const route = await readFile(
  new URL('../app/routes/api.collection-preview.$handle.jsx', import.meta.url),
  'utf8',
);
const {loader} = await import(
  `data:text/javascript,${encodeURIComponent(route)}`
);

function context(query) {
  return {storefront: {query}};
}

test('quick view queries a single handle with a valid Storefront operation', async () => {
  const schema = JSON.parse(
    await readFile(
      new URL(
        '../node_modules/@shopify/hydrogen/dist/storefront.schema.json',
        import.meta.url,
      ),
      'utf8',
    ),
  );
  const storefront = buildClientSchema(schema.data || schema);
  const expected = {handle: 'case-a', title: 'Case A'};
  const response = await loader({
    params: {handle: 'case-a'},
    context: context((query, {variables}) => {
      assert.deepEqual(variables, {handle: 'case-a'});
      assert.deepEqual(validate(storefront, parse(query)), []);
      assert.match(query, /selectedOptions \{ name value \}/);
      return {product: expected};
    }),
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('X-Robots-Tag'), 'noindex');
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.deepEqual(await response.json(), {product: expected});
});

test('quick view rejects invalid handles and does not expose upstream errors', async () => {
  const result = await loader({
    params: {handle: '..'},
    context: context(() => assert.fail('must not query invalid handle')),
  });
  assert.equal(result.status, 404);
  const unavailable = await loader({
    params: {handle: 'case-a'},
    context: context(() => {
      throw new Error('private upstream failure');
    }),
  });
  assert.equal(unavailable.status, 503);
  assert.deepEqual(await unavailable.json(), {product: null});
  const missing = await loader({
    params: {handle: 'missing'},
    context: context(() => ({product: null})),
  });
  assert.equal(missing.status, 404);
});
