import test from 'node:test';
import assert from 'node:assert/strict';
import {catalogSection, catalogSections} from '../app/data/catalog-sections.js';
import {paginateScopedProducts} from '../app/lib/collection-filters.js';

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
