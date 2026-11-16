import test from 'node:test';
import assert from 'node:assert/strict';
import {planOrderPurchase, verifyWarehouseRelease} from '../apps/dropshipping/seine-shop-dropshipping-dev/src/order-plan.mjs';
import {TEST_SHOP} from '../apps/dropshipping/seine-shop-dropshipping-dev/src/catalog-plan.mjs';
const mappings = [{sourceVariantId: 'gid://shopify/ProductVariant/11', targetVariantId: 'gid://shopify/ProductVariant/21'}];
const order = () => ({id: 'gid://shopify/Order/1', updatedAt: '2026-11-16T01:00:00Z', displayFinancialStatus: 'PAID', cancelledAt: null, currencyCode: 'USD',
  lineItems: {pageInfo: {hasNextPage: false}, nodes: [{id: 'gid://shopify/LineItem/31', currentQuantity: 3, unfulfilledQuantity: 2, requiresShipping: true, variant: {id: mappings[0].targetVariantId}, title: 'Do not match by title', sku: 'Do not match by SKU', price: '0.01'}]},
  email: 'private@example.test', shippingAddress: {address1: 'Private address'}});
const plan = (data = order()) => planOrderPurchase({shop: TEST_SHOP, order: data, mappings, supplierCurrency: 'USD'});
test('order planning uses stable variant IDs and outstanding quantities without prices or personal data', () => {
  const result = plan();
  assert.equal(result.status, 'awaiting-purchase');assert.equal(result.lines[0].quantity, 2);
  assert.equal(result.lines[0].sourceVariantId, mappings[0].sourceVariantId);
  assert.doesNotMatch(JSON.stringify(result), /private@|Private address|0.01|SKU|title/);
  assert.equal(result.fingerprint, plan().fingerprint);
  const changed = order();changed.lineItems.nodes[0].unfulfilledQuantity = 1;
  assert.notEqual(result.fingerprint, plan(changed).fingerprint);
});
test('unpaid, cancelled, refunded, incomplete, unmapped and malformed orders fail before purchase', () => {
  for (const mutate of [
    (o) => {o.displayFinancialStatus = 'PENDING';}, (o) => {o.displayFinancialStatus = 'PARTIALLY_REFUNDED';},
    (o) => {o.cancelledAt = o.updatedAt;}, (o) => {o.currencyCode = 'EUR';},
    (o) => {o.lineItems.pageInfo.hasNextPage = true;}, (o) => {o.lineItems.nodes[0].variant.id = 'gid://shopify/ProductVariant/999';},
    (o) => {o.lineItems.nodes[0].unfulfilledQuantity = 0;}, (o) => {o.lineItems.nodes[0].unfulfilledQuantity = 4;},
    (o) => {o.lineItems.nodes.push({...o.lineItems.nodes[0]});},
  ]) {const value = order();mutate(value);assert.throws(() => plan(value));}
  assert.throws(() => planOrderPurchase({shop: 'other.myshopify.com', order: order(), mappings, supplierCurrency: 'USD'}));
});
function purchase() {
  return {id: 'gid://shopify/Order/2', cancelledAt: null, displayFinancialStatus: 'PAID', currencyCode: 'USD',
    lineItems: {pageInfo: {hasNextPage: false}, nodes: [{variant: {id: mappings[0].sourceVariantId}, currentQuantity: 2, unfulfilledQuantity: 2, requiresShipping: true}]}};
}
const binding = (p) => ({supplierOrderId: 'gid://shopify/Order/2', customerOrderId: p.orderId, fingerprint: p.fingerprint});
test('warehouse release requires separate paid purchase, exact order binding, unchanged snapshot and matching quantities', () => {
  const p = plan();
  assert.equal(verifyWarehouseRelease(p, plan(), purchase(), binding(p)).status, 'ready-for-warehouse');
  for (const mutate of [
    (o) => {o.displayFinancialStatus = 'PENDING';}, (o) => {o.cancelledAt = '2026-11-16T02:00:00Z';},
    (o) => {o.lineItems.nodes[0].currentQuantity = 1;}, (o) => {o.lineItems.nodes[0].variant.id = 'gid://shopify/ProductVariant/999';},
    (o) => {o.lineItems.pageInfo.hasNextPage = true;},
    (o) => {o.lineItems.nodes[0].unfulfilledQuantity = 1;},
  ]) {const value = purchase();mutate(value);assert.throws(() => verifyWarehouseRelease(p, plan(), value, binding(p)));}
  assert.throws(() => verifyWarehouseRelease(p, {...p, fingerprint: 'changed'}, purchase(), binding(p)), /order-changed/);
  assert.throws(() => verifyWarehouseRelease(p, plan(), purchase(), {...binding(p), customerOrderId: 'gid://shopify/Order/999'}), /purchase-mismatch/);
});
