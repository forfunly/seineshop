import {GA_MEASUREMENT_ID} from './google-analytics-consent.js';

const encoder = new TextEncoder();
export const SERVER_PROOF_KEY = 'seine_ga_server_proof';
export const PROOF_TTL = 24 * 60 * 60 * 1000;

export function serverTrackingReady(env) {
  return env.GA4_SERVER_ENABLED === 'true' && Boolean(env.GA4_API_SECRET);
}

export function serverPurchaseReady(env) {
  return serverTrackingReady(env) && env.GA4_SERVER_PURCHASE_ENABLED === 'true' &&
    Boolean((env.GA4_ADMIN_ACCESS_TOKEN || (env.GA4_ADMIN_CLIENT_ID && env.GA4_ADMIN_CLIENT_SECRET)) && env.GA4_WEBHOOK_SECRET && env.SESSION_SECRET) &&
    /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(env.PUBLIC_STORE_DOMAIN || '');
}

export function anonymousContext(values) {
  const clientId = values.get('gaClientId');
  const sessionId = values.get('gaSessionId');
  return typeof clientId === 'string' && typeof sessionId === 'string' &&
    /^\d{1,20}\.\d{1,20}$/.test(clientId) && /^\d{1,20}$/.test(sessionId) && Number.isSafeInteger(Number(sessionId)) && Number(sessionId) > 0
    ? {client_id: clientId, session_id: Number(sessionId)} : null;
}

export async function hmac(secret, body) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), {name: 'HMAC', hash: 'SHA-256'}, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, typeof body === 'string' ? encoder.encode(body) : body));
}

function base64(bytes) {
  return btoa(String.fromCharCode(...bytes));
}

export function sameSignature(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return difference === 0;
}

/** Proof binds the final checkout consent receipt to anonymous checkout attributes. */
export async function checkoutServerAttributes(form, env, now = Date.now()) {
  const context = anonymousContext(form);
  if (form.get('ga4') !== '1' || !serverPurchaseReady(env) || !context) return [];
  const payload = btoa(JSON.stringify({...context, at: now, v: 1}));
  const signature = base64(await hmac(env.SESSION_SECRET, payload));
  return [{key: SERVER_PROOF_KEY, value: `${payload}.${signature}`}];
}

export async function readServerProof(proof, env, now = Date.now()) {
  if (typeof proof !== 'string' || proof.length > 600 || !env.SESSION_SECRET) return null;
  const [payload, signature, extra] = proof.split('.');
  if (!payload || !signature || extra || !sameSignature(signature, base64(await hmac(env.SESSION_SECRET, payload)))) return null;
  try {
    const value = JSON.parse(atob(payload));
    if (value.v !== 1 || !Number.isSafeInteger(value.at) || value.at > now + 60000 || now - value.at > PROOF_TTL) return null;
    const context = anonymousContext(new Map([['gaClientId', value.client_id], ['gaSessionId', String(value.session_id)]]));
    return context ? {...context, at: value.at} : null;
  } catch { return null; }
}

/** Fixed endpoint; no user data, incoming URLs, headers or arbitrary params forwarded. */
export async function sendGa4(env, context, events, fetcher = fetch) {
  if (!serverTrackingReady(env) || !context || !events.length) return {status: 'disabled'};
  const url = new URL('https://www.google-analytics.com/mp/collect');
  url.searchParams.set('measurement_id', GA_MEASUREMENT_ID);
  url.searchParams.set('api_secret', env.GA4_API_SECRET);
  try {
    const response = await fetcher(url.href, {
      method: 'POST', headers: {'Content-Type': 'application/json'}, redirect: 'error',
      signal: AbortSignal.timeout(3500),
      body: JSON.stringify({
        client_id: context.client_id,
        consent: {ad_user_data: 'DENIED', ad_personalization: 'DENIED'},
        events: events.map(({name, params}) => ({name, params: {
          ...params, session_id: context.session_id,
          engagement_time_msec: 1,
        }})),
      }),
    });
    // MP may silently reject malformed events even after 2xx; verify ingestion separately.
    return {status: response.ok ? 'accepted' : 'uncertain'};
  } catch {
    // Never log a fetch error: it may contain the API secret in its URL.
    return {status: 'uncertain'};
  }
}

/** Switch ownership before scheduling. An uncertain server result never dual-sends. */
export function dispatchCartAnalytics(result, form, context, fetcher = fetch, request) {
  const identity = anonymousContext(form);
  if (!result.ga4 || form.get('ga4') !== '1' || !serverTrackingReady(context.env) || !identity || typeof context.waitUntil !== 'function' ||
    (request && request.headers.get('Origin') !== new URL(request.url).origin)) return result;
  const events = result.ga4.events.map((params) => ({name: 'add_to_cart', params}));
  const task = sendGa4(context.env, identity, events, fetcher).then(({status}) => {
    if (status === 'uncertain') console.warn('GA4 add_to_cart delivery uncertain');
  });
  context.waitUntil(task);
  return {...result, ga4: undefined};
}

export async function validWebhook(request, body, env) {
  return request.headers.get('x-shopify-topic') === 'orders/paid' &&
    request.headers.get('x-shopify-shop-domain') === env.PUBLIC_STORE_DOMAIN &&
    sameSignature(request.headers.get('x-shopify-hmac-sha256'), base64(await hmac(env.GA4_WEBHOOK_SECRET, body)));
}
