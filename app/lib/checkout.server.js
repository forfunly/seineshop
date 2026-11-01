import {validPurchaseQuantity} from './wholesale.js';
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
    const result = await cart.create({lines: [{merchandiseId, quantity}]});
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
