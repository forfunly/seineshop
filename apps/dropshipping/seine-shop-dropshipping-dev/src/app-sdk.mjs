import '@shopify/shopify-api/adapters/node';
import {shopifyApi, ApiVersion, Session, LogSeverity} from '@shopify/shopify-api';
import {ImportError} from './catalog-plan.mjs';

export const APP_SCOPES = ['read_products', 'write_products', 'read_metaobjects', 'write_metaobjects', 'read_metaobject_definitions'];
export function createAppSdk(env, origin = 'http://localhost:3460') {
  if (!/^[a-f0-9]{32}$/.test(env.DROPSHIP_APP_CLIENT_ID || '') || !env.DROPSHIP_APP_CLIENT_SECRET) throw new ImportError('unconfigured');
  const url = new URL(origin);
  return shopifyApi({apiKey: env.DROPSHIP_APP_CLIENT_ID, apiSecretKey: env.DROPSHIP_APP_CLIENT_SECRET,
    apiVersion: ApiVersion.April26, hostName: url.host, hostScheme: url.protocol === 'https:' ? 'https' : 'http', isEmbeddedApp: false,
    scopes: APP_SCOPES, logger: {level: LogSeverity.Error, log: () => {}}});
}
export function restoreSession(value) {
  return new Session({...value, ...(value.expires ? {expires: new Date(value.expires)} : {}),
    ...(value.refreshTokenExpires ? {refreshTokenExpires: new Date(value.refreshTokenExpires)} : {})});
}
export function sessionAdmin(sdk, session) {
  return async (query, variables = {}) => {
    try {
      const result = await new sdk.clients.Graphql({session}).request(query, {variables, retries: 0});
      if (result.errors || !result.data) throw new Error();
      return result.data;
    } catch {throw new ImportError('target-unavailable');}
  };
}
