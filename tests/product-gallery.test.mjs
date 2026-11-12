import test from 'node:test';
import assert from 'node:assert/strict';
import {productGallery} from '../app/lib/product-gallery.js';
import {collectionSearchQuery, parseCollectionFilters} from '../app/lib/collection-filters.js';

test('SKU gallery retains all photos and separates the selected color and detail photos', () => {
  const images = [
    {url:'https://cdn.shopify.com/a/123A-1.webp'},
    {url:'https://cdn.shopify.com/a/800x800_123A-2_abcd.webp'},
    {url:'https://cdn.shopify.com/a/123B-1.webp'},
    {url:'https://cdn.shopify.com/a/1000x1000_123-1.webp',altText:'Product detail — Example'},
  ];
  const result = productGallery(images, images[2], '123B');
  assert.equal(result.all.length,4);
  assert.deepEqual(result.selected,[images[2]]);
  assert.deepEqual(result.details,[images[3]]);
  assert.equal(productGallery(images,images[0],'123A').selected.length,2);
  assert.equal(productGallery(images,undefined,'other').selected.length,4);
  assert.deepEqual(productGallery([],undefined,''),{all:[],selected:[],details:[]});
});

test('collection search remains scoped and supports source-style page size', () => {
  assert.equal(collectionSearchQuery('clear','iphone-duo'),'tag:"iPhone Duo" AND ("clear")');
  assert.equal(collectionSearchQuery('clear'),'tag:seineshop-best-sellers AND ("clear")');
  assert.equal(parseCollectionFilters(new URLSearchParams('size=60')).size,60);
  assert.equal(parseCollectionFilters(new URLSearchParams('size=900')).size,40);
});

test('category paging keeps every matching product and round-trips previous pages', async () => {
  const {paginateCategoryProducts} = await import('../app/lib/collection-filters.js');
  const products = Array.from({length:127}, (_,id)=>({id,productType:'Screen Protectors'}));
  const first = paginateCategoryProducts(products,['Screen Protectors'],80,new URLSearchParams());
  assert.equal(first.totalCount,127);
  assert.equal(first.nodes.length,80);
  const next = paginateCategoryProducts(products,['Screen Protectors'],80,new URLSearchParams({cursor:first.pageInfo.endCursor,direction:'next'}));
  assert.equal(next.nodes.length,47);
  assert.equal(next.nodes[0].id,80);
  const previous = paginateCategoryProducts(products,['Screen Protectors'],80,new URLSearchParams({cursor:next.pageInfo.startCursor,direction:'previous'}));
  assert.deepEqual(previous.nodes,first.nodes);
  assert.equal(paginateCategoryProducts(products,['Other'],80,new URLSearchParams()).nodes.length,0);
});
