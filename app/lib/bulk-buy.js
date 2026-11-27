import {MAX_PURCHASE_QUANTITY} from './wholesale.js';

export const MAX_CART_LINES = 250;
export const BULK_QUANTITY_ERROR = 'Choose a whole quantity from 0 to 9999 for each option.';
export const CART_LINES_ERROR = 'Choose up to 250 different options with quantities from 1 to 9999.';

export function bulkQuantityLimits(rule) {
  return {minimum: rule?.minimum ?? 1, maximum: Math.min(rule?.maximum ?? MAX_PURCHASE_QUANTITY, MAX_PURCHASE_QUANTITY), increment: rule?.increment ?? 1};
}

export function validBulkQuantity(value, rule) {
  if (!/^\d{1,4}$/.test(String(value))) return false;
  const quantity = Number(value);
  const {minimum, maximum, increment} = bulkQuantityLimits(rule);
  return quantity === 0 || (quantity >= minimum && quantity <= maximum && quantity % increment === 0);
}

/** Multiple real options, with at least one purchasable in this market. */
export function canShowBulkBuy(product) {
  const variants = product?.variants?.nodes;
  return Array.isArray(variants) && new Set(variants.map(({id}) => id).filter(Boolean)).size > 1 &&
    [...variants, product.selectedOrFirstAvailableVariant].some((variant) => variant?.availableForSale && bulkQuantityLimits(variant.quantityRule).minimum <= bulkQuantityLimits(variant.quantityRule).maximum);
}

/** Only send fields this storefront supports; Shopify determines prices and stock. */
export function purchaseLines(lines) {
  if (!Array.isArray(lines) || !lines.length || lines.length > MAX_CART_LINES) return null;
  const seen = new Set();
  const clean = [];
  for (const line of lines) {
    if (!line || typeof line.merchandiseId !== 'string' ||
      !/^gid:\/\/shopify\/ProductVariant\/[1-9]\d*$/.test(line.merchandiseId) ||
      seen.has(line.merchandiseId) || typeof line.quantity !== 'number' ||
      !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > MAX_PURCHASE_QUANTITY) return null;
    seen.add(line.merchandiseId);
    clean.push({merchandiseId: line.merchandiseId, quantity: line.quantity});
  }
  return clean;
}

export async function addPurchaseLines(lines, cart) {
  const clean = purchaseLines(lines);
  if (!clean) return {errors: [{message: CART_LINES_ERROR}]};
  try {
    return await cart.addLines(clean);
  } catch {
    // A lost response can follow a successful write. Never automatically retry.
    return {uncertain: true, errors: [{message: 'We could not confirm your cart update. Check your cart before trying again.'}]};
  }
}
