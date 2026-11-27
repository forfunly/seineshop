import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateContact, validContactEmail} from '../app/lib/contact.js';
import {contactBootstrap, submitContact} from '../app/lib/contact.server.js';
import {readFile} from 'node:fs/promises';
const routeSource = (await readFile(new URL('../app/routes/api.contact.jsx', import.meta.url), 'utf8')).replace('../lib/contact.server.js', new URL('../app/lib/contact.server.js', import.meta.url).href);
const {loader, action} = await import(`data:text/javascript;base64,${Buffer.from(routeSource).toString('base64')}`);

const origin = 'https://www.seineshop.com';
const fields = {name: 'Internal QA', email: 'qa@example.com', topic: 'Feedback', reference: 'QA only', message: 'Internal QA — 日本語 / 中文 / Grüße\nNot a customer order.'};
function context(configured = true) {
  const values = new Map();
  return {env: configured ? {CONTACT_RESEND_API_KEY: 're_internal_qa_placeholder'} : {}, session: {get: (key) => values.get(key), set: (key, value) => values.set(key, value)}};
}
async function setup() {
  const ctx = context();
  const form = await (contactBootstrap(ctx)).json();
  return {ctx, form: {...fields, ...form}};
}
function request(values, {headers = {}, method = 'POST', url = `${origin}/api/contact`} = {}) {
  return new Request(url, {method, headers: {origin, 'Content-Type': 'application/x-www-form-urlencoded', ...headers}, ...(method === 'POST' ? {body: new URLSearchParams(values)} : {})});
}
const accepted = async () => Response.json({id: 'internal-qa-message'});

test('all storefront contact entry points use the confirmed current shop inbox', async () => {
  const paths = ['components/Header.jsx', 'components/Footer.jsx', 'components/ProductBuyingGuide.jsx', 'components/JournalArticle.jsx', 'lib/contact.server.js', 'lib/wholesale.js', 'routes/products.$handle.jsx', 'routes/_index.jsx', 'routes/policies._index.jsx', 'routes/help.$handle.jsx', 'routes/support.jsx'];
  const obsolete = ['steven', 'seineshop.com'].join('@');
  for (const path of paths) {
    const source = await readFile(new URL(`../app/${path}`, import.meta.url), 'utf8');
    assert.ok(source.includes('hello@seineshop.com'), path);
    assert.ok(!source.includes(obsolete), path);
  }
});

test('contact validates actual fields without requiring a product or an order', () => {
  assert.deepEqual(validateContact({...fields, reference: ''}).errors, {});
  for (const email of ['a\r\nBcc:other@example.com', 'a@', 'a b@example.com', '"a"@example.com', 'a@example..com']) assert.equal(validContactEmail(email), false);
  assert.equal(validContactEmail('qa+test@example.com'), true);
  for (const [key, value] of [['name', '   '], ['name', 'A\r\nB'], ['message', 'x'.repeat(1501)], ['message', 'bad\u0000value'], ['email', 'bad'], ['topic', '__proto__']]) assert.equal(validateContact({...fields, [key]: value}).errors[key], true);
});

test('contact setup is private and cannot pretend an unconfigured mail service works', async () => {
  const missing = contactBootstrap(context(false));
  assert.equal(missing.status, 503);
  assert.equal((await missing.json()).code, 'unconfigured');
  const ctx = context();
  const response = contactBootstrap(ctx);
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
  assert.equal(response.headers.get('X-Robots-Tag'), 'noindex, nofollow');
  const first = await response.json();
  const second = await contactBootstrap(ctx).json();
  assert.equal(first.csrf, second.csrf);
  assert.notEqual(first.submissionId, second.submissionId);
  assert.equal(JSON.stringify(first).includes('re_internal'), false);
});

test('contact sends plain Unicode text only to the fixed shop inbox, with visitor Reply-To', async () => {
  const {ctx, form} = await setup();
  let sent;
  const response = await submitContact(request({...form, to: 'attacker@example.com', from: 'attacker@example.com', html: '<script>bad</script>'}), ctx, {send: async (url, options) => {sent = {url, ...options}; return accepted();}});
  assert.equal(response.status, 200);
  assert.equal((await response.json()).code, 'accepted');
  assert.equal(sent.url, 'https://api.resend.com/emails');
  assert.equal(sent.redirect, 'manual');
  const body = JSON.parse(sent.body);
  assert.deepEqual(body.to, ['hello@seineshop.com']);
  assert.equal(body.from, 'Seine Shop <contact@notify.seineshop.com>');
  assert.equal(body.reply_to, fields.email);
  assert.ok(body.text.includes(fields.message));
  assert.equal(body.html, undefined);
  assert.equal(body.cc, undefined);
  assert.equal(body.bcc, undefined);
  assert.equal(sent.headers['Idempotency-Key'], `contact/${ctx.session.get('businessVisitor')}/${form.submissionId}`);
});

test('cross-site, expired CSRF, invalid IDs, honeypots and malformed payloads never call mail service', async () => {
  const {ctx, form} = await setup();
  let calls = 0;
  const send = async () => {calls++; return accepted();};
  for (const [req, status] of [
    [request(form, {headers: {origin: 'https://evil.example'}}), 403],
    [request(form, {headers: {'sec-fetch-site': 'cross-site'}}), 403],
    [request({...form, csrf: 'wrong'}), 403],
    [request({...form, submissionId: '../evil'}), 400],
    [request({...form, website: 'spam'}), 400],
    [request({...form, message: ' '}), 422],
    [request(form, {headers: {'Content-Type': 'application/json'}}), 415],
    [request({...form, message: 'x'.repeat(21000)}), 413],
    [request(form, {method: 'GET'}), 405],
  ]) {
    const response = await submitContact(req, ctx, {send});
    assert.equal(response.status, status);
    assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
    assert.equal((await response.text()).includes(fields.email), false);
  }
  const duplicate = request(form);
  const duplicateBody = `${await duplicate.text()}&email=duplicate%40example.com`;
  assert.equal((await submitContact(new Request(duplicate.url, {method: 'POST', headers: duplicate.headers, body: duplicateBody}), ctx, {send})).status, 400);
  assert.equal(calls, 0);
});

test('provider failures, redirects and timeouts are not success and do not automatically retry', async () => {
  for (const [status, code] of [[401, 'unavailable'], [422, 'unavailable'], [429, 'limited'], [409, 'conflict'], [500, 'uncertain'], [302, 'uncertain']]) {
    const {ctx, form} = await setup();
    let calls = 0;
    const response = await submitContact(request(form), ctx, {send: async () => {calls++; return new Response('private provider detail', {status});}});
    const body = await response.json();
    assert.equal(body.code, code);
    assert.equal(body.submissionId, form.submissionId);
    assert.equal(calls, 1);
    if (status === 429) assert.equal(response.headers.get('Retry-After'), '600');
    assert.equal(JSON.stringify(body).includes('private provider'), false);
  }
  for (const send of [async () => {throw new Error('sensitive error');}, async () => new Response('not json'), async () => Response.json({})]) {
    const {ctx, form} = await setup();
    assert.equal((await (await submitContact(request(form), ctx, {send})).json()).code, 'uncertain');
  }
});

test('manual retry keeps the identical provider idempotency key and body', async () => {
  const {ctx, form} = await setup();
  const calls = [];
  const send = async (_url, options) => {calls.push(options); if (calls.length === 1) throw new Error('timeout'); return accepted();};
  assert.equal((await (await submitContact(request(form), ctx, {send})).json()).code, 'uncertain');
  assert.equal((await (await submitContact(request(form), ctx, {send})).json()).code, 'accepted');
  assert.equal(calls[0].headers['Idempotency-Key'], calls[1].headers['Idempotency-Key']);
  assert.equal(calls[0].body, calls[1].body);
});

test('bounded per-worker rate protection blocks excessive sends and expires', async () => {
  const {ctx, form} = await setup();
  const now = Date.now();
  let calls = 0;
  const send = async () => {calls++; return accepted();};
  for (let i = 0; i < 5; i++) assert.equal((await submitContact(request(form), ctx, {send, now})).status, 200);
  assert.equal((await submitContact(request(form), ctx, {send, now})).status, 429);
  assert.equal(calls, 5);
  assert.equal((await submitContact(request(form), ctx, {send, now: now + 600001})).status, 200);
});

test('unconfigured POST never sends and route has no catch-all success response', async () => {
  const {ctx, form} = await setup();
  ctx.env = {};
  let called = false;
  assert.equal((await submitContact(request(form), ctx, {send: async () => {called = true; return accepted();}})).status, 503);
  assert.equal(called, false);
  assert.equal(loader({request: request(form, {method: 'HEAD'}), context: ctx}).status, 405);
  assert.equal((await action({request: request(form), context: ctx})).status, 503);
});
