import {test} from 'node:test';
import assert from 'node:assert/strict';
import {customerProfileAction} from '../app/lib/customer-profile.server.js';

const original = {id: 'gid://shopify/Customer/1', firstName: 'Old', lastName: 'Name',
  emailAddress: {emailAddress: 'qa@example.com', marketingState: 'NOT_SUBSCRIBED'}};
function setup(intent = 'profile', extras = {}) {
  const customer = structuredClone(original);
  const calls = [];
  const form = new FormData();
  form.set('intent', intent); form.set('firstName', ' 李 '); form.set('lastName', '');
  // These must never determine the target customer or change marketing implicitly.
  form.set('customerId', 'another-customer'); form.set('email', 'other@example.com'); form.set('acceptsMarketing', 'true');
  const request = new Request('https://www.seineshop.com/account/profile', {
    method: 'POST', headers: {Origin: 'https://www.seineshop.com'}, body: form});
  const customerAccount = {
    i18n: {language: 'EN'}, isLoggedIn: async () => true,
    query: async () => {calls.push('read'); return {data: {customer: structuredClone(customer)}};},
    mutate: async (query, options) => {
      calls.push({query, options});
      if (query.includes('CustomerMarketingSubscribe')) {
        customer.emailAddress.marketingState = 'SUBSCRIBED';
        return {data: {customerEmailMarketingSubscribe: {emailAddress: customer.emailAddress, userErrors: []}}};
      }
      if (query.includes('CustomerMarketingUnsubscribe')) {
        customer.emailAddress.marketingState = 'UNSUBSCRIBED';
        return {data: {customerEmailMarketingUnsubscribe: {emailAddress: customer.emailAddress, userErrors: []}}};
      }
      Object.assign(customer, options.variables.customer);
      return {data: {customerUpdate: {customer, userErrors: []}}};
    }, ...extras,
  };
  return {request, context: {customerAccount}, calls, customer, form};
}

test('name update uses session identity, permits a one-character name/clear, verifies readback and never subscribes', async () => {
  const fixture = setup();
  const response = await customerProfileAction(fixture);
  const body = await response.json();
  assert.equal(body.success, true);
  assert.equal(body.customer.firstName, '李'); assert.equal(body.customer.lastName, '');
  assert.equal(body.customer.emailAddress.marketingState, 'NOT_SUBSCRIBED');
  assert.deepEqual(fixture.calls[1].options.variables.customer, {firstName: '李', lastName: ''});
  assert.equal(fixture.calls.filter((v) => v === 'read').length, 2);
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
});

test('subscribe and unsubscribe change only the current customer, including pending confirmation', async () => {
  for (const intent of ['subscribe', 'unsubscribe']) {
    const f = setup(intent); f.customer.emailAddress.marketingState = intent === 'subscribe' ? 'UNSUBSCRIBED' : 'PENDING';
    const response = await customerProfileAction(f); const body = await response.json();
    assert.equal(body.success, true);
    assert.equal(body.customer.emailAddress.marketingState, intent === 'subscribe' ? 'SUBSCRIBED' : 'UNSUBSCRIBED');
    assert.deepEqual(f.calls[1].options, {});
    assert.equal(body.customer.firstName, 'Old');
  }
  const f = setup('subscribe', {mutate: async () => {
    f.customer.emailAddress.marketingState = 'PENDING';
    return {data: {customerEmailMarketingSubscribe: {emailAddress: f.customer.emailAddress, userErrors: []}}};
  }});
  const body = await (await customerProfileAction(f)).json();
  assert.equal(body.success, true); assert.match(body.message, /awaiting/);
});

test('replayed settings with matching current state do not repeat the mutation', async () => {
  for (const [intent, state] of [['subscribe', 'SUBSCRIBED'], ['subscribe', 'PENDING'], ['unsubscribe', 'NOT_SUBSCRIBED'], ['unsubscribe', 'UNSUBSCRIBED']]) {
    const f = setup(intent); f.customer.emailAddress.marketingState = state;
    assert.equal((await (await customerProfileAction(f)).json()).success, true);
    assert.deepEqual(f.calls, ['read', 'read']);
  }
});

test('unauthenticated and cross-site requests cannot query or modify private data', async () => {
  const f = setup('subscribe', {isLoggedIn: async () => false});
  assert.equal((await customerProfileAction(f)).status, 401); assert.equal(f.calls.length, 0);
  for (const origin of ['https://evil.example', 'null', '']) {
    const f = setup(); f.request = new Request(f.request, {headers: {Origin: origin}});
    assert.equal((await customerProfileAction(f)).status, 403); assert.equal(f.calls.length, 0);
  }
});

test('invalid input and inaccessible states fail without a write', async () => {
  for (const state of ['REDACTED', 'INVALID', 'UNKNOWN', undefined]) {
    const f = setup('subscribe'); f.customer.emailAddress.marketingState = state;
    assert.equal((await customerProfileAction(f)).status, 409); assert.deepEqual(f.calls, ['read']);
  }
  for (const value of ['x'.repeat(256), 'a\nInjected']) {
    const f = setup(); f.form.set('firstName', value);
    f.request = new Request(f.request.url, {method: 'POST', headers: {Origin: 'https://www.seineshop.com'}, body: f.form});
    assert.equal((await customerProfileAction(f)).status, 400); assert.equal(f.calls.length, 0);
  }
});

test('business errors, graph errors, lost responses and mismatched readback never claim success or expose details', async () => {
  for (const mode of ['business', 'graphql', 'throw', 'mismatch', 'read-failure', 'wrong-customer']) {
    const f = setup(); let reads = 0;
    f.context.customerAccount.mutate = async () => {
      if (mode === 'throw') throw Error('secret token');
      return mode === 'graphql' ? {errors: [{message: 'secret token'}]} :
        {data: {customerUpdate: {customer: f.customer, userErrors: mode === 'business' ? [{message: 'secret token'}] : []}}};
    };
    f.context.customerAccount.query = async () => {
      reads++;
      if (reads === 2 && mode === 'read-failure') throw Error('secret token');
      return {data: {customer: {...f.customer, ...(reads === 2 && mode === 'wrong-customer' ? {id: 'wrong'} : {})}}};
    };
    const response = await customerProfileAction(f); const body = await response.json();
    assert.ok(response.status >= 400); assert.equal(body.success, false);
    assert.ok(!JSON.stringify(body).includes('secret'));
  }
});
