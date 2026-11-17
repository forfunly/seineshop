import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cartAdditionReceipt, checkoutAnalyticsAttributes, commerceBatches, commerceItem} from '../app/lib/ga4-commerce.js';
import {addCartLinesWithAnalytics} from '../app/lib/ga4-cart.server.js';
import {getCheckoutAnalytics, sendCartReceipt, sendCommerceEvent} from '../app/lib/ga4-client.js';
import {createBuyNowCheckout, createSavedCartCheckout} from '../app/lib/checkout.server.js';

const variant = {id: 'gid://shopify/ProductVariant/42', title: 'Black', product: {title: 'Charging station'}};
const request = [{merchandiseId: variant.id, quantity: 3}];
const snapshot = (quantity) => ({
  id: 'cart-private', totalQuantity: quantity, attributes: [], checkoutUrl: 'https://ps83if-c4.myshopify.com/checkouts/private',
  cost: {subtotalAmount: {currencyCode: 'USD'}},
  lines: {pageInfo: {hasNextPage: false}, nodes: quantity ? [{merchandise: variant, quantity, cost: {amountPerQuantity: {amount: '19', currencyCode: 'USD'}}}] : []},
});
const form = () => new FormData();

function browserMock() {
  const calls = [];
  const browser = {
    location: {origin: 'https://www.seineshop.com', pathname: '/products/test', search: '?email=private@example.com'},
    Shopify: {customerPrivacy: {analyticsProcessingAllowed: () => true, currentVisitorConsent: () => ({analytics: 'yes'})}},
    gtag: (...args) => calls.push(args),
  };
  return {browser, calls};
}

test('product item uses the same variant ID as checkout and rejects invalid prices or quantities', () => {
  assert.deepEqual(commerceItem(variant, variant.product, {amount: '0'}, 1), {
    item_id: '42', item_name: 'Charging station', item_brand: 'Seine Shop', item_variant: 'Black', price: 0, quantity: 1,
  });
  for (const amount of [undefined, null, '', '-1', 'NaN', Infinity]) assert.equal(commerceItem(variant, variant.product, {amount}), null);
  assert.equal(commerceItem(variant, variant.product, {amount: '19'}, 0), null);
});

test('addition counts actual deltas, including adjusted stock, not the existing cart or requested quantity', () => {
  const receipt = cartAdditionReceipt(snapshot(2), snapshot(4), request, 'unique');
  assert.equal(receipt.events[0].items[0].quantity, 2);
  assert.equal(receipt.events[0].value, 38);
  assert.equal(cartAdditionReceipt(snapshot(4), snapshot(4), request, 'same'), null);
  assert.equal(cartAdditionReceipt(undefined, snapshot(4), request, 'unknown'), null);
  assert.equal(cartAdditionReceipt(snapshot(0), snapshot(4), request, 'concurrent'), null);
});

test('bulk buy keeps all 250 items and totals while respecting the 200-item event limit', () => {
  const items = Array.from({length: 250}, (_, index) => ({item_id: String(index), price: 0.1, quantity: 3}));
  const batches = commerceBatches(items, 'USD');
  assert.deepEqual(batches.map(({items: entries}) => entries.length), [200, 50]);
  assert.equal(batches.reduce((sum, {value}) => sum + value, 0), 75);
});

test('server uses authoritative before/after carts and emits a receipt once after a successful write', async () => {
  let reads = 0;
  let writes = 0;
  const result = await addCartLinesWithAnalytics(request, {
    get: async (options) => {assert.equal(options.numCartLines, 250); return snapshot(reads++ ? 4 : 2);},
    addLines: async (lines) => {writes++; assert.deepEqual(lines, request); return {cart: {id: 'cart-private'}, warnings: [{message: 'Adjusted stock'}]};},
  }, true);
  assert.equal(writes, 1);
  assert.equal(result.ga4.events[0].value, 38);
  assert.equal(result.warnings.length, 1);
});

test('analytics read failure, declined tracking, business failure and uncertainty never retry or invent success', async () => {
  for (const mode of ['read-failure', 'declined', 'business-failure', 'uncertain', 'incomplete']) {
    let writes = 0;
    const result = await addCartLinesWithAnalytics(request, {
      get: async () => {
        if (mode === 'declined') assert.fail('No analytics reads without permission');
        if (mode === 'read-failure') throw new Error('Unavailable');
        const cart = snapshot(2);
        if (mode === 'incomplete') cart.lines.pageInfo.hasNextPage = true;
        return cart;
      },
      addLines: async () => {
        writes++;
        if (mode === 'uncertain') throw new Error('Lost response');
        return mode === 'business-failure' ? {errors: [{message: 'Sold out'}]} : {cart: {id: 'cart-private'}};
      },
    }, mode !== 'declined');
    assert.equal(writes, 1);
    assert.equal(result.ga4, undefined);
  }
});

test('client deduplicates action replay and strips query parameters from ecommerce events', () => {
  const {browser, calls} = browserMock();
  const receipt = cartAdditionReceipt(snapshot(2), snapshot(4), request, 'one');
  sendCartReceipt(receipt, browser);
  sendCartReceipt(receipt, browser);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][1], 'add_to_cart');
  assert.equal(calls[0][2].page_location, 'https://www.seineshop.com/products/test');
  assert.equal(calls[0][2].send_to, 'G-BKLZMJ9EP7');
  assert.ok(!JSON.stringify(calls).includes('private'));
});

test('declined/revoked events do not replay after a later permission grant', () => {
  const {browser, calls} = browserMock();
  browser.Shopify.customerPrivacy.analyticsProcessingAllowed = () => false;
  sendCommerceEvent('add_to_cart', {}, 'denied', browser);
  browser.Shopify.customerPrivacy.analyticsProcessingAllowed = () => true;
  sendCommerceEvent('add_to_cart', {}, 'denied', browser);
  assert.equal(calls.length, 0);
  browser.Shopify.customerPrivacy.currentVisitorConsent = () => ({analytics: 'no'});
  sendCommerceEvent('view_item', {}, 'explicitly-denied', browser);
  assert.equal(calls.length, 0);
});

test('gtag get bridges anonymous identity with a bounded wait, including blocked and revoked tags', async () => {
  const {browser} = browserMock();
  browser.gtag = (_action, _id, field, callback) => callback(field === 'client_id' ? '123.456' : 789);
  assert.deepEqual(await getCheckoutAnalytics(browser), {gaClientId: '123.456', gaSessionId: '789'});
  browser.gtag = () => {};
  assert.deepEqual(await getCheckoutAnalytics(browser, 1), {});
  browser.Shopify.customerPrivacy.analyticsProcessingAllowed = () => false;
  assert.deepEqual(await getCheckoutAnalytics(browser), {});
});

test('server only admits validated anonymous context, not injected attributes or contact details', () => {
  const values = form();
  values.set('gaClientId', '123.456'); values.set('gaSessionId', '789'); values.set('email', 'private@example.com');
  const attributes = checkoutAnalyticsAttributes(values, 1000);
  assert.equal(attributes.length, 3);
  assert.equal(attributes[2].value, '1000');
  assert.ok(!JSON.stringify(attributes).includes('private'));
  values.set('gaClientId', 'private@example.com');
  assert.deepEqual(checkoutAnalyticsAttributes(values), []);
});

test('buy now keeps the saved cart cookie and carries context only in Shopify attributes', async () => {
  const values = form();
  values.set('merchandiseId', variant.id); values.set('quantity', '1');
  values.set('gaClientId', '123.456'); values.set('gaSessionId', '789');
  const result = await createBuyNowCheckout(values, {
    create: async (input) => {assert.equal(input.attributes[0].value, '123.456'); return {cart: snapshot(1)};},
    setCartId: () => assert.fail('Preserve existing cookie'),
  });
  assert.ok(!result.checkoutUrl.includes('123.456'));
});

test('saved-cart checkout preserves business attributes, clears stale context, and survives analytics failure', async () => {
  const saved = {...snapshot(1), attributes: [{key: 'business-note', value: 'keep'}, {key: 'seine_ga_client_id', value: 'stale'}]};
  let updates = 0;
  const cart = {
    get: async () => saved,
    updateAttributes: async (attributes) => {updates++; assert.deepEqual(attributes, [{key: 'business-note', value: 'keep'}]); throw new Error('Analytics write unavailable');},
  };
  assert.equal((await createSavedCartCheckout(form(), cart)).checkoutUrl, saved.checkoutUrl);
  assert.equal(updates, 1);
  assert.ok((await createSavedCartCheckout(form(), {get: async () => snapshot(0)})).errors.length);
});
