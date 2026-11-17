import {addPurchaseLines} from './bulk-buy.js';
import {cartAdditionReceipt} from './ga4-commerce.js';

async function snapshot(cart, cartId) {
  try {
    const result = await cart.get({numCartLines: 250, ...(cartId ? {cartId} : {})});
    if (result?.errors?.length || result?.lines?.pageInfo?.hasNextPage) return undefined;
    if (result && !Array.isArray(result.lines?.nodes)) return undefined;
    return result;
  } catch {
    return undefined;
  }
}

export async function addCartLinesWithAnalytics(lines, cart, enabled) {
  const before = enabled ? await snapshot(cart) : undefined;
  const result = await addPurchaseLines(lines, cart);
  // Never retry a write, or infer success from a missing/uncertain response.
  if (!enabled || before === undefined || result.errors?.length || result.uncertain || !result.cart?.id) return result;
  const after = await snapshot(cart, result.cart.id);
  const ga4 = cartAdditionReceipt(before, after, lines, crypto.randomUUID());
  return {...result, ...(after ? {cart: after} : {}), ga4};
}
