import {
  numericId,
  quoteFields,
  validateInquiry,
  validSummary,
} from './business-tools.js';

const BASES = {
  b2b: 'https://b2b.sectionly.ai/api/storefront/v1',
  reviews: 'https://app-next.customerssay.ai/api/storefront/v1',
};
const NO_STORE = {
  'Cache-Control': 'private, no-store',
  'X-Robots-Tag': 'noindex, nofollow',
};
const buckets = new Map();

class ServiceError extends Error {
  constructor(code = 'unavailable', status = 503, retryAfter = null) {
    super(code);
    this.code = code;
    this.status = status;
    this.retryAfter = /^\d{1,6}$/.test(retryAfter || '') ? retryAfter : null;
  }
}

function result(data, status = 200, retryAfter = null) {
  return Response.json(data, {
    status,
    headers: {...NO_STORE, ...(retryAfter ? {'Retry-After': retryAfter} : {})},
  });
}

export async function businessResponse(work) {
  try {
    return await work();
  } catch (error) {
    const known = error instanceof ServiceError;
    return result(
      {success: false, code: known ? error.code : 'unavailable'},
      known ? error.status : 503,
      known ? error.retryAfter : null,
    );
  }
}

function keyFor(context, service) {
  const key =
    context.env[
      service === 'b2b'
        ? 'SECTIONLY_B2B_PRIVATE_KEY'
        : 'CUSTOMERSSAY_SECRET_KEY'
    ];
  if (
    typeof key !== 'string' ||
    !key.startsWith(service === 'b2b' ? 'sb2b_sk_' : 'sk_live_')
  )
    throw new ServiceError('unconfigured');
  return key;
}

export function trustedBuyerIp(request) {
  // Oxygen controls this header. Do not substitute user-supplied forwarding chains.
  if (
    ['localhost', '127.0.0.1', '[::1]'].includes(new URL(request.url).hostname)
  )
    return null;
  const ip = request.headers.get('oxygen-buyer-ip');
  return ip && /^[0-9a-fA-F.:]{3,45}$/.test(ip) ? ip : null;
}

export async function callBusinessApi(
  context,
  request,
  service,
  path,
  {body, operationId, timeout = 5000} = {},
) {
  const headers = new Headers({
    Authorization: `Bearer ${keyFor(context, service)}`,
    Accept: 'application/json',
  });
  if (service === 'b2b') {
    headers.set('X-Sectionly-Visitor', sessionValues(context).visitor);
    if (operationId) headers.set('Idempotency-Key', operationId);
  } else {
    const ip = trustedBuyerIp(request);
    if (ip) headers.set('X-CustomersSay-Client-IP', ip);
    headers.set(
      'X-CustomersSay-Client-UA',
      (request.headers.get('user-agent') || '').slice(0, 1024),
    );
  }
  if (body && !(body instanceof FormData))
    headers.set('Content-Type', 'application/json');
  let response;
  try {
    response = await fetch(`${BASES[service]}${path}`, {
      method: body ? 'POST' : 'GET',
      headers,
      ...(body ? {body} : {}),
      signal: AbortSignal.timeout(timeout),
      redirect: 'manual',
      cache: 'no-store',
    });
    if (response.status >= 300 && response.status < 400)
      throw new ServiceError(body ? 'uncertain' : 'unavailable');
    const data = await response.json();
    if (!response.ok || data.success === false) {
      const status = response.ok ? 503 : response.status;
      const code =
        body && status >= 500
          ? 'uncertain'
          : status === 429
            ? 'limited'
            : status === 409
              ? 'conflict'
              : status === 400 || status === 413 || status === 415
                ? 'invalid'
                : 'unavailable';
      throw new ServiceError(code, status, response.headers.get('Retry-After'));
    }
    return {data, status: response.status};
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    throw new ServiceError(body ? 'uncertain' : 'unavailable', 503);
  }
}

function sessionValues(context) {
  let visitor = context.session.get('businessVisitor');
  let csrf = context.session.get('businessCsrf');
  if (!visitor) {
    visitor = crypto.randomUUID();
    context.session.set('businessVisitor', visitor);
  }
  if (!csrf) {
    csrf = crypto.randomUUID();
    context.session.set('businessCsrf', csrf);
  }
  return {visitor, csrf};
}

function guard(request, context) {
  const origin = new URL(request.url).origin;
  if (
    request.headers.get('origin') !== origin ||
    request.headers.get('sec-fetch-site') === 'cross-site' ||
    !context.session.get('businessCsrf') ||
    request.headers.get('X-Seine-CSRF') !== context.session.get('businessCsrf')
  ) {
    throw new ServiceError('forbidden', 403);
  }
  const visitor = context.session.get('businessVisitor');
  if (!visitor) throw new ServiceError('forbidden', 403);
  const now = Date.now();
  const bucketKey = `${trustedBuyerIp(request) || 'local'}:${visitor}`;
  const bucket = buckets.get(bucketKey);
  if (bucket && bucket.until > now && bucket.count >= 25)
    throw new ServiceError('limited', 429, '60');
  if (buckets.size > 5000) {
    for (const [key, value] of buckets)
      if (value.until <= now) buckets.delete(key);
    if (buckets.size > 10000) throw new ServiceError('limited', 429, '60');
  }
  buckets.set(
    bucketKey,
    bucket && bucket.until > now
      ? {...bucket, count: bucket.count + 1}
      : {until: now + 60000, count: 1},
  );
}

export {sessionValues as businessSessionValues, guard as guardBusinessRequest};

export async function limitedBody(request, limit) {
  const length = request.headers.get('content-length');
  if (length && (!/^\d+$/.test(length) || Number(length) > limit))
    throw new ServiceError('invalid', 413);
  if (!request.body) throw new ServiceError('invalid', 400);
  const reader = request.body.getReader();
  const chunks = [];
  let bytes = 0;
  const deadline = Date.now() + 15000;
  try {
    while (true) {
      let timer;
      let chunk;
      try {
        chunk = await Promise.race([
          reader.read(),
          new Promise((_, reject) => {
            timer = setTimeout(
              () => {
                void reader.cancel().catch(() => {});
                reject(new ServiceError('invalid', 408));
              },
              Math.max(1, deadline - Date.now()),
            );
          }),
        ]);
      } finally {
        clearTimeout(timer);
      }
      const {done, value} = chunk;
      if (done) break;
      bytes += value.byteLength;
      if (bytes > limit || chunks.length > 65536) {
        await reader.cancel();
        throw new ServiceError('invalid', 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return new Blob(chunks);
}

const QUOTE_PRODUCT_QUERY = `#graphql
  query BusinessQuoteProduct($handle: String!, $after: String, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      id title handle
      variants(first: 50, after: $after) {
        nodes { id title sku availableForSale image { url altText width height } }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
`;

async function quoteProduct(context, handle, after = null) {
  if (
    typeof handle !== 'string' ||
    !/^[a-zA-Z0-9_-]{1,255}$/.test(handle) ||
    (after && after.length > 1024)
  )
    throw new ServiceError('invalid', 400);
  const {product} = await context.storefront.query(QUOTE_PRODUCT_QUERY, {
    variables: {handle, after},
    cache: context.storefront.CacheNone(),
  });
  if (!product?.id) throw new ServiceError('invalid', 404);
  return product;
}

async function formConfig(context, request, handle) {
  const {data} = await callBusinessApi(context, request, 'b2b', '/form-config');
  const moq = Number(data.defaultMoq);
  if (!Number.isSafeInteger(moq) || moq < 1) throw new ServiceError();
  const {data: rules} = await callBusinessApi(
    context,
    request,
    'b2b',
    `/b2b-products?${new URLSearchParams({handles: handle})}`,
  );
  if (!Array.isArray(rules.b2bHandles)) throw new ServiceError();
  // Product membership does not authorize price hiding or restrict retail checkout.
  return {
    moq,
    fields: quoteFields(data.fields),
    listedForB2b: rules.b2bHandles.includes(handle),
  };
}

export async function inquiryLoader({request, context}) {
  return businessResponse(async () => {
    const url = new URL(request.url);
    const product = await quoteProduct(
      context,
      url.searchParams.get('handle'),
      url.searchParams.get('after'),
    );
    const session = sessionValues(context);
    const config = await formConfig(context, request, product.handle);
    return result({success: true, product, config, csrf: session.csrf});
  });
}

export async function inquiryAction({request, context}) {
  return businessResponse(async () => {
    if (request.method !== 'POST')
      return result({success: false, code: 'invalid'}, 405);
    guard(request, context);
    if (!request.headers.get('content-type')?.startsWith('application/json'))
      throw new ServiceError('invalid', 415);
    let input;
    try {
      input = JSON.parse(await (await limitedBody(request, 256 * 1024)).text());
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw new ServiceError('invalid', 400);
    }
    if (
      !input ||
      typeof input !== 'object' ||
      !/^[A-Za-z0-9_-]{16,128}$/.test(input.operationId || '')
    )
      throw new ServiceError('invalid', 400);
    const config = await formConfig(
      context,
      request,
      input.payload?.productHandle || '',
    );
    const invalid = validateInquiry(input.payload, config);
    if (invalid) throw new ServiceError(invalid, 400);
    const payload = input.payload;
    const product = await quoteProduct(context, payload.productHandle);
    if (numericId(product.id) !== numericId(payload.productId))
      throw new ServiceError('invalid', 400);
    const {nodes} = await context.storefront.query(VARIANT_OWNERS_QUERY, {
      variables: {
        ids: payload.lineItems.map(
          (line) =>
            `gid://shopify/ProductVariant/${numericId(line.variantId, 'ProductVariant')}`,
        ),
      },
      cache: context.storefront.CacheNone(),
    });
    if (
      nodes.length !== payload.lineItems.length ||
      nodes.some((node) => node?.product?.id !== product.id)
    )
      throw new ServiceError('invalid', 400);
    const customFields = Object.fromEntries(
      config.fields.map((field) => [
        field.label,
        payload.customFields[field.label] || '',
      ]),
    );
    customFields['Company Name'] = String(payload.customFields['Company Name'])
      .trim()
      .slice(0, 500);
    customFields['Phone / WhatsApp'] =
      payload.customFields['Phone / WhatsApp'].trim();
    const outgoing = {
      customerName: payload.customerName.trim(),
      customerEmail: payload.customerEmail.trim(),
      productId: product.id,
      productHandle: product.handle,
      lineItems: payload.lineItems.map((line) => ({
        variantId: `gid://shopify/ProductVariant/${numericId(line.variantId, 'ProductVariant')}`,
        quantity: line.quantity,
      })),
      customFields,
      note: payload.note,
    };
    const {data, status} = await callBusinessApi(
      context,
      request,
      'b2b',
      '/inquiry',
      {
        body: JSON.stringify(outgoing),
        operationId: input.operationId,
        timeout: 12000,
      },
    );
    if (!data.success || !data.inquiryId) throw new ServiceError('uncertain');
    return result({success: true, inquiryId: String(data.inquiryId)}, status);
  });
}

const VARIANT_OWNERS_QUERY = `#graphql
  query BusinessVariantOwners($ids: [ID!]!) {
    nodes(ids: $ids) { ... on ProductVariant { id product { id } } }
  }
`;

function safeMediaUrl(value) {
  try {
    const url = new URL(value);
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      !/^[a-z0-9.-]+$/i.test(url.hostname) ||
      !/(^|\.)customerssay\.ai$|\.r2\.dev$|\.r2\.cloudflarestorage\.com$|(^|\.)storage\.googleapis\.com$|(^|\.)cdn\.shopify\.com$/.test(
        url.hostname,
      ) ||
      /^(?:\d{1,3}\.){3}\d{1,3}$/.test(url.hostname) ||
      url.hostname.endsWith('.local') ||
      url.href.length > 1500
    )
      return null;
    return url.href;
  } catch {
    return null;
  }
}

function base64url(bytes) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function signingKey(context) {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(context.env.SESSION_SECRET),
    {name: 'HMAC', hash: 'SHA-256'},
    false,
    ['sign', 'verify'],
  );
}

async function seal(context, data) {
  const body = base64url(
    new TextEncoder().encode(
      JSON.stringify({...data, expires: Date.now() + 3600000}),
    ),
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    await signingKey(context),
    new TextEncoder().encode(body),
  );
  return `${body}.${base64url(new Uint8Array(signature))}`;
}

async function unseal(context, token) {
  try {
    if (typeof token !== 'string' || token.length > 5000) throw new Error();
    const [body, signature, extra] = token.split('.');
    if (extra || !body || !signature) throw new Error();
    const decode = (s) =>
      Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) =>
        c.charCodeAt(0),
      );
    if (
      !(await crypto.subtle.verify(
        'HMAC',
        await signingKey(context),
        decode(signature),
        new TextEncoder().encode(body),
      ))
    )
      throw new Error();
    const data = JSON.parse(new TextDecoder().decode(decode(body)));
    if (data.expires < Date.now() || !safeMediaUrl(data.url)) throw new Error();
    return data;
  } catch {
    throw new ServiceError('invalid', 400);
  }
}

export async function readProductReviews(
  context,
  request,
  productId,
  page = 1,
  rating = '',
) {
  try {
    if (!numericId(productId)) throw new ServiceError('invalid', 400);
    const params = new URLSearchParams({
      product_id: productId,
      page: String(page),
      limit: '5',
    });
    if (rating) params.set('rating_filter', rating);
    const {data} = await callBusinessApi(
      context,
      request,
      'reviews',
      `/reviews?${params}`,
      {timeout: 3000},
    );
    const summary = validSummary(data.summary);
    if (!summary || !Array.isArray(data.reviews)) throw new ServiceError();
    const reviews = await Promise.all(
      data.reviews.slice(0, 5).map(async (review) => ({
        id: String(review.id),
        rating: Number(review.rating),
        nickname: String(review.user?.nickname || '').slice(0, 150),
        title: String(review.title || '').slice(0, 300),
        content: String(review.content || '').slice(0, 16000),
        date: reviewDate(review.created_at || review.createdAt),
        media: await Promise.all(
          (Array.isArray(review.media) ? review.media : [])
            .filter(
              (m) =>
                (m.mediaType || m.type) === 'image' &&
                safeMediaUrl(m.url || m.mediaUrl),
            )
            .slice(0, 6)
            .map(async (m) => ({
              src: `/api/product-reviews?intent=image&token=${await seal(context, {url: m.url || m.mediaUrl, scope: 'public-image'})}`,
            })),
        ),
      })),
    );
    if (
      reviews.some(
        (review) =>
          !Number.isInteger(review.rating) ||
          review.rating < 1 ||
          review.rating > 5,
      )
    )
      throw new ServiceError();
    return {
      status: 'ready',
      reviews,
      summary,
      page,
      hasNextPage: data.pagination?.hasNextPage === true,
    };
  } catch (error) {
    return {
      status:
        error instanceof ServiceError && error.code === 'unconfigured'
          ? 'unconfigured'
          : 'unavailable',
      reviews: [],
      summary: null,
      page,
      hasNextPage: false,
    };
  }
}

function reviewDate(value) {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}/.test(value) ||
    !Number.isFinite(Date.parse(value))
  )
    return null;
  return new Date(value).toISOString().slice(0, 10);
}

async function reviewSettings(context, request) {
  const {data} = await callBusinessApi(
    context,
    request,
    'reviews',
    '/widget-settings',
  );
  const form = data.settings?.formConfig;
  if (!form || typeof form !== 'object') throw new ServiceError();
  return {
    allowPhotos: form.allowPhotos !== false,
    requireName: form.requireName === true,
    requireTitle: form.requireTitle === true,
    requireFeedback: form.requireFeedback !== false,
  };
}

export async function reviewsLoader({request, context}) {
  return businessResponse(async () => {
    const url = new URL(request.url);
    if (url.searchParams.get('intent') === 'image') {
      const media = await unseal(context, url.searchParams.get('token'));
      if (media.scope !== 'public-image')
        throw new ServiceError('forbidden', 403);
      const upstream = await fetch(media.url, {
        redirect: 'manual',
        signal: AbortSignal.timeout(8000),
        cache: 'no-store',
      });
      if (
        !upstream.ok ||
        !/^image\/(jpeg|png|webp|gif)(;|$)/.test(
          upstream.headers.get('content-type') || '',
        )
      )
        throw new ServiceError();
      const image = await limitedBody(
        new Request(request.url, {
          method: 'POST',
          body: upstream.body,
          duplex: 'half',
        }),
        2 * 1024 * 1024,
      );
      return new Response(image, {
        headers: {
          ...NO_STORE,
          'Content-Type': upstream.headers.get('content-type'),
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }
    const product = await quoteProduct(context, url.searchParams.get('handle'));
    if (url.searchParams.get('intent') === 'setup') {
      const settings = await reviewSettings(context, request);
      return result({
        success: true,
        csrf: sessionValues(context).csrf,
        settings,
      });
    }
    const page = Number(url.searchParams.get('page') || '1');
    const rating = url.searchParams.get('rating') || '';
    if (
      !Number.isInteger(page) ||
      page < 1 ||
      page > 10000 ||
      (rating && !/^[1-5]$/.test(rating))
    )
      throw new ServiceError('invalid', 400);
    const data = await readProductReviews(
      context,
      request,
      product.id,
      page,
      rating,
    );
    return result(data, data.status === 'ready' ? 200 : 503);
  });
}

export async function reviewsAction({request, context}) {
  return businessResponse(async () => {
    if (request.method !== 'POST')
      return result({success: false, code: 'invalid'}, 405);
    guard(request, context);
    if (!request.headers.get('content-type')?.startsWith('multipart/form-data'))
      throw new ServiceError('invalid', 415);
    const body = await limitedBody(request, 2 * 1024 * 1024 + 65536);
    const form = await new Response(body, {
      headers: {'Content-Type': request.headers.get('content-type')},
    }).formData();
    const product = await quoteProduct(context, form.get('productHandle'));
    if (numericId(product.id) !== numericId(form.get('productId')))
      throw new ServiceError('invalid', 400);
    if (form.get('intent') === 'media') {
      const settings = await reviewSettings(context, request);
      if (!settings.allowPhotos) throw new ServiceError('media', 400);
      const file = form.get('file');
      if (
        !file ||
        typeof file === 'string' ||
        !/^image\/(jpeg|png|webp|gif)$/.test(file.type) ||
        file.size > 2 * 1024 * 1024 ||
        !file.size
      )
        throw new ServiceError('media', 400);
      const outgoing = new FormData();
      outgoing.set('file', file);
      outgoing.set('type', 'image');
      const tempId = form.get('tempId');
      if (tempId && /^[A-Za-z0-9_-]{1,64}$/.test(tempId))
        outgoing.set('tempId', tempId);
      const {data} = await callBusinessApi(
        context,
        request,
        'reviews',
        `/media-upload?productId=${encodeURIComponent(product.id)}`,
        {body: outgoing, timeout: 15000},
      );
      if (!safeMediaUrl(data.file?.url) || data.file.type !== 'image')
        throw new ServiceError();
      const token = await seal(context, {
        url: data.file.url,
        productId: product.id,
        visitor: context.session.get('businessVisitor'),
        scope: 'upload',
      });
      return result({success: true, token, tempId: data.file.tempId});
    }
    const settings = await reviewSettings(context, request);
    const rating = String(form.get('rating') || '');
    const email = String(form.get('email') || '').trim();
    if (
      !/^[1-5]$/.test(rating) ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    )
      throw new ServiceError('invalid', 400);
    const outgoing = new FormData();
    outgoing.set('productId', product.id);
    outgoing.set('rating', rating);
    outgoing.set('email', email);
    for (const [name, required, max] of [
      ['nickname', settings.requireName, 150],
      ['title', settings.requireTitle, 300],
      ['content', settings.requireFeedback, 16000],
    ]) {
      const value = String(form.get(name) || '').trim();
      if ((required && !value) || value.length > max)
        throw new ServiceError('invalid', 400);
      outgoing.set(name, value);
    }
    const tokens = form.getAll('mediaToken');
    if ((!settings.allowPhotos && tokens.length) || tokens.length > 6)
      throw new ServiceError('media', 400);
    for (const token of tokens) {
      const media = await unseal(context, token);
      if (
        media.scope !== 'upload' ||
        media.productId !== product.id ||
        media.visitor !== context.session.get('businessVisitor')
      )
        throw new ServiceError('forbidden', 403);
      outgoing.append('mediaUrls[]', media.url);
      outgoing.append('mediaTypes[]', 'image');
      outgoing.append('mediaThumbnails[]', '');
    }
    const {data, status} = await callBusinessApi(
      context,
      request,
      'reviews',
      '/reviews',
      {body: outgoing, timeout: 12000},
    );
    if (!data.success) throw new ServiceError('uncertain');
    return result({success: true}, status);
  });
}
