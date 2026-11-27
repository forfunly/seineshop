import test from 'node:test';
import assert from 'node:assert/strict';
import {brandDirectory, catalogNavGroups, catalogSection, catalogSections, usesCatalogResults} from '../app/data/catalog-sections.js';
import {paginateScopedProducts, paginateReleaseProducts} from '../app/lib/collection-filters.js';

test('every catalogue navigation entry resolves to a unique section handle', () => {
  assert.equal(new Set(catalogSections.map(([, handle]) => handle)).size, catalogSections.length);
  for (const section of catalogSections) assert.equal(catalogSection(section[1]), section);
  assert.equal(catalogSection('unknown'), undefined);
});

test('scoped results match all terms within supplied collection members and paginate', () => {
  const members = [
    {title: 'Clear iPhone Case', vendor: 'Example'},
    {title: 'iPhone Charger', vendor: 'Example'},
    {title: 'iPhone Rugged case', vendor: 'Example'},
  ];
  const first = paginateScopedProducts(members, 'IPHONE case', 1, new URLSearchParams());
  assert.equal(first.totalCount, 2);
  assert.equal(first.nodes[0], members[0]);
  const next = paginateScopedProducts(members, 'IPHONE case', 1, new URLSearchParams({cursor: first.pageInfo.endCursor, direction: 'next'}));
  assert.equal(next.nodes[0], members[2]);
  assert.equal(next.pageInfo.hasNextPage, false);
});


test('catalog overflow retains only secondary destinations', () => {
  assert.deepEqual(catalogNavGroups.featured.map(([, handle]) => handle), ['new-arrivals', 'best-sellers', 'eu-top-rankings', 'trending-products']);
  assert.deepEqual(catalogNavGroups.overflow.map(([, handle]) => handle), ['certified-products', 'brands']);
  assert.deepEqual(catalogNavGroups.brands.map(([, handle]) => handle), ['handpicked-brands']);
  assert.deepEqual(catalogSections.filter(([, handle]) => usesCatalogResults(handle)).map(([, handle]) => handle), ['eu-top-rankings', 'trending-products']);
});


test('release dates come only from real publications within the last 30 UTC dates', () => {
  const now = Date.parse('2026-11-26T10:00:00Z');
  const products = [
    {publishedAt: '2026-11-25T18:00:00Z'},
    {publishedAt: '2026-11-25T08:00:00Z'},
    {publishedAt: '2026-10-28T00:00:00Z'},
    {publishedAt: '2026-10-27T23:59:59Z'},
    {publishedAt: '2026-11-27T00:00:00Z'},
    {},
  ];
  const browse = {size: 2, sort: 'newest'};
  const result = paginateReleaseProducts(products, browse, new URLSearchParams({release: 'recent'}), now);
  assert.deepEqual(result.releaseDates, [{date: '2026-11-25', count: 2}, {date: '2026-10-28', count: 1}]);
  assert.equal(result.totalCount, 3);
  assert.deepEqual(result.nodes, products.slice(0, 2));
  const next = paginateReleaseProducts(products, browse, new URLSearchParams({release: 'recent', cursor: result.pageInfo.endCursor}), now);
  assert.deepEqual(next.nodes, [products[2]]);
  const exact = paginateReleaseProducts(products, browse, new URLSearchParams({release: '2026-10-27'}), now);
  assert.deepEqual(exact.nodes, [products[3]]);
  assert.equal(paginateReleaseProducts([], browse, new URLSearchParams({release: 'recent'}), now).release, 'recent');
  assert.equal(paginateReleaseProducts(products, browse, new URLSearchParams({release: 'invalid'}), now).release, '');
});


test('brand directory counts only actual collection products and deduplicates categories', () => {
  const items = brandDirectory([{vendor: 'Example', productType: 'Cases'}, {vendor: 'Example', productType: 'Cases'}, {vendor: 'Example', productType: 'Cables'}, {vendor: '', productType: 'Cases'}, {vendor: 'Other', productType: 'Cases'}]);
  assert.equal(items.length, 2);
  assert.deepEqual(items[0].categories, ['Cases', 'Cables']);
  assert.equal(items[0].count, 3);
  assert.deepEqual(JSON.parse(items[0].input), {productVendor: 'Example'});
  assert.deepEqual(brandDirectory([]), []);
});
