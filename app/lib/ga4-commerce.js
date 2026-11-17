/** Shared GA4 mapping. No customer, sourcing, cart token or payment fields. */
export const GA4_CONTEXT_KEYS = ['seine_ga_client_id', 'seine_ga_session_id', 'seine_ga_captured_at'];
export const moneyNumber = (value) => value !== null && value !== undefined && value !== '' &&
  Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : null;
export const roundMoney = (value) => Number(value.toFixed(6));

export function commerceItem(variant, product, price, quantity = 1) {
  const id = String(variant?.id || '').match(/(?:^|\/)ProductVariant\/(\d+)$/)?.[1];
  const amount = moneyNumber(price?.amount);
  if (!id || !product?.title || amount === null || !Number.isInteger(quantity) || quantity < 1) return null;
  return {
    item_id: id,
    item_name: product.title,
    item_brand: 'Seine Shop',
    item_variant: variant.title || '',
    price: amount,
    quantity,
  };
}

/** GA4 accepts up to 200 items per event; preserve all bulk-buy quantities. */
export function commerceBatches(items, currency) {
  if (!items.length || !/^[A-Z]{3}$/.test(currency || '')) return [];
  const batches = [];
  for (let offset = 0; offset < items.length; offset += 200) {
    const batch = items.slice(offset, offset + 200);
    batches.push({currency, value: roundMoney(batch.reduce((sum, item) => sum + item.price * item.quantity, 0)), items: batch});
  }
  return batches;
}

/** Compare authoritative snapshots, including partial stock adjustments. */
export function cartAdditionReceipt(before, after, requested, eventId) {
  if (before === undefined || !after?.lines?.nodes || after.errors?.length || !Array.isArray(requested)) return null;
  const quantities = (cart) => {
    const result = new Map();
    for (const line of cart?.lines?.nodes || []) {
      const id = line.merchandise?.id;
      result.set(id, (result.get(id) || 0) + line.quantity);
    }
    return result;
  };
  const previous = quantities(before);
  const current = quantities(after);
  const currency = after.cost?.subtotalAmount?.currencyCode;
  const items = [];
  for (const request of requested) {
    const id = request.merchandiseId;
    // An incomplete old snapshot cannot prove that a previously unseen SKU is new.
    if (before?.lines?.pageInfo?.hasNextPage && !previous.has(id)) continue;
    const delta = (current.get(id) || 0) - (previous.get(id) || 0);
    if (!Number.isInteger(delta) || delta <= 0 || delta > request.quantity) continue;
    const line = after.lines.nodes.find((entry) => entry.merchandise?.id === id);
    const price = line?.cost?.amountPerQuantity;
    if (price?.currencyCode !== currency) continue;
    const item = commerceItem(line.merchandise, line.merchandise.product, price, delta);
    if (item) items.push(item);
  }
  const events = commerceBatches(items, currency);
  return events.length ? {eventId, events} : null;
}

/** Identifiers are analytics metadata only; never trust arbitrary form attributes. */
export function checkoutAnalyticsAttributes(formData, now = Date.now()) {
  const clientId = formData.get('gaClientId');
  const sessionId = formData.get('gaSessionId');
  if (typeof clientId !== 'string' || !/^\d{1,20}\.\d{1,20}$/.test(clientId) ||
    typeof sessionId !== 'string' || !/^\d{1,20}$/.test(sessionId)) return [];
  return [
    {key: GA4_CONTEXT_KEYS[0], value: clientId},
    {key: GA4_CONTEXT_KEYS[1], value: sessionId},
    {key: GA4_CONTEXT_KEYS[2], value: String(now)},
  ];
}
