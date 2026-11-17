import {paidWebhook, privateEndpointLoader} from '~/lib/ga4-endpoints.server';

export const loader = privateEndpointLoader;
export function action({request, context}) {
  return paidWebhook(request, context.env);
}
