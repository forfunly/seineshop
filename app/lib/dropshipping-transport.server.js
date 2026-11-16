const encoder = new TextEncoder();
const hex = (bytes) => [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
export class DropshipError extends Error {
  constructor(code = 'unavailable', status = 503) {super(code); this.code = code; this.status = status;}
}
export const PRIVATE_HEADERS = {'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow'};
export const validTenant = (value) => typeof value === 'string' && /^gid:\/\/shopify\/Customer\/\d{1,22}$/.test(value);
export const validShop = (value) => typeof value === 'string' && /^[a-z0-9][a-z0-9-]{0,60}\.myshopify\.com$/.test(value);

async function key(secret, purpose, usage) {
  if (!/^[a-f0-9]{64}$/.test(secret || '')) throw new DropshipError('unconfigured');
  const material = await crypto.subtle.importKey('raw', Uint8Array.from(secret.match(/../g), (part) => parseInt(part, 16)), 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey({name: 'HKDF', hash: 'SHA-256', salt: encoder.encode('seine-shop-dropship-v1'), info: encoder.encode(purpose)}, material,
    usage === 'sign' ? {name: 'HMAC', hash: 'SHA-256'} : {name: 'AES-GCM', length: 256}, false, usage === 'sign' ? ['sign', 'verify'] : ['encrypt', 'decrypt']);
}
export async function signedHeaders(secret, tenant, method, pathname, body = '', now = Date.now(), nonce = crypto.randomUUID()) {
  if (!validTenant(tenant)) throw new DropshipError('unauthorized', 401);
  const content = [tenant, String(now), nonce, method, pathname, body].join('\n');
  const signature = hex(await crypto.subtle.sign('HMAC', await key(secret, 'bridge', 'sign'), encoder.encode(content)));
  return {'Content-Type': 'application/json', 'X-Seine-Tenant': tenant, 'X-Seine-Time': String(now), 'X-Seine-Nonce': nonce, 'X-Seine-Signature': signature};
}
export async function verifyBridge(secret, request, body, seen, now = Date.now()) {
  const tenant = request.headers.get('X-Seine-Tenant'), time = request.headers.get('X-Seine-Time'), nonce = request.headers.get('X-Seine-Nonce');
  const signature = request.headers.get('X-Seine-Signature');
  if (!validTenant(tenant) || !/^\d{13}$/.test(time || '') || Math.abs(now - Number(time)) > 60000 ||
    !/^[a-f0-9-]{36}$/.test(nonce || '') || !/^[a-f0-9]{64}$/.test(signature || '') || body.length > 32768) throw new DropshipError('forbidden', 403);
  const bytes = Uint8Array.from(signature.match(/../g), (part) => parseInt(part, 16));
  const content = [tenant, time, nonce, request.method, new URL(request.url).pathname, body].join('\n');
  if (!await crypto.subtle.verify('HMAC', await key(secret, 'bridge', 'sign'), bytes, encoder.encode(content))) throw new DropshipError('forbidden', 403);
  for (const [id, expires] of seen) if (expires < now) seen.delete(id);
  if (seen.has(nonce)) throw new DropshipError('replayed', 409);
  if (seen.size >= 10000) throw new DropshipError('limited', 429);
  seen.set(nonce, now + 120000);
  return tenant;
}
const base64url = (bytes) => btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
const from64 = (value) => Uint8Array.from(atob(value.replaceAll('-', '+').replaceAll('_', '/')), (c) => c.charCodeAt(0));
export async function seal(secret, value, context) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({name: 'AES-GCM', iv, additionalData: encoder.encode(context)}, await key(secret, 'vault', 'encrypt'), encoder.encode(JSON.stringify(value)));
  return `${base64url(iv)}.${base64url(new Uint8Array(encrypted))}`;
}
export async function unseal(secret, value, context) {
  try {
    if (typeof value !== 'string' || value.length > 24000 || !/^[\w-]+\.[\w-]+$/.test(value)) throw new Error();
    const [iv, data] = value.split('.');
    const plaintext = await crypto.subtle.decrypt({name: 'AES-GCM', iv: from64(iv), additionalData: encoder.encode(context)}, await key(secret, 'vault', 'encrypt'), from64(data));
    return JSON.parse(new TextDecoder().decode(plaintext));
  } catch {throw new DropshipError('invalid-authorization', 401);}
}
export function serviceOrigin(value, requestUrl) {
  let url;
  try {url = new URL(value);} catch {throw new DropshipError('unconfigured');}
  const loopback = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
  if (url.username || url.password || url.pathname !== '/' || url.search || url.hash ||
    (url.protocol !== 'https:' && !(url.protocol === 'http:' && loopback && new URL(requestUrl).protocol === 'http:'))) throw new DropshipError('unconfigured');
  return url.origin;
}
