import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createStaticHandler, createStaticRouter, StaticRouterProvider} from 'react-router';

// Render the real shared head inside React Router, including loader failures.
const output = new URL('../.cache/site-seo-render-test.mjs', import.meta.url);
await build({
  entryPoints: [fileURLToPath(new URL('../app/components/SiteSeo.jsx', import.meta.url))],
  outfile: fileURLToPath(output), bundle: true, platform: 'node', format: 'esm',
  packages: 'external', jsx: 'automatic',
  alias: {'~': fileURLToPath(new URL('../app', import.meta.url))},
});
const {SiteSeo} = await import(output.href);

async function renderHead(path, {rootError = false, childError = false, missingSettings = false} = {}) {
  const head = createElement(SiteSeo);
  const routes = [{
    id: 'root', path: '/', element: head, errorElement: head,
    loader: () => {
      if (rootError) throw new Response('Not found', {status: 404});
      return missingSettings ? {} : {seoSettings: {
        origin: 'https://www.seineshop.com', indexable: true,
      }};
    },
    children: [{path: '*', element: createElement('span'), loader: () => {
      if (childError) throw new Response('Not found', {status: 404});
      return null;
    }}],
  }];
  const handler = createStaticHandler(routes);
  const context = await handler.query(new Request(`https://www.seineshop.com${path}`));
  assert.ok(!(context instanceof Response));
  const router = createStaticRouter(handler.dataRoutes, context);
  return {status: context.statusCode, html: renderToStaticMarkup(
    createElement(StaticRouterProvider, {router, context, hydrate: false}),
  )};
}

test('root and child loader errors retain 404/noindex without canonical or content metadata', async () => {
  for (const options of [{rootError: true}, {childError: true}]) {
    const {html, status} = await renderHead('/ja', options);
    assert.equal(status, 404);
    assert.match(html, /404 \| SeineShop/);
    assert.match(html, /noindex, follow/);
    assert.doesNotMatch(html, /canonical|alternate|og:url|application\/ld\+json|localhost/);
  }
});

test('missing site settings cannot create guessed canonical or indexable metadata', async () => {
  const {html} = await renderHead('/', {missingSettings: true});
  assert.match(html, /noindex, follow/);
  assert.doesNotMatch(html, /canonical|alternate|og:url|application\/ld\+json|localhost/);
});

test('healthy localized pages retain production canonical and language alternates', async () => {
  const {html, status} = await renderHead('/de/');
  assert.equal(status, 200);
  assert.match(html, /rel="canonical" href="https:\/\/www.seineshop.com\/de\/"/);
  assert.match(html, /hrefLang="ja" href="https:\/\/www.seineshop.com\/jp\/"/);
  assert.match(html, /index, follow, max-image-preview:large/);
  assert.match(html, /application\/ld\+json/);
});
