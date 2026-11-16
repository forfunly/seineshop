import {createHash} from 'node:crypto';
import {DropshipError} from '../../../../app/lib/dropshipping-transport.server.js';
import {TEST_SHOP} from './catalog-plan.mjs';

// These operations are prepared for separately authorized order access; the live service does not execute them.
export const ORDER_SNAPSHOT_QUERY = `query DropshipOrderSnapshot($id: ID!) {
  order(id: $id) {
    id updatedAt cancelledAt displayFinancialStatus currencyCode
    lineItems(first: 250) { nodes { id currentQuantity unfulfilledQuantity requiresShipping variant { id } } pageInfo { hasNextPage } }
  }
}`;
const isId = (value, kind) => typeof value === 'string' && new RegExp(`^gid://shopify/${kind}/\\d{1,22}$`).test(value);
const fail = (code) => {throw new DropshipError(code, 409);};

/** Build a purchase proposal only from a fresh, server-read Shopify order and verified private mappings. */
export function planOrderPurchase({shop, order, mappings, supplierCurrency}) {
  if (shop !== TEST_SHOP) fail('shop-not-enabled');
  if (!isId(order?.id, 'Order') || !Number.isFinite(Date.parse(order.updatedAt))) fail('invalid-order');
  if (order.cancelledAt || order.displayFinancialStatus !== 'PAID') fail('order-not-eligible');
  if (!/^[A-Z]{3}$/.test(supplierCurrency || '') || order.currencyCode !== supplierCurrency) fail('currency-mismatch');
  if (!order.lineItems?.nodes?.length || order.lineItems.pageInfo?.hasNextPage !== false || !Array.isArray(mappings)) fail('incomplete-order');
  const map = new Map();
  for (const row of mappings) {
    if (!isId(row.sourceVariantId, 'ProductVariant') || !isId(row.targetVariantId, 'ProductVariant') || map.has(row.targetVariantId)) fail('mapping-conflict');
    map.set(row.targetVariantId, row.sourceVariantId);
  }
  const seen = new Set(), lines = [];
  for (const line of order.lineItems.nodes) {
    if (!isId(line.id, 'LineItem') || seen.has(line.id) || !Number.isSafeInteger(line.currentQuantity) || line.currentQuantity < 0 ||
      !Number.isSafeInteger(line.unfulfilledQuantity) || line.unfulfilledQuantity < 0 || line.unfulfilledQuantity > line.currentQuantity || typeof line.requiresShipping !== 'boolean') fail('invalid-order');
    seen.add(line.id);
    if (!line.requiresShipping || !line.unfulfilledQuantity) continue;
    const sourceVariantId = map.get(line.variant?.id);
    // Mixed/unmapped physical orders require manual review; never guess a variant from SKU or title.
    if (!sourceVariantId) fail('unmapped-order-line');
    if (line.unfulfilledQuantity > 9999) fail('invalid-order');
    lines.push({customerLineId: line.id, targetVariantId: line.variant.id, sourceVariantId, quantity: line.unfulfilledQuantity});
  }
  if (!lines.length) fail('nothing-to-purchase');
  lines.sort((a, b) => a.customerLineId.localeCompare(b.customerLineId));
  const snapshot = {shop, orderId: order.id, updatedAt: new Date(order.updatedAt).toISOString(), currency: supplierCurrency, lines};
  return {...snapshot, fingerprint: createHash('sha256').update(JSON.stringify(snapshot)).digest('hex'), status: 'awaiting-purchase'};
}

/** Customer payment does not release a warehouse task. A fresh supplier payment and matching purchase binding are required. */
export function verifyWarehouseRelease(plan, currentPlan, supplierOrder, binding) {
  if (!plan?.fingerprint || plan.fingerprint !== currentPlan?.fingerprint) fail('order-changed');
  if (!isId(supplierOrder?.id, 'Order') || supplierOrder.cancelledAt || supplierOrder.displayFinancialStatus !== 'PAID') fail('purchase-unpaid');
  if (binding?.supplierOrderId !== supplierOrder.id || binding?.customerOrderId !== plan.orderId || binding?.fingerprint !== plan.fingerprint) fail('purchase-mismatch');
  if (supplierOrder.currencyCode !== plan.currency || supplierOrder.lineItems?.pageInfo?.hasNextPage !== false) fail('purchase-mismatch');
  const expected = new Map(), actual = new Map();
  for (const line of plan.lines) expected.set(line.sourceVariantId, (expected.get(line.sourceVariantId) || 0) + line.quantity);
  for (const line of supplierOrder.lineItems.nodes || []) {
    if (!isId(line.variant?.id, 'ProductVariant') || !Number.isSafeInteger(line.currentQuantity) || line.currentQuantity < 0) fail('purchase-mismatch');
    if (line.requiresShipping === false) continue;
    if (line.requiresShipping !== true || line.unfulfilledQuantity !== line.currentQuantity) fail('purchase-already-fulfilled');
    actual.set(line.variant.id, (actual.get(line.variant.id) || 0) + line.currentQuantity);
  }
  if (actual.size !== expected.size || [...expected].some(([id, quantity]) => actual.get(id) !== quantity)) fail('purchase-mismatch');
  return {supplierOrderId: supplierOrder.id, customerOrderId: plan.orderId, fingerprint: plan.fingerprint, status: 'ready-for-warehouse'};
}
