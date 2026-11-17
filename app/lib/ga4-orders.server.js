import {moneyNumber, roundMoney} from './ga4-commerce.js';
import {sendGa4, SERVER_PROOF_KEY} from './ga4-server.server.js';

// These operations use Admin 2026-04, validated with Shopify AI Toolkit.
// The storefront's #graphql codegen targets the different Storefront API schema.
export const ORDER_QUERY = `
  query AnalyticsOrder($id: ID!) {
    definition: metafieldDefinition(identifier: {namespace: "seine_analytics", key: "ga4_purchase", ownerType: ORDER}) {
      type { name } access { storefront }
    }
    order(id: $id) {
      id test cancelledAt displayFinancialStatus taxesIncluded
      customAttributes { key value }
      subtotalPriceSet { presentmentMoney { amount currencyCode } }
      totalTaxSet { presentmentMoney { amount currencyCode } }
      totalShippingPriceSet { presentmentMoney { amount currencyCode } }
      lineItems(first: 250) {
        pageInfo { hasNextPage }
        nodes {
          title variantTitle quantity variant { id }
          originalUnitPriceSet { presentmentMoney { amount currencyCode } }
          discountAllocations { allocatedAmountSet { presentmentMoney { amount currencyCode } } }
          taxLines { priceSet { presentmentMoney { amount currencyCode } } }
        }
      }
      metafield(namespace: "seine_analytics", key: "ga4_purchase") { value compareDigest }
    }
  }
`;

export const LEDGER_MUTATION = `
  mutation AnalyticsLedger($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields { value compareDigest }
      userErrors { code }
    }
  }
`;

let tokenCache;
let tokenPending;

/** Own-organization apps use expiring client-credentials tokens. Never persist
 * access tokens in source, ledger records or logs. Legacy managed tokens remain supported.
 */
export async function analyticsAccessToken(env, fetcher = fetch) {
  if (env.GA4_ADMIN_ACCESS_TOKEN) return env.GA4_ADMIN_ACCESS_TOKEN;
  if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(env.PUBLIC_STORE_DOMAIN || '') ||
    !env.GA4_ADMIN_CLIENT_ID || !env.GA4_ADMIN_CLIENT_SECRET) throw new Error('Analytics app not configured');
  const matches = (entry) => entry && entry.domain === env.PUBLIC_STORE_DOMAIN && entry.id === env.GA4_ADMIN_CLIENT_ID && entry.secret === env.GA4_ADMIN_CLIENT_SECRET;
  if (matches(tokenCache) && tokenCache.expires > Date.now()) return tokenCache.token;
  if (matches(tokenPending)) return tokenPending.promise;
  const pending = {domain: env.PUBLIC_STORE_DOMAIN, id: env.GA4_ADMIN_CLIENT_ID, secret: env.GA4_ADMIN_CLIENT_SECRET};
  pending.promise = (async () => {
    const response = await fetcher(`https://${env.PUBLIC_STORE_DOMAIN}/admin/oauth/access_token`, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(3500),
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: new URLSearchParams({grant_type: 'client_credentials', client_id: env.GA4_ADMIN_CLIENT_ID, client_secret: env.GA4_ADMIN_CLIENT_SECRET}).toString(),
    });
    if (!response.ok) throw new Error('Analytics app authentication unavailable');
    const result = await response.json();
    if (typeof result.access_token !== 'string' || !result.access_token || !Number.isFinite(result.expires_in) || result.expires_in < 120) {
      throw new Error('Analytics app token unavailable');
    }
    tokenCache = {...pending, token: result.access_token, expires: Date.now() + (result.expires_in - 60) * 1000};
    return result.access_token;
  })();
  tokenPending = pending;
  try {return await pending.promise;} finally {if (tokenPending === pending) tokenPending = null;}
}

export async function analyticsAdmin(env, query, variables, fetcher = fetch) {
  if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(env.PUBLIC_STORE_DOMAIN || '')) throw new Error('Analytics shop not configured');
  const accessToken = await analyticsAccessToken(env, fetcher);
  const response = await fetcher(`https://${env.PUBLIC_STORE_DOMAIN}/admin/api/2026-04/graphql.json`, {
    method: 'POST', redirect: 'error',
    headers: {'Content-Type': 'application/json', 'X-Shopify-Access-Token': accessToken},
    body: JSON.stringify({query, variables}), signal: AbortSignal.timeout(3500),
  });
  if (!response.ok) throw new Error('Analytics order access unavailable');
  const result = await response.json();
  if (result.errors?.length || !result.data) throw new Error('Analytics order query rejected');
  return result.data;
}

export function orderStore(env, fetcher = fetch) {
  return {
    read: async (id) => {
      const data = await analyticsAdmin(env, ORDER_QUERY, {id}, fetcher);
      if (data.definition?.type?.name !== 'json' || data.definition?.access?.storefront !== 'NONE') {
        throw new Error('Analytics private ledger definition is not configured');
      }
      return data.order;
    },
    write: async (order, state) => {
      const result = await analyticsAdmin(env, LEDGER_MUTATION, {metafields: [{
        ownerId: order.id, namespace: 'seine_analytics', key: 'ga4_purchase',
        type: 'json', value: JSON.stringify(state), compareDigest: order.metafield?.compareDigest ?? null,
      }]}, fetcher);
      const payload = result.metafieldsSet;
      if (payload?.userErrors?.some(({code}) => code === 'INVALID_COMPARE_DIGEST' || code === 'STALE_OBJECT')) return null;
      if (payload?.userErrors?.length || !payload?.metafields?.[0]) throw new Error('Analytics ledger write rejected');
      return {...order, metafield: payload.metafields[0]};
    },
  };
}

export function ledgerState(order) {
  if (!order?.metafield) return {};
  try {
    const value = JSON.parse(order.metafield.value);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    return value;
  } catch { return null; }
}

export function orderProof(order) {
  return order.customAttributes?.find(({key}) => key === SERVER_PROOF_KEY)?.value;
}

/** Money comes only from an authenticated Admin read, in the shopper's currency. */
export function purchaseParams(order) {
  if (!order || order.test || order.cancelledAt || order.displayFinancialStatus !== 'PAID' || order.lineItems?.pageInfo?.hasNextPage) return null;
  const transactionId = order.id?.match(/^gid:\/\/shopify\/Order\/(\d+)$/)?.[1];
  const subtotal = order.subtotalPriceSet?.presentmentMoney;
  const currency = subtotal?.currencyCode;
  const value = moneyNumber(subtotal?.amount);
  if (!transactionId || !/^[A-Z]{3}$/.test(currency || '') || value === null) return null;
  const items = [];
  let includedItemTax = 0;
  for (const line of order.lineItems?.nodes || []) {
    const id = line.variant?.id?.match(/^gid:\/\/shopify\/ProductVariant\/(\d+)$/)?.[1];
    const original = line.originalUnitPriceSet?.presentmentMoney;
    const amount = moneyNumber(original?.amount);
    if (!id || !line.title || amount === null || original.currencyCode !== currency || !Number.isInteger(line.quantity) || line.quantity < 1) return null;
    let discounts = 0;
    for (const entry of line.discountAllocations || []) {
      const allocation = entry.allocatedAmountSet?.presentmentMoney;
      const discount = moneyNumber(allocation?.amount);
      if (discount === null || allocation.currencyCode !== currency) return null;
      discounts += discount;
    }
    let lineTax = 0;
    if (order.taxesIncluded) {
      for (const entry of line.taxLines || []) {
        const tax = entry.priceSet?.presentmentMoney;
        const amount = moneyNumber(tax?.amount);
        if (amount === null || tax.currencyCode !== currency) return null;
        lineTax += amount;
      }
    }
    includedItemTax += lineTax;
    const total = amount * line.quantity - discounts - lineTax;
    if (total < 0) return null;
    items.push({item_id: id, item_name: line.title, item_brand: 'Seine Shop',
      item_variant: line.variantTitle || '', price: total / line.quantity, quantity: line.quantity});
  }
  // Do not fabricate a reconciliation for duties, edits or unrepresented discounts.
  const exclusiveValue = roundMoney(value - includedItemTax);
  if (!items.length || exclusiveValue < 0 || Math.abs(roundMoney(items.reduce((sum, item) => sum + item.price * item.quantity, 0)) - exclusiveValue) > 0.011) return null;
  const result = {transaction_id: transactionId, currency, value: exclusiveValue, items: items.slice(0, 200)};
  for (const [key, set] of [['tax', order.totalTaxSet], ['shipping', order.totalShippingPriceSet]]) {
    const money = set?.presentmentMoney;
    const amount = moneyNumber(money?.amount);
    if (amount === null || money.currencyCode !== currency) return null;
    result[key] = amount;
  }
  if (order.taxesIncluded) {
    const shippingTax = roundMoney(result.tax - includedItemTax);
    if (shippingTax < 0 || shippingTax > result.shipping) return null;
    result.shipping = roundMoney(result.shipping - shippingTax);
  }
  return result;
}

/** A final, allowed checkout receipt is required, even when a paid webhook arrives. */
export async function deliverPurchase(order, store, env, send = sendGa4, now = Date.now()) {
  const state = ledgerState(order);
  if (!state) return {status: 'blocked'};
  if (['accepted', 'uncertain', 'sending'].includes(state.status)) return {status: state.status};
  if (!state.consent || !state.context) return {status: 'awaiting-consent'};
  const params = purchaseParams(order);
  if (!params) return {status: 'ineligible'};
  const claimed = await store.write(order, {...state, status: 'sending', at: now});
  if (!claimed) return {status: 'conflict'};
  const result = await send(env, state.context, [{name: 'purchase', params}]);
  const status = result.status === 'accepted' ? 'accepted' : 'uncertain';
  const saved = await store.write(claimed, {...state, status, at: now});
  if (!saved) throw new Error('Analytics delivery requires reconciliation');
  return {status};
}
