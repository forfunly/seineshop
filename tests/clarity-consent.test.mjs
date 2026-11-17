import {test} from 'node:test';
import assert from 'node:assert/strict';
import {clarityPageAllowed, CLARITY_PROJECT_ID, syncClarityConsent} from '../app/lib/clarity-consent.js';

function harness() {
  const scripts = [];
  const browser = {navigator: {}};
  const document = {createElement: () => ({remove() {}}), head: {appendChild: (script) => scripts.push(script)}};
  const sync = (allowed) => syncClarityConsent({browser, document, allowed, nonce: 'test-nonce'});
  return {browser, scripts, sync};
}

test('Clarity starts only on allowed public routes, excluding private paths and sensitive query strings', () => {
  for (const path of ['/', '/products/example', '/jp/products/example', '/de/collections/all', '/blogs/journal/test', '/support']) {
    assert.equal(clarityPageAllowed(new URL(path, 'https://example.com')), true, path);
  }
  for (const path of ['/cart', '/account', '/account/orders/123', '/dropshipping', '/api/ga4-checkout', '/search?q=test', '/products/example?email=person@example.com', '/products/example?token=secret', '/products/example?Color=person%40example.com']) {
    assert.equal(clarityPageAllowed(new URL(path, 'https://example.com')), false, path);
  }
  assert.equal(clarityPageAllowed(new URL('https://example.com/products/example?Color=Black')), true);
});

test('refusal makes zero script requests; consent loads exactly once with nonce and advertising denied', () => {
  const {browser, scripts, sync} = harness();
  sync(false);
  assert.equal(scripts.length, 0);
  assert.equal(browser.clarity, undefined);
  sync(true); sync(true);
  assert.equal(scripts.length, 1);
  assert.equal(scripts[0].src, `https://www.clarity.ms/tag/${CLARITY_PROJECT_ID}`);
  assert.equal(scripts[0].nonce, 'test-nonce');
  assert.deepEqual(browser.clarity.q[0], ['consentv2', {analytics_Storage: 'granted', ad_Storage: 'denied'}]);
});

test('withdrawal during load queues denied consent and stop, and an explicit regrant restarts without a second script', () => {
  const {browser, scripts, sync} = harness();
  sync(true); sync(false);
  scripts[0].onload();
  assert.equal(browser.clarity.q.at(-1)[0], 'stop');
  sync(true);
  assert.deepEqual(browser.clarity.q.slice(-2).map(([name]) => name), ['start', 'consentv2']);
  assert.equal(scripts.length, 1);
});

test('global privacy control blocks installation even if the site reports allowed analytics', () => {
  const {browser, scripts, sync} = harness();
  browser.navigator.globalPrivacyControl = true;
  sync(true);
  assert.equal(scripts.length, 0);
});

test('a failed load permits a clean retry without replaying stale queued consent', () => {
  const {browser, scripts, sync} = harness();
  sync(true); sync(false); scripts[0].onerror();
  sync(true);
  assert.equal(scripts.length, 2);
  assert.deepEqual(browser.clarity.q.map(([name]) => name), ['consentv2']);
});
