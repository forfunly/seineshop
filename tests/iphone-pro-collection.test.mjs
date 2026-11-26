import {test} from 'node:test';
import assert from 'node:assert/strict';
import {browsePhone, indexPhoneProduct, phoneCategory, phoneCollection} from '../app/lib/iphone-pro-collection.js';

const product = (id, productType, title, amount, attrs, more = {}) => indexPhoneProduct({id, productType, title, priceRange: {minVariantPrice: {amount}}, specifications: {value: JSON.stringify({attributes: attrs})}, ...more});
const records = [
  product('a', 'Phone Cases', 'Clear MagSafe', '2.40', {Material: 'TPU', 'Compatible with': 'Apple\niPhone 18 Pro\niPhone 17 Pro', Color: 'Blue'}, {createdAt: '2026-11-20'}),
  product('b', 'Screen Protectors', 'Tempered Glass', '1.35', {Material: 'Glass', Color: 'Clear'}, {createdAt: '2026-11-23'}),
  product('c', 'Camera Lens Protectors', 'Matte Camera Lens Protector', '2.55', {Material: 'Glass', Color: 'Blue'}, {createdAt: '2026-11-19'}),
  product('d', 'Stand', 'Unclassified', '5.25', {}),
];
const run = (handle, query, rank) => browsePhone(records, phoneCategory(handle), new URLSearchParams(query), rank);

test('child pages are subsets of the real parent collection; dual compatibility remains searchable', () => {
  assert.deepEqual(run('iphone-18-pro','q=17+pro').ids, ['a']);
  assert.deepEqual(run('iphone-18-pro-cases','').ids, ['a']);
  assert.deepEqual(run('iphone-18-pro-screen-protectors','').ids, ['b','c']);
  assert.deepEqual(run('iphone-18-pro','').counts, [1,2]);
});
test('facets combine across groups and counts are conditioned on the other choices', () => {
  const r = run('iphone-18-pro','filter.Material=Glass&filter.Color=Blue');
  assert.deepEqual(r.ids, ['c']);
  assert.deepEqual(r.facets.find(({key}) => key === 'Material').values, [['Glass',1],['TPU',1]]);
  assert.deepEqual(run('iphone-18-pro-screen-protectors','topic=Tempered+Glass&min=1&max=2').ids, ['b']);
});
test('price, creation time, and Shopify sales rank drive separate sort orders', () => {
  assert.deepEqual(run('iphone-18-pro','sort=price-desc').ids, ['d','c','a','b']);
  assert.deepEqual(run('iphone-18-pro','sort=newest').ids, ['b','a','c','d']);
  assert.deepEqual(run('iphone-18-pro','sort=best-selling',['c','b','a','d']).ids, ['c','b','a','d']);
});

test('parent category selection combines checked groups without mixing in unmatched products', () => {
  const results = (query) => run('iphone-18-pro',query).ids;
  assert.deepEqual(results('filter.category=cases'), ['a']);
  assert.deepEqual(results('filter.category=cases&filter.category=screen-protectors'), ['a','b','c']);
  assert.deepEqual(results('filter.category=unknown'), ['a','b','c','d']);
});

test('imported color aliases merge with existing English results and preserve old filter links', () => {
  const sample = product('imported', 'Phone Cases', 'Case - 蓝色', '2.00', {Color: 'Blue,橙色'}, {options:[{name:'Color', values:['蓝色','绿色','粉色','黄色','透明']}]});
  const all = [...records, sample];
  const page = (color) => browsePhone(all, undefined, new URLSearchParams(color ? {'filter.Color': color} : {}));
  assert.deepEqual(page('Blue').ids, ['a','c','imported']);
  assert.deepEqual(page('蓝色').ids, page('Blue').ids);
  assert.deepEqual(page('Orange').ids, ['imported']);
  assert.deepEqual(page().facets.find(({key})=>key==='Color').values, [['Blue',3],['Clear',1],['Green',1],['Orange',1],['Pink',1],['Transparent',1],['Yellow',1]]);
});


test('ordinary iPhone 18 routes use their own collection with only verified child navigation', () => {
  assert.equal(phoneCollection('iphone-18').series.handle, 'iphone-18');
  assert.equal(phoneCollection('iphone-18-cases').category.key, 'cases');
  assert.deepEqual(phoneCollection('iphone-18-screen-protectors').category.topics, []);
  assert.ok(phoneCollection('iphone-18-pro-screen-protectors').category.topics.length);
  assert.equal(phoneCollection('iphone-18-pro-max'), null);
});
