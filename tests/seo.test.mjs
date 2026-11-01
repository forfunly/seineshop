import test from 'node:test';
import assert from 'node:assert/strict';
import {canonicalUrl,jsonLd,siteSettings} from '../app/lib/seo.js';
test('pagination keeps its own canonical while tracking is removed',()=>{assert.equal(canonicalUrl('https://www.seineshop.com','/collections/phone','?page=2&utm_source=email&sort=price'),'https://www.seineshop.com/collections/phone?page=2');assert.equal(canonicalUrl('https://www.seineshop.com','/collections/phone','?page=1'),'https://www.seineshop.com/collections/phone');});
test('staging cannot become indexable using production settings',()=>{assert.equal(siteSettings({PUBLIC_SITE_URL:'https://www.seineshop.com',PUBLIC_INDEXABLE:'true'},'https://preview.example.com/').indexable,false);assert.equal(siteSettings({PUBLIC_SITE_URL:'https://www.seineshop.com',PUBLIC_INDEXABLE:'true'},'https://www.seineshop.com/').indexable,true);assert.equal(siteSettings({},'http://localhost:3000/').indexable,false);});
test('JSON-LD prevents closing the script element with product content',()=>{const value={name:'</script><script>alert(1)</script>'};assert.ok(!jsonLd(value).includes('<'));assert.deepEqual(JSON.parse(jsonLd(value)),value);});

test('indexing requires an explicitly configured production origin', () => {
  assert.equal(siteSettings({PUBLIC_INDEXABLE: 'true'}, 'https://preview.example/').indexable, false);
});

const {pageTitle} = await import('../app/lib/seo.js');
test('imported SEO titles do not duplicate the store name', () => {
  assert.equal(pageTitle('Phone Case | SeineShop'), 'Phone Case | SeineShop');
  assert.equal(pageTitle('Accessories | SeineShop', '2'), 'Accessories — Page 2 | SeineShop');
});
