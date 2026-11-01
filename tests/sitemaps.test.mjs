import test from 'node:test';
import assert from 'node:assert/strict';
import {indexLoader, resourceLoader, urlset, localEntries} from '../app/lib/sitemaps.server.js';
const env = {PUBLIC_SITE_URL: 'https://www.seineshop.com', PUBLIC_INDEXABLE: 'true', PUBLIC_JOURNAL_INDEXABLE: 'true'};
const storefront = {query: async (query, {variables} = {}) => {
  if (query.includes('SeineSitemapCounts')) return {products:{pagesCount:{count:3}},collections:{pagesCount:{count:1}},pages:{pagesCount:{count:0}}};
  if (query.includes('SeineSitemapCollections')) return {collections:{nodes:[{handle:'full',updatedAt:'2026-10-29T00:00:00Z',products:{nodes:[{id:'1'}]}},{handle:'empty',products:{nodes:[]}}],pageInfo:{hasNextPage:false,endCursor:null}}};
  if (query.includes('SeineSitemapPolicies')) return {shop:{privacyPolicy:{handle:'privacy-policy'},refundPolicy:null}};
  return {sitemap:{resources:{items:variables.type === 'PAGE' ? [] : [{handle:'test-product',updatedAt:'2026-10-29T00:00:00Z'}]}}};
}};
const args = (resource, overrides={}) => ({request:new Request('https://www.seineshop.com/sitemap.xml'),context:{env:{...env,...overrides},storefront},params:{language:'en',resource}});
test('index is flat, language-scoped and keeps every product shard',async()=>{
 const xml=await (await indexLoader(args())).text();
 assert.equal((xml.match(/<sitemap>/g)||[]).length,27);
 for(const path of ['products-1','products-3','collections-1','articles-1','blog-collections-1','blog-tags-1','pages-1','policies-1']) assert.ok(xml.includes(`/sitemap.en.${path}.xml`));
 assert.ok(!xml.includes('sitemap-static'));
});
test('catalog indexing gate and staging remain protected',async()=>{
 const xml=await (await indexLoader(args('',{PUBLIC_INDEXABLE:'false'}))).text();
 assert.ok(!xml.includes('products-'));assert.ok(xml.includes('articles-'));
 const a=args();a.request=new Request('https://preview.example/sitemap.xml');
 assert.ok(!(await (await indexLoader(a)).text()).includes('<sitemap>'));
});
test('pages fallback lists only real custom routes, collections omit empty ones',async()=>{
 const pages=await (await resourceLoader(args('pages-1'))).text();assert.ok(pages.includes('/support'));assert.ok(!pages.includes('/account'));
 const collections=await (await resourceLoader(args('collections-1'))).text();assert.ok(collections.includes('/collections/full'));assert.ok(!collections.includes('/collections/empty'));
});
test('blog paths match canonical article and global tag routes',()=>{
 assert.ok(localEntries('articles').every(e=>e.path.startsWith('/blog/')));
 assert.ok(localEntries('blog-tags').every(e=>e.path.startsWith('/blogs/tag/')));
 assert.equal(localEntries('articles',0).length,0);
});
test('invalid language, page and type return 404',async()=>{
 for(const resource of ['products-0','products-4','products-1junk','articles-2','unknown-1']) await assert.rejects(resourceLoader(args(resource)), e=>e.status===404);
 const a=args('products-1');a.params.language='zh';await assert.rejects(resourceLoader(a),e=>e.status===404);
});
test('XML escapes, deduplicates and omits invented modification times',()=>{
 const xml=urlset([{path:'/pages/a&b'},{path:'/pages/a&b'},{path:'/support',updatedAt:'invalid'}],'https://www.seineshop.com');
 assert.equal((xml.match(/<url>/g)||[]).length,2);assert.ok(xml.includes('a&amp;b'));assert.ok(!xml.includes('<lastmod>'));
});

test('Japanese and German sitemaps prefix every resource URL', async () => {
 for (const [language, prefix] of [['ja','jp'], ['de','de']]) {
  const a=args('products-1'); a.params.language=language;
  const xml=await (await resourceLoader(a)).text();
  assert.ok(xml.includes(`https://www.seineshop.com/${prefix}/products/test-product`));
 }
});

 test('language alternates are reciprocal and include self plus default', async () => {
  let expected;
  for (const language of ['en', 'ja', 'de']) {
   const a=args('products-1'); a.params.language=language;
   const xml=await (await resourceLoader(a)).text();
   const links=[...xml.matchAll(/<xhtml:link[^>]+\/>/g)].map(m=>m[0]);
   assert.equal(links.length,4);
   assert.ok(xml.includes('xmlns:xhtml="http://www.w3.org/1999/xhtml"'));
   assert.ok(links.some(link=>link.includes('hreflang="ja"') && link.includes('/jp/products/')));
   if(expected) assert.deepEqual(links,expected); else expected=links;
  }
 });
 test('images come from Shopify resources and escape query parameters', async () => {
  const a=args('products-1');
  a.context={...a.context,storefront:{query:async(query, options)=>query.includes('SeineSitemapResources')
   ? {sitemap:{resources:{items:[{handle:'photo',image:{filepath:'https://cdn.shopify.com/image.jpg?v=1&width=900'}}]}}}
   : storefront.query(query, options)}};
  const xml=await (await resourceLoader(a)).text();
  assert.ok(xml.includes('<image:loc>https://cdn.shopify.com/image.jpg?v=1&amp;width=900</image:loc>'));
  assert.ok(!urlset([{path:'/photo',image:'javascript:alert(1)'}],env.PUBLIC_SITE_URL).includes('<image:image>'));
 });

test('root sitemap filenames match the router as one parameter', async () => {
 const {matchPath} = await import('react-router');
 const {sitemapPath} = await import('../app/lib/sitemaps.server.js');
 for (const language of ['en','ja','de']) {
  const result = matchPath(':sitemap.xml', sitemapPath('products', 10, language));
  assert.equal(result.params.sitemap, `sitemap.${language}.products-10`);
 }
});

 test('Shopify relative image filepaths resolve to the shop CDN', async () => {
  const {sitemapImageUrl} = await import('../app/lib/sitemaps.server.js');
  assert.equal(sitemapImageUrl('files/b20a.webp', 'ps83if-c4.myshopify.com'), 'https://ps83if-c4.myshopify.com/cdn/shop/files/b20a.webp');
  assert.equal(sitemapImageUrl('javascript:alert(1)', 'ps83if-c4.myshopify.com'), undefined);
 });
