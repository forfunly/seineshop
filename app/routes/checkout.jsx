import {data, redirectDocument} from 'react-router';
import {createBuyNowCheckout, createSavedCartCheckout} from '~/lib/checkout.server';
import {localeFromPath} from '~/lib/locale';

export async function action({request, context}) {
  const headers = {'Cache-Control': 'private, no-store'};
  if (request.headers.get('Origin') !== new URL(request.url).origin) {
    return data({errors: [{message: 'Checkout is temporarily unavailable. Please try again or use your cart.'}]}, {status: 403, headers});
  }
  const formData = await request.formData();
  const result = formData.get('intent') === 'cart'
    ? await createSavedCartCheckout(formData, context.cart)
    : await createBuyNowCheckout(formData, context.cart);
  if (!result.checkoutUrl) return data(result, {status: 422, headers});
  const url = new URL(result.checkoutUrl);
  url.searchParams.set('locale', localeFromPath(new URL(request.url).pathname).code);
  return redirectDocument(url.href, {status: 303, headers});
}

export function loader() {
  return new Response('Method not allowed', {status: 405, headers: {Allow: 'POST', 'Cache-Control': 'no-store'}});
}
