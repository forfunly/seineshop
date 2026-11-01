import {data, redirectDocument} from 'react-router';
import {createBuyNowCheckout} from '~/lib/checkout.server';
import {localeFromPath} from '~/lib/locale';

export async function action({request, context}) {
  const result = await createBuyNowCheckout(await request.formData(), context.cart);
  const headers = {'Cache-Control': 'private, no-store'};
  if (!result.checkoutUrl) return data(result, {status: 422, headers});
  const url = new URL(result.checkoutUrl);
  url.searchParams.set('locale', localeFromPath(new URL(request.url).pathname).code);
  return redirectDocument(url.href, {status: 303, headers});
}

export function loader() {
  return new Response('Method not allowed', {status: 405, headers: {Allow: 'POST', 'Cache-Control': 'no-store'}});
}
