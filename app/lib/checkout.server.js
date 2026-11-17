import {validPurchaseQuantity} from './wholesale.js';
import {checkoutAnalyticsAttributes, GA4_CONTEXT_KEYS} from './ga4-commerce.js';
/** Create a separate buy-now checkout without replacing the shopper's saved cart. */
export async function createBuyNowCheckout(formData, cart) {
  const merchandiseId = formData.get('merchandiseId');
  const quantity = Number(formData.get('quantity'));
  if (
    typeof merchandiseId !== 'string' ||
    !/^gid:\/\/shopify\/ProductVariant\/\d+$/.test(merchandiseId) ||
    !validPurchaseQuantity(quantity)
  ) {
    return {errors: [{message: 'Choose a valid option and a quantity from 1 to 9999.'}]};
  }
  try {
    // Shopify determines the current price, availability, tax and shipping.
    const attributes = checkoutAnalyticsAttributes(formData);
    const result = await cart.create({lines: [{merchandiseId, quantity}], ...(attributes.length ? {attributes} : {})});
    if (result.errors?.length || result.warnings?.length) {
      return {errors: [...(result.errors || []), ...(result.warnings || [])]};
    }
    const url = new URL(result.cart?.checkoutUrl || '');
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Invalid checkout');
    return {checkoutUrl: url.href, errors: []};
  } catch {
    return {errors: [{message: 'Checkout is temporarily unavailable. Please try again or use your cart.'}]};
  }
}

/** Resume the real saved cart, preserving all unrelated checkout attributes. */
export async function createSavedCartCheckout(formData, cart) {
  try {
    const saved = await cart.get();
    if (!saved?.id || !saved.totalQuantity || saved.errors?.length) throw new Error('Missing cart');
    const url = new URL(saved.checkoutUrl);
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Invalid checkout');
    const attributes = [
      ...(saved.attributes || []).filter(({key}) => !GA4_CONTEXT_KEYS.includes(key)),
      ...checkoutAnalyticsAttributes(formData),
    ];
    // Analytics failure must not block a valid checkout or repeat a purchase write.
    try { await cart.updateAttributes(attributes); } catch { /* Checkout remains usable. */ }
    return {checkoutUrl: url.href, errors: []};
  } catch {
    return {errors: [{message: 'Checkout is temporarily unavailable. Please try again or use your cart.'}]};
  }
}
