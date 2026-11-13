import test from 'node:test';
import assert from 'node:assert/strict';
import {
  productRating,
  reviewSchema,
  validateInquiry,
  quoteFields,
  fieldKind,
} from '../app/lib/business-tools.js';
import {
  inquiryLoader,
  inquiryAction,
  reviewsLoader,
  reviewsAction,
  readProductReviews,
  limitedBody,
  businessResponse,
  callBusinessApi,
} from '../app/lib/business-tools.server.js';

const product = {
  id: 'gid://shopify/Product/123',
  handle: 'test-product',
  title: 'Product',
  variants: {
    nodes: [
      {id: 'gid://shopify/ProductVariant/456', title: 'Blue', sku: 'BLUE'},
    ],
    pageInfo: {hasNextPage: false},
  },
};
const fields = [
  {id: 'company', label: 'Company Name', fieldType: 'text', required: true},
  {
    id: 'use',
    label: 'Intended use',
    fieldType: 'select',
    options: ['Retail', 'Gift'],
    required: true,
  },
];
function context() {
  const values = new Map([
    ['businessVisitor', crypto.randomUUID()],
    ['businessCsrf', 'csrf-test'],
  ]);
  return {
    env: {
      SECTIONLY_B2B_PRIVATE_KEY: 'sb2b_sk_test',
      CUSTOMERSSAY_SECRET_KEY: 'sk_live_test',
      SESSION_SECRET: 'test-signing-key-only',
    },
    session: {get: (k) => values.get(k), set: (k, v) => values.set(k, v)},
    storefront: {
      CacheNone: () => ({}),
      query: async (query) =>
        query.includes('BusinessVariantOwners')
          ? {
              nodes: [
                {
                  id: 'gid://shopify/ProductVariant/456',
                  product: {id: product.id},
                },
              ],
            }
          : {product},
    },
  };
}
const config = {moq: 10, fields: quoteFields(fields)};
const payload = () => ({
  customerName: 'Example Buyer',
  customerEmail: 'buyer@example.com',
  productId: product.id,
  productHandle: product.handle,
  lineItems: [{variantId: 'gid://shopify/ProductVariant/456', quantity: 10}],
  customFields: {'Company Name': 'Example', 'Intended use': 'Retail'},
  note: 'Wholesale',
});
const request = (path, body, headers = {}) =>
  new Request(`http://localhost:3000/api/${path}`, {
    method: 'POST',
    headers: {
      Origin: 'http://localhost:3000',
      'X-Seine-CSRF': 'csrf-test',
      ...(!(body instanceof FormData)
        ? {'Content-Type': 'application/json'}
        : {}),
      ...headers,
    },
    body: body instanceof FormData ? body : JSON.stringify(body),
  });
const json = (data, status = 200, headers = {}) =>
  Response.json(data, {status, headers});
function mockConfig(url) {
  if (url.includes('/form-config')) return json({fields, defaultMoq: 10});
  if (url.includes('/b2b-products'))
    return json({b2bHandles: [product.handle], decisions: {}});
  if (url.includes('/widget-settings'))
    return json({
      settings: {
        formConfig: {
          allowPhotos: true,
          requireName: true,
          requireTitle: true,
          requireFeedback: true,
        },
      },
    });
  throw new Error('Unexpected endpoint');
}
function reviewForm() {
  const form = new FormData();
  for (const [key, value] of Object.entries({
    productId: product.id,
    productHandle: product.handle,
    rating: '5',
    email: 'buyer@example.com',
    nickname: 'Example Buyer',
    title: 'Test',
    content: 'Test content',
  }))
    form.set(key, value);
  return form;
}

test('ratings distinguish missing, zero and real summaries, without invented schema', () => {
  assert.equal(productRating({}), null);
  assert.deepEqual(productRating({ratingCount: {value: '0'}}), {
    total_reviews: 0,
    average_rating: 0,
  });
  assert.deepEqual(
    productRating({
      rating: {value: '{"value":"4.5"}'},
      ratingCount: {value: '12'},
    }),
    {total_reviews: 12, average_rating: 4.5},
  );
  assert.equal(productRating({reviewsSummary: {value: '{broken'}}), null);
  assert.deepEqual(reviewSchema({status: 'unavailable'}), {});
  assert.deepEqual(
    reviewSchema({
      status: 'ready',
      summary: {total_reviews: 0, average_rating: 0},
    }),
    {},
  );
  assert.equal(
    reviewSchema({
      status: 'ready',
      summary: {total_reviews: 12, average_rating: 4.5},
      reviews: [],
    }).aggregateRating.reviewCount,
    12,
  );
});

test('inquiry validation enforces configured fields, MOQ, unique variants and integer limits', () => {
  assert.equal(fieldKind({label: 'Contact phone', id: 'phone'}), null);
  assert.equal(fieldKind({label: 'Your name', id: 'buyer'}), 'name');
  assert.equal(validateInquiry(payload(), config), null);
  const p = payload();
  p.lineItems[0].quantity = 9;
  assert.equal(validateInquiry(p, config), 'moq');
  p.lineItems[0].quantity = 1.5;
  assert.equal(validateInquiry(p, config), 'invalid');
  p.lineItems[0].quantity = 2147483648;
  assert.equal(validateInquiry(p, config), 'invalid');
  p.lineItems[0].quantity = 10;
  p.lineItems.push({...p.lineItems[0]});
  assert.equal(validateInquiry(p, config), 'invalid');
  const q = payload();
  q.customFields['Intended use'] = 'Unknown';
  assert.equal(validateInquiry(q, config), 'invalid');
  q.customFields['Intended use'] = '';
  assert.equal(validateInquiry(q, config), 'invalid');
  assert.throws(() => quoteFields([{label: 'Upload', fieldType: 'file'}]));
});

test('setup reads real app configuration and product membership, with private no-store response', async (t) => {
  const seen = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    seen.push([url, options]);
    return mockConfig(url);
  });
  const res = await inquiryLoader({
    request: new Request(
      'http://localhost:3000/api/business-inquiry?handle=test-product',
    ),
    context: context(),
  });
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.config.moq, 10);
  assert.equal(data.config.listedForB2b, true);
  assert.ok(res.headers.get('Cache-Control').includes('no-store'));
  assert.equal(seen.length, 2);
  assert.ok(seen.every(([, o]) => !o.headers.has('Origin')));
  assert.ok(seen.every(([, o]) => o.headers.get('X-Sectionly-Visitor')));
});

test('cross-site and missing-CSRF submissions fail before calling the app', async (t) => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => {
    calls++;
    throw new Error();
  });
  for (const headers of [
    {Origin: 'https://attacker.example'},
    {'X-Seine-CSRF': ''},
  ]) {
    const res = await inquiryAction({
      request: request(
        'business-inquiry',
        {operationId: crypto.randomUUID(), payload: payload()},
        headers,
      ),
      context: context(),
    });
    assert.equal(res.status, 403);
    assert.equal((await res.json()).code, 'forbidden');
  }
  assert.equal(calls, 0);
});

test('server checks variant ownership and does not relay client prices or titles', async (t) => {
  let outgoing;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    if (!url.endsWith('/inquiry')) return mockConfig(url);
    outgoing = JSON.parse(options.body);
    return json({success: true, inquiryId: 'test-inquiry'}, 201);
  });
  const ctx = context();
  const p = {...payload(), price: 0, productTitle: 'Spoofed'};
  let res = await inquiryAction({
    request: request('business-inquiry', {
      operationId: crypto.randomUUID(),
      payload: p,
    }),
    context: ctx,
  });
  assert.equal(res.status, 201);
  assert.equal(outgoing.price, undefined);
  assert.equal(outgoing.productTitle, undefined);
  outgoing = null;
  ctx.storefront.query = async (query) =>
    query.includes('BusinessVariantOwners')
      ? {nodes: [{product: {id: 'gid://shopify/Product/999'}}]}
      : {product};
  res = await inquiryAction({
    request: request('business-inquiry', {
      operationId: crypto.randomUUID(),
      payload: p,
    }),
    context: ctx,
  });
  assert.equal(res.status, 400);
  assert.equal(outgoing, null);
});

test('uncertain inquiry retries retain exactly the same upstream body and idempotency key', async (t) => {
  const writes = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    if (!url.endsWith('/inquiry')) return mockConfig(url);
    writes.push({
      key: options.headers.get('Idempotency-Key'),
      body: options.body,
    });
    return writes.length === 1
      ? json({error: 'private diagnostics'}, 503)
      : json({success: true, inquiryId: 'same-id'}, 201);
  });
  const ctx = context();
  const input = {operationId: crypto.randomUUID(), payload: payload()};
  const first = await inquiryAction({
    request: request('business-inquiry', input),
    context: ctx,
  });
  assert.equal((await first.json()).code, 'uncertain');
  const second = await inquiryAction({
    request: request('business-inquiry', input),
    context: ctx,
  });
  assert.equal((await second.json()).inquiryId, 'same-id');
  assert.deepEqual(writes[0], writes[1]);
});

test('streamed bodies cannot bypass size limits using absent Content-Length', async () => {
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(10));
      controller.enqueue(new Uint8Array(10));
      controller.close();
    },
  });
  const res = await businessResponse(async () => {
    await limitedBody(
      new Request('http://localhost', {method: 'POST', body, duplex: 'half'}),
      15,
    );
    return json({});
  });
  assert.equal(res.status, 413);
  assert.equal((await res.json()).code, 'invalid');
});

test('app errors never reveal credentials or upstream error details and preserve Retry-After', async (t) => {
  t.mock.method(globalThis, 'fetch', async () =>
    json({error: 'private upstream information'}, 429, {'Retry-After': '30'}),
  );
  const res = await businessResponse(async () => {
    await callBusinessApi(
      context(),
      new Request('http://localhost'),
      'reviews',
      '/reviews',
    );
    return json({});
  });
  assert.equal(res.status, 429);
  assert.equal(res.headers.get('Retry-After'), '30');
  assert.deepEqual(await res.json(), {success: false, code: 'limited'});
});

test('public reviews omit emails, customer IDs and reactions, and reject malformed dates', async (t) => {
  t.mock.method(globalThis, 'fetch', async () =>
    json({
      summary: {average_rating: 5, total_reviews: 1},
      reviews: [
        {
          id: '1',
          rating: 5,
          user: {
            nickname: 'Example',
            email: 'private@example.com',
            customerId: 'private',
          },
          content: 'Test only',
          created_at: '2026-99-99',
          userReaction: 'private',
          media: [{url: 'https://127.0.0.1/file.png', type: 'image'}],
        },
      ],
      pagination: {hasNextPage: false},
    }),
  );
  const data = await readProductReviews(
    context(),
    new Request('http://localhost'),
    product.id,
  );
  assert.equal(data.status, 'ready');
  assert.equal(data.reviews[0].date, null);
  assert.deepEqual(data.reviews[0].media, []);
  assert.ok(!JSON.stringify(data).includes('private'));
});

test('missing credentials and app outage are not represented as zero reviews', async (t) => {
  const ctx = context();
  ctx.env.CUSTOMERSSAY_SECRET_KEY = '';
  const missing = await readProductReviews(
    ctx,
    new Request('http://localhost'),
    product.id,
  );
  assert.equal(missing.status, 'unconfigured');
  assert.equal(missing.summary, null);
  t.mock.method(globalThis, 'fetch', async () => {
    throw new Error('network');
  });
  const unavailable = await readProductReviews(
    context(),
    new Request('http://localhost'),
    product.id,
  );
  assert.equal(unavailable.status, 'unavailable');
  assert.equal(unavailable.summary, null);
});

test('review required fields come from the app and unknown write outcomes stay uncertain', async (t) => {
  let writes = 0;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    if (!url.endsWith('/reviews')) return mockConfig(url);
    writes++;
    assert.equal(options.body.get('customerId'), null);
    assert.equal(options.body.get('verified'), null);
    return json({error: 'unexpected failure'}, 503);
  });
  const ctx = context();
  const invalid = reviewForm();
  invalid.delete('title');
  const rejected = await reviewsAction({
    request: request('product-reviews', invalid),
    context: ctx,
  });
  assert.equal(rejected.status, 400);
  assert.equal(writes, 0);
  const res = await reviewsAction({
    request: request('product-reviews', reviewForm()),
    context: ctx,
  });
  assert.equal((await res.json()).code, 'uncertain');
  assert.equal(writes, 1);
});

test('signed upload tokens bind images to the same visitor and product using the official FormData contract', async (t) => {
  let outgoing;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    if (url.includes('/media-upload?')) {
      assert.equal(options.body.get('type'), 'image');
      return json({
        success: true,
        file: {
          url: 'https://app-next.customerssay.ai/test.png',
          type: 'image',
          tempId: 'test-temp',
        },
      });
    }
    if (url.endsWith('/reviews')) {
      outgoing = options.body;
      return json({success: true}, 201);
    }
    return mockConfig(url);
  });
  const ctx = context();
  const media = reviewForm();
  media.set('intent', 'media');
  media.set('file', new Blob(['image'], {type: 'image/png'}), 'test.png');
  const uploaded = await reviewsAction({
    request: request('product-reviews', media),
    context: ctx,
  });
  const {token} = await uploaded.json();
  assert.ok(token);
  const form = reviewForm();
  form.append('mediaToken', token);
  let res = await reviewsAction({
    request: request('product-reviews', form),
    context: ctx,
  });
  assert.equal(res.status, 201);
  assert.equal(
    outgoing.get('mediaUrls[]'),
    'https://app-next.customerssay.ai/test.png',
  );
  assert.equal(outgoing.get('mediaTypes[]'), 'image');
  assert.equal(outgoing.get('mediaThumbnails[]'), '');
  res = await reviewsAction({
    request: request('product-reviews', form),
    context: context(),
  });
  assert.equal(res.status, 403);
  const bad = new Request(
    `http://localhost:3000/api/product-reviews?intent=image&token=${encodeURIComponent(token)}`,
  );
  assert.equal((await reviewsLoader({request: bad, context: ctx})).status, 403);
});

test('photo permission is enforced on the server before media upload', async (t) => {
  let writes = 0;
  t.mock.method(globalThis, 'fetch', async (url) => {
    if (url.includes('/media-upload')) writes++;
    return json({settings: {formConfig: {allowPhotos: false}}});
  });
  const form = reviewForm();
  form.set('intent', 'media');
  form.set('file', new Blob(['image'], {type: 'image/png'}), 'test.png');
  const res = await reviewsAction({
    request: request('product-reviews', form),
    context: context(),
  });
  assert.equal(res.status, 400);
  assert.equal(writes, 0);
});

test('server requests never follow a redirect carrying the private credential', async (t) => {
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    assert.equal(options.redirect, 'manual');
    return new Response(null, {
      status: 302,
      headers: {Location: 'https://attacker.example'},
    });
  });
  const res = await businessResponse(async () => {
    await callBusinessApi(
      context(),
      new Request('http://localhost'),
      'reviews',
      '/reviews',
    );
    return json({});
  });
  assert.equal(res.status, 503);
});
