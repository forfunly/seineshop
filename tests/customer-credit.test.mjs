import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadCustomerCredit} from '../app/lib/customer-credit.server.js';

const client = (query) => ({i18n: {language: 'EN'}, query});
test('store credit keeps real balances and loads all account pages', async () => {
  const calls = [];
  const result = await loadCustomerCredit(client(async (_query, {variables}) => {
    calls.push(variables.after);
    return {data: {customer: {storeCreditAccounts: {nodes: [{id: variables.after || 'one', balance: {amount: '2.00', currencyCode: variables.after ? 'EUR' : 'USD'}}], pageInfo: {hasNextPage: !variables.after, endCursor: 'two'}}}}};
  }));
  assert.deepEqual(calls, [null, 'two']);
  assert.equal(result.unavailable, false);
  assert.deepEqual(result.accounts.map(({balance}) => balance.currencyCode), ['USD', 'EUR']);
});
test('permission and incomplete responses never look like an empty balance', async () => {
  for (const response of [{errors: [{message: 'Access denied'}]}, {data: {customer: null}}]) {
    assert.equal((await loadCustomerCredit(client(async () => response))).unavailable, true);
  }
  const empty = await loadCustomerCredit(client(async () => ({data: {customer: {storeCreditAccounts: {nodes: [], pageInfo: {hasNextPage: false}}}}})));
  assert.deepEqual(empty, {accounts: [], unavailable: false});
});
test('account login redirects are preserved', async () => {
  const redirect = new Response(null, {status: 302, headers: {Location: '/account/login'}});
  await assert.rejects(loadCustomerCredit(client(async () => {throw redirect;})), (error) => error === redirect);
});
