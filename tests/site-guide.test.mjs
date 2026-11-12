import test from 'node:test';
import assert from 'node:assert/strict';
import {siteGuideResponse} from '../app/lib/site-guide.js';
import {siteSettings} from '../app/lib/seo.js';
import {localizePath, LOCALES} from '../app/lib/locale.js';

test('public guide returns UTF-8 text with canonical storefront discovery links', async () => {
  const response = siteGuideResponse({origin: 'https://www.seineshop.com', indexable: true});
  assert.equal(response.headers.get('Content-Type'), 'text/plain; charset=utf-8');
  assert.equal(response.headers.get('X-Robots-Tag'), null);
  const text = await response.text();
  for (const path of ['/collections/iphone-duo', '/sitemap.xml', '/robots.txt', '/policies']) assert.ok(text.includes(`https://www.seineshop.com${path}`));
  assert.ok(!/source_snapshot|source_urls|sourcing_record|inventoryQuantity|api\/|token/i.test(text));
});

test('preview guide retains noindex and resource URL is not localized', () => {
  const settings = siteSettings({PUBLIC_SITE_URL: 'https://www.seineshop.com', PUBLIC_INDEXABLE: 'true'}, 'https://preview.example.com/llms.txt');
  assert.equal(siteGuideResponse(settings).headers.get('X-Robots-Tag'), 'noindex');
  for (const locale of LOCALES) assert.equal(localizePath('/llms.txt', locale), '/llms.txt');
});
