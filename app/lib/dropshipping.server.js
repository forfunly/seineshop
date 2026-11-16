import {businessSessionValues, guardBusinessRequest, limitedBody, ServiceError} from './business-tools.server.js';
import {DropshipError, PRIVATE_HEADERS, serviceOrigin, signedHeaders, validTenant} from './dropshipping-transport.server.js';
import {DROPSHIP_CUSTOMER_QUERY} from '../graphql/customer-account/DropshipCustomerQuery.js';

export async function dropshipCustomer(context) {
  if (!await context.customerAccount.isLoggedIn()) return null;
  const result = await context.customerAccount.query(DROPSHIP_CUSTOMER_QUERY);
  if (result.errors?.length || !validTenant(result.data?.customer?.id)) throw new DropshipError('unauthorized', 401);
  return result.data.customer.id;
}
async function callService(context, request, tenant, input) {
  const origin = serviceOrigin(context.env.DROPSHIP_SERVICE_URL, request.url, {development: import.meta.env?.DEV === true});
  const pathname = '/internal/merchant', body = JSON.stringify(input);
  const headers = await signedHeaders(context.env.DROPSHIP_TOKEN_ENCRYPTION_KEY, tenant, 'POST', pathname, body);
  try {
    const response = await fetch(origin + pathname, {method: 'POST', headers, body, redirect: 'manual', signal: AbortSignal.timeout(input.action === 'import' ? 90000 : 20000)});
    if (response.status >= 300 && response.status < 400) throw new DropshipError('unavailable');
    const result = await response.json();
    if (!response.ok || !result.success) throw new DropshipError(/^[a-z-]{1,60}$/.test(result.code || '') ? result.code : 'unavailable', response.status >= 400 ? response.status : 503);
    return result;
  } catch (error) {
    if (error instanceof DropshipError) throw error;
    throw new DropshipError(input.action === 'import' ? 'uncertain' : 'unavailable');
  }
}
export async function dropshippingLoader({request, context}) {
  const {csrf} = businessSessionValues(context);
  let tenant = null, workspace = null, code = null;
  try {tenant = await dropshipCustomer(context);} catch {code = 'unauthorized';}
  if (tenant) {
    try {workspace = await callService(context, request, tenant, {action: 'workspace'});}
    catch (error) {code = error instanceof DropshipError ? error.code : 'unavailable';}
  }
  return Response.json({authenticated: !!tenant, csrf, workspace, code}, {headers: PRIVATE_HEADERS});
}
export async function dropshippingAction({request, context}) {
  try {
    guardBusinessRequest(request, context);
    if (request.headers.get('content-type')?.split(';')[0] !== 'application/json') throw new DropshipError('invalid', 415);
    const tenant = await dropshipCustomer(context);
    if (!tenant) throw new DropshipError('unauthorized', 401);
    const raw = await (await limitedBody(request, 8192)).text();
    let input;try {input = JSON.parse(raw);} catch {throw new DropshipError('invalid', 400);}
    if (!input || typeof input !== 'object' || !['connect-development', 'disconnect', 'connect', 'products', 'import'].includes(input.action)) throw new DropshipError('invalid', 400);
    // Neither tenant nor target credentials can be supplied by the browser.
    const payload = {action: input.action, connectionId: input.connectionId, handle: input.handle, shop: input.shop,
      locale: context.storefront.i18n.language === 'JA' ? 'ja' : context.storefront.i18n.language === 'DE' ? 'de' : 'en'};
    return Response.json(await callService(context, request, tenant, payload), {headers: PRIVATE_HEADERS});
  } catch (error) {
    const known = error instanceof DropshipError || error instanceof ServiceError;
    return Response.json({success: false, code: known ? error.code : 'unavailable'},
      {status: known ? error.status : 503, headers: {...PRIVATE_HEADERS, ...(error.retryAfter ? {'Retry-After': error.retryAfter} : {})}});
  }
}
