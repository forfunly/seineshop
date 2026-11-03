import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GA_MEASUREMENT_ID,
  syncGoogleAnalyticsConsent,
} from '../app/lib/google-analytics-consent.js';

function setup() {
  const browser = {};
  const scripts = [];
  const document = {
    createElement: () => ({remove() {}}),
    head: {appendChild: (script) => scripts.push(script)},
  };
  const sync = (allowed) =>
    syncGoogleAnalyticsConsent({
      browser,
      document,
      allowed,
      nonce: 'test-nonce',
    });
  const commands = (name) =>
    (browser.dataLayer || [])
      .map((value) => Array.from(value))
      .filter((value) => value[0] === name);
  return {browser, scripts, sync, commands};
}

test('unknown or refused consent never requests GA or initializes tracking', () => {
  const {browser, scripts, sync, commands} = setup();
  sync(undefined);
  sync(false);
  assert.equal(scripts.length, 0);
  assert.equal(commands('config').length, 0);
  assert.equal(browser[`ga-disable-${GA_MEASUREMENT_ID}`], true);
  assert.equal(commands('consent').length, 1);
  assert.deepEqual(commands('consent')[0][2], {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
});

test('allowing analytics loads one script and initializes only after it loads', () => {
  const {browser, scripts, sync, commands} = setup();
  sync(false);
  sync(true);
  sync(true);
  assert.equal(scripts.length, 1);
  assert.equal(scripts[0].nonce, 'test-nonce');
  assert.equal(commands('config').length, 0);
  scripts[0].onload();
  sync(true); // Same provider state after a route re-render/remount.
  assert.equal(scripts.length, 1);
  assert.equal(commands('config').length, 1);
  assert.equal(commands('event').length, 0);
  assert.equal(browser[`ga-disable-${GA_MEASUREMENT_ID}`], false);
  const grant = commands('consent').at(-1)[2];
  assert.equal(grant.analytics_storage, 'granted');
  assert.equal(grant.ad_storage, 'denied');
  assert.equal(grant.ad_user_data, 'denied');
  assert.equal(grant.ad_personalization, 'denied');
});

test('revoking consent during a delayed load prevents the queued page view', () => {
  const {browser, scripts, sync, commands} = setup();
  sync(true);
  sync(false);
  scripts[0].onload();
  assert.equal(commands('config').length, 0);
  assert.equal(commands('event').length, 0);
  assert.equal(browser[`ga-disable-${GA_MEASUREMENT_ID}`], true);
  sync(true);
  assert.equal(commands('config').length, 1);
  assert.equal(scripts.length, 1);
});

test('revocation disables the loaded tag and regrant does not initialize it twice', () => {
  const {browser, scripts, sync, commands} = setup();
  sync(true);
  scripts[0].onload();
  sync(false);
  assert.equal(browser[`ga-disable-${GA_MEASUREMENT_ID}`], true);
  assert.equal(commands('consent').at(-1)[2].analytics_storage, 'denied');
  assert.equal(commands('event').length, 0);
  sync(true);
  sync(true);
  assert.equal(commands('config').length, 1);
  assert.deepEqual(commands('event'), [['event', 'page_view']]);
  assert.equal(scripts.length, 1);
});

test('separate visits must each obtain their own consent state', () => {
  const first = setup();
  first.sync(true);
  first.scripts[0].onload();
  const refreshed = setup();
  refreshed.sync(false);
  assert.equal(refreshed.scripts.length, 0);
  assert.equal(refreshed.commands('config').length, 0);
});
