import {checkoutReceipt, privateEndpointLoader} from '~/lib/ga4-endpoints.server';

export const loader = privateEndpointLoader;
export function action({request, context}) {
  return checkoutReceipt(request, context.env);
}
