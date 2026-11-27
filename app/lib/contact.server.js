import {businessSessionValues, limitedBody, ServiceError, trustedBuyerIp} from './business-tools.server.js';
import {validateContact} from './contact.js';

const HEADERS = {'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow'};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const buckets = new Map();
const WINDOW = 10 * 60 * 1000;
const RECIPIENT = 'hello@seineshop.com';
const SENDER = 'Seine Shop <contact@notify.seineshop.com>';

function result(data, status = 200) {
  return Response.json(data, {status, headers: {...HEADERS, ...(status === 429 ? {'Retry-After': '600'} : {})}});
}

function configured(env) {
  return typeof env?.CONTACT_RESEND_API_KEY === 'string' && /^re_[A-Za-z0-9_-]{10,}$/.test(env.CONTACT_RESEND_API_KEY);
}

export function contactBootstrap(context) {
  if (!configured(context.env)) return result({code: 'unconfigured'}, 503);
  const {csrf} = businessSessionValues(context);
  return result({csrf, submissionId: crypto.randomUUID()});
}

function rateLimit(key, now) {
  // This is a bounded, best-effort per-worker safeguard, not distributed storage.
  if (buckets.size >= 5000) {
    for (const [id, value] of buckets) if (value.until <= now) buckets.delete(id);
    if (buckets.size >= 5000 && !buckets.has(key)) throw new ServiceError('limited', 429);
  }
  const previous = buckets.get(key);
  if (previous?.until > now && previous.count >= 5) throw new ServiceError('limited', 429);
  buckets.set(key, previous?.until > now ? {...previous, count: previous.count + 1} : {count: 1, until: now + WINDOW});
}

export async function submitContact(request, context, {send = fetch, now = Date.now()} = {}) {
  let submissionId;
  try {
    if (request.method !== 'POST') return result({code: 'method'}, 405);
    if (request.headers.get('origin') !== new URL(request.url).origin || request.headers.get('sec-fetch-site') === 'cross-site') return result({code: 'forbidden'}, 403);
    if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/x-www-form-urlencoded') return result({code: 'invalid'}, 415);
    const values = new URLSearchParams(await (await limitedBody(request, 20 * 1024)).text());
    for (const key of values.keys()) if (values.getAll(key).length !== 1) return result({code: 'invalid'}, 400);
    if (!context.session.get('businessCsrf') || values.get('csrf') !== context.session.get('businessCsrf') || !context.session.get('businessVisitor')) return result({code: 'forbidden'}, 403);
    submissionId = values.get('submissionId');
    if (!UUID.test(submissionId || '') || values.get('website')) return result({code: 'invalid'}, 400);
    const {fields, errors} = validateContact(Object.fromEntries(values));
    if (Object.keys(errors).length) return result({code: 'invalid', errors, submissionId}, 422);
    if (!configured(context.env)) return result({code: 'unconfigured', submissionId}, 503);
    rateLimit(trustedBuyerIp(request) || context.session.get('businessVisitor'), now);
    const body = {
      from: SENDER,
      to: [RECIPIENT],
      reply_to: fields.email,
      subject: `Seine Shop — ${fields.topic}`,
      text: `Website contact message\nSubmission: ${submissionId}\nTopic: ${fields.topic}\nName: ${fields.name}\nEmail: ${fields.email}\nOrder or item number: ${fields.reference || '—'}\n\n${fields.message}`,
    };
    let response;
    let data;
    try {
      response = await send('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${context.env.CONTACT_RESEND_API_KEY}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': `contact/${context.session.get('businessVisitor')}/${submissionId}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000),
        redirect: 'manual',
        cache: 'no-store',
      });
      if (!response.ok) {
        const code = response.status === 429 ? 'limited' : response.status === 409 ? 'conflict' : response.status >= 500 || response.status < 400 ? 'uncertain' : 'unavailable';
        return result({code, submissionId}, code === 'limited' ? 429 : code === 'conflict' ? 409 : 503);
      }
      data = await response.json();
    } catch {
      // The provider may have accepted a timed-out request. Never retry automatically.
      return result({code: 'uncertain', submissionId}, 503);
    }
    if (response.ok && typeof data.id === 'string' && data.id) return result({code: 'accepted', submissionId});
    return result({code: 'uncertain', submissionId}, 503);
  } catch (error) {
    return result({code: error instanceof ServiceError ? error.code : 'unavailable', submissionId}, error instanceof ServiceError ? error.status : 503);
  }
}
