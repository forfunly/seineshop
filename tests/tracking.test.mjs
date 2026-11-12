import test from 'node:test';
import assert from 'node:assert/strict';
import {trackingNumber, trackingLanguage, trackingLink} from '../app/lib/tracking.js';

test('tracking accepts a single shipment identifier and trims outside whitespace', () => {
  assert.equal(trackingNumber('  RR123456789CN  '), 'RR123456789CN');
  assert.equal(trackingNumber('1Z-123456'), '1Z-123456');
  for (const value of ['', ' ', 'AA BB', 'AA\nBB', '<script>', 'A&B', 'A'.repeat(51)]) {
    assert.equal(trackingNumber(value), null);
  }
});
test('tracking links use provider language allowlist and safely encode identifiers', () => {
  assert.equal(trackingLanguage('ja'), 'ja');
  assert.equal(trackingLanguage('../test'), 'en');
  assert.equal(trackingLink('AA&BB', 'de'), 'https://t.17track.net/de#nums=AA%26BB');
});

test('widget loads only on demand, shares in-flight requests and recovers after failure', async () => {
  const {loadTrackingWidget} = await import('../app/lib/tracking.js');
  const scripts = [];
  globalThis.window = {};
  globalThis.document = {
    createElement: () => ({remove() { this.removed = true; }}),
    head: {appendChild(script) { scripts.push(script); }},
  };
  try {
    const first = loadTrackingWidget('test-nonce');
    assert.equal(loadTrackingWidget('test-nonce'), first);
    assert.equal(scripts.length, 1);
    assert.equal(scripts[0].nonce, 'test-nonce');
    const rejected = assert.rejects(first, /Tracking unavailable/);
    scripts[0].onerror();
    await rejected;
    assert.equal(scripts[0].removed, true);
    const retry = loadTrackingWidget('test-nonce');
    assert.equal(scripts.length, 2);
    window.YQV5 = {trackSingle() {}};
    scripts[1].onload();
    assert.equal(await retry, window.YQV5);
    assert.equal(await loadTrackingWidget(), window.YQV5);
    assert.equal(scripts.length, 2);
  } finally {
    delete globalThis.window;
    delete globalThis.document;
  }
});
