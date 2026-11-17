import {deliverPurchase, ledgerState, orderProof, orderStore} from './ga4-orders.server.js';
import {readServerProof, serverPurchaseReady, validWebhook} from './ga4-server.server.js';

const PRIVATE_HEADERS = {'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow', 'Content-Type': 'application/json; charset=utf-8'};
const RECEIPT_HEADERS = {...PRIVATE_HEADERS, 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type'};
const respond = (status, state, cors = false) => new Response(JSON.stringify({status: state}), {status, headers: cors ? RECEIPT_HEADERS : PRIVATE_HEADERS});

async function readBody(request, maxBytes) {
  if (Number(request.headers.get('Content-Length')) > maxBytes) return null;
  const reader = request.body?.getReader();
  if (!reader) return null;
  const chunks = [];
  let length = 0;
  for (;;) {
    const {value, done} = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > maxBytes) {await reader.cancel(); return null;}
    chunks.push(value);
  }
  const body = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {body.set(chunk, offset); offset += chunk.byteLength;}
  return body;
}

function orderId(value) {
  if (typeof value === 'number' && !Number.isSafeInteger(value)) return null;
  const id = String(value || '').match(/^(?:gid:\/\/shopify\/Order\/)?([1-9]\d{0,19})$/)?.[1];
  return id ? `gid://shopify/Order/${id}` : null;
}

export async function paidWebhook(request, env, store = orderStore(env), send) {
  if (request.method !== 'POST') return respond(405, 'method-not-allowed');
  if (!serverPurchaseReady(env)) return respond(503, 'not-configured');
  const body = await readBody(request, 1024 * 1024);
  if (!body) return respond(413, 'body-too-large');
  if (!await validWebhook(request, body, env)) return respond(401, 'invalid-signature');
  let payload;
  try {payload = JSON.parse(new TextDecoder().decode(body));} catch {return respond(400, 'invalid-json');}
  if (!payload || typeof payload !== 'object') return respond(400, 'invalid-order');
  const id = orderId(payload.admin_graphql_api_id || payload.id);
  if (!id) return respond(400, 'invalid-order');
  try {
    const order = await store.read(id);
    if (!order) return respond(503, 'order-unavailable');
    const result = await deliverPurchase(order, store, env, send);
    return respond(result.status === 'conflict' ? 503 : 200, result.status);
  } catch {
    // No payloads, contact details, request URLs or credential-bearing errors in logs.
    return respond(503, 'delivery-pending');
  }
}

/** Pixel sandbox has an opaque origin. Authorization is the signed per-checkout
 * proof + matching order attributes, never cookies or a client-provided price.
 */
export async function checkoutReceipt(request, env, store = orderStore(env), send, now = Date.now()) {
  if (request.method === 'OPTIONS') return new Response(null, {status: 204, headers: RECEIPT_HEADERS});
  if (request.method !== 'POST') return respond(405, 'method-not-allowed', true);
  if (!serverPurchaseReady(env)) return respond(503, 'not-configured', true);
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) return respond(415, 'invalid-content-type', true);
  const body = await readBody(request, 2048);
  if (!body) return respond(413, 'body-too-large', true);
  let payload;
  try {payload = JSON.parse(new TextDecoder().decode(body));} catch {return respond(400, 'invalid-json', true);}
  if (!payload || typeof payload !== 'object') return respond(400, 'invalid-receipt', true);
  const id = orderId(payload.orderId);
  if (!id || payload.analyticsAllowed !== true) return respond(400, 'invalid-receipt', true);
  const context = await readServerProof(payload.proof, env, now);
  if (!context) return respond(401, 'invalid-proof', true);
  try {
    let order = await store.read(id);
    if (!order || orderProof(order) !== payload.proof || order.test || order.cancelledAt) return respond(403, 'order-mismatch', true);
    const state = ledgerState(order);
    if (!state) return respond(409, 'ledger-invalid', true);
    if (!state.consent && !state.status) {
      order = await store.write(order, {consent: true, context: {client_id: context.client_id, session_id: context.session_id}, at: now});
      if (!order) return respond(409, 'conflict', true);
    }
    const result = await deliverPurchase(order, store, env, send, now);
    return respond(result.status === 'conflict' ? 409 : 200, result.status, true);
  } catch {return respond(503, 'delivery-pending', true);}
}

export function privateEndpointLoader() {
  return respond(405, 'method-not-allowed');
}
