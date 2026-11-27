import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadScopedSuggestions} from '../app/lib/scoped-search.server.js';
import {describePixels, validUpload, visualDistance} from '../app/lib/visual-search.js';
import {addDownload, removeDownload} from '../app/lib/download-list.js';
import {readHandles} from '../app/lib/wishlist.js';
import {helpPage, supportLinks} from '../app/data/header-destinations.js';

function image(horizontal) {
  const pixels = new Uint8ClampedArray(32 * 32 * 4);
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
    const offset = (y * 32 + x) * 4;
    const channel = (horizontal ? y : x) >= 16 ? 255 : 0;
    pixels.set([channel, channel, channel, 255], offset);
  }
  return describePixels(pixels);
}

test('visual search matches identical arrangements more closely than unrelated layouts', () => {
  assert.equal(visualDistance(image(true), image(true)), 0);
  assert.ok(visualDistance(image(true), image(false)) > 0.095);
  assert.equal(validUpload({type: 'image/webp', size: 100}), true);
  assert.equal(validUpload({type: 'image/svg+xml', size: 100}), false);
  assert.equal(validUpload({type: 'image/jpeg', size: 9 * 1024 * 1024}), false);
});

test('wishlist rejects malformed values and preserves unique Shopify handles', () => {
  assert.deepEqual(readHandles('["real-handle","bad handle","real-handle",null,"a:b","another"]'), ['real-handle', 'another']);
  assert.deepEqual(readHandles('not json'), []);
});

test('support links target distinct real page sections', () => {
  const destinations = supportLinks.map(([, path]) => path);
  assert.equal(new Set(destinations).size, destinations.length);
  for (const [title, path] of supportLinks) if (path.startsWith('/help/')) assert.equal(helpPage(path.split('/').pop()).title, title);
  assert.equal(helpPage('__proto__'), undefined);
});


test('image download handles stay separate from favorites, deduplicate, cap and remove', () => {
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const values = new Map([['seine-best-seller-favorites', '["favorite-only"]']]);
  const window = new EventTarget();
  let events = 0;
  window.addEventListener('seine:downloads', () => events++);
  Object.defineProperty(globalThis, 'window', {configurable: true, value: window});
  Object.defineProperty(globalThis, 'localStorage', {configurable: true, value: {getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value)}});
  try {
    for (const value of [null, {}, 'bad handle', '<script>']) addDownload(value);
    assert.equal(values.has('seine-image-downloads'), false);
    addDownload('real-product');
    addDownload('real-product');
    assert.deepEqual(JSON.parse(values.get('seine-image-downloads')), ['real-product']);
    for (let i = 0; i < 241; i++) addDownload(`product-${i}`);
    const list = JSON.parse(values.get('seine-image-downloads'));
    assert.equal(list.length, 240);
    assert.equal(list[0], 'product-240');
    removeDownload('product-240');
    assert.equal(JSON.parse(values.get('seine-image-downloads')).length, 239);
    assert.equal(values.get('seine-best-seller-favorites'), '["favorite-only"]');
    assert.ok(events > 0);
  } finally {
    if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage); else delete globalThis.localStorage;
    if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow); else delete globalThis.window;
  }
});


test('scoped suggestions find matches beyond the initial 250 products', async () => {
  const calls = [];
  const storefront = {i18n: {language: 'EN'}, query: async (_query, {variables}) => {
    calls.push(variables.after);
    return {collection: {products: {nodes: variables.after ? [{title: 'Target phone case', id: 'real-match'}] : Array.from({length: 250}, () => ({title: 'Unrelated charger'})), pageInfo: {hasNextPage: !variables.after, endCursor: 'second'}}}};
  }};
  const products = await loadScopedSuggestions(storefront, 'query', {handle: 'cases', term: 'target case', limit: 4});
  assert.deepEqual(calls, [null, 'second']);
  assert.equal(products[0].id, 'real-match');
});

test('scoped suggestions stop once enough matches exist and reject stalled or cyclic pages', async () => {
  let calls = 0;
  const storefront = {i18n: {}, query: async () => {calls++; return {collection: {products: {nodes: [{title: 'Case'}, {title: 'Case two'}], pageInfo: {hasNextPage: true, endCursor: 'next'}}}};}};
  assert.equal((await loadScopedSuggestions(storefront, 'query', {handle: 'cases', term: 'case', limit: 1})).length, 1);
  assert.equal(calls, 1);
  for (const cursors of [[null], ['a', 'a'], ['a', 'b', 'a']]) {
    let index = 0;
    const broken = {i18n: {}, query: async () => ({collection: {products: {nodes: [], pageInfo: {hasNextPage: true, endCursor: cursors[index++]}}}})};
    await assert.rejects(loadScopedSuggestions(broken, 'query', {handle: 'cases', term: 'case', limit: 1}), /Incomplete scoped suggestions/);
  }
});


test('every navigation family is registered for collection fallback routing', async () => {
  const {categories} = await import('../app/data/navigation.js');
  const {navigationColumns} = await import('../app/data/collection-navigation.js');
  const handles = new Set(categories.flatMap((category) => [category, ...category.children]).map(({handle}) => handle));
  for (const category of categories) {
    for (const family of navigationColumns(category).flat()) {
      assert.ok(handles.has(family.handle), `Missing collection route: ${family.handle}`);
    }
  }
});
