import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createBuyNowCheckout} from '../app/lib/checkout.server.js';

function form(quantity = '2', variant = 'gid://shopify/ProductVariant/50063404695811') {
  const values = new FormData();
  values.set('quantity', quantity);
  values.set('merchandiseId', variant);
  return values;
}

test('buy now sends only the selected variant and quantity, with no client pricing or cart replacement', async () => {
  const values = form();
  values.set('price', '0.01');
  values.set('checkoutUrl', 'https://example.com');
  let calls = 0;
  const result = await createBuyNowCheckout(values, {
    create: async (input) => {
      calls++;
      assert.deepEqual(input, {lines: [{merchandiseId: values.get('merchandiseId'), quantity: 2}]});
      return {cart: {checkoutUrl: 'https://ps83if-c4.myshopify.com/checkouts/test'}};
    },
    setCartId: () => assert.fail('Must preserve the existing cart cookie'),
  });
  assert.equal(calls, 1);
  assert.equal(result.checkoutUrl, 'https://ps83if-c4.myshopify.com/checkouts/test');
});

test('rejects malformed variants and invalid quantities before calling Shopify', async () => {
  const cart = {create: () => assert.fail('Invalid input must not call Shopify')};
  for (const quantity of ['0', '-1', '1.5', '10000', '', 'NaN']) {
    assert.ok((await createBuyNowCheckout(form(quantity), cart)).errors.length);
  }
  assert.ok((await createBuyNowCheckout(form('1', 'not-a-variant'), cart)).errors.length);
});

test('does not redirect on inventory errors or quantity adjustment warnings', async () => {
  for (const kind of ['errors', 'warnings']) {
    const result = await createBuyNowCheckout(form(), {create: async () => ({
      cart: {checkoutUrl: 'https://ps83if-c4.myshopify.com/checkouts/test'},
      [kind]: [{message: 'Not enough stock'}],
    })});
    assert.equal(result.checkoutUrl, undefined);
    assert.equal(result.errors[0].message, 'Not enough stock');
  }
});

test('missing checkout, unsafe URL and network failure produce a recoverable error', async () => {
  for (const checkoutUrl of [undefined, 'http://example.com', 'javascript:alert(1)']) {
    assert.ok((await createBuyNowCheckout(form(), {create: async () => ({cart: {checkoutUrl}})})).errors.length);
  }
  const result = await createBuyNowCheckout(form(), {create: async () => {throw new Error('secret server error');}});
  assert.ok(result.errors.length);
  assert.ok(!JSON.stringify(result).includes('secret server error'));
});
