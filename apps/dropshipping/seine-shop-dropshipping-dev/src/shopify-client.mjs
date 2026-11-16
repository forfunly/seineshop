import '@shopify/shopify-api/adapters/node';
import {shopifyApi, ApiVersion, Session, LogSeverity} from '@shopify/shopify-api';
import {ImportError, SOURCE_SHOP, TEST_SHOP} from './catalog-plan.mjs';

export function createDevelopmentClients(env) {
  if (!/^[a-f0-9]{32}$/.test(env.DROPSHIP_APP_CLIENT_ID || '') || !env.DROPSHIP_APP_CLIENT_SECRET || !env.PRIVATE_STOREFRONT_API_TOKEN ||
    env.PUBLIC_STORE_DOMAIN !== SOURCE_SHOP) throw new ImportError('unconfigured');
  const shopify = shopifyApi({
    apiKey: env.DROPSHIP_APP_CLIENT_ID, apiSecretKey: env.DROPSHIP_APP_CLIENT_SECRET,
    apiVersion: ApiVersion.April26, hostName: 'localhost:3000', isEmbeddedApp: false,
    scopes: ['read_products', 'write_products', 'read_metaobjects', 'write_metaobjects', 'read_metaobject_definitions'],
    logger: {level: LogSeverity.Error, log: () => {}},
  });
  const source = new shopify.clients.Storefront({session: new Session({
    // The official server SDK sends Shopify-Storefront-Private-Token, so use the existing server token.
    id: 'public-catalog', shop: SOURCE_SHOP, state: '', isOnline: false, accessToken: env.PRIVATE_STOREFRONT_API_TOKEN,
  })});
  let session;
  return {
    async source(query, variables) {
      try {
        const result = await source.request(query, {variables, retries: 0});
        if (result.errors || !result.data) throw new Error();
        return result.data;
      } catch {throw new ImportError('source-unavailable');}
    },
    async admin(query, variables = {}) {
      try {
        // This grant is only for our own development shop. It is not customer-shop OAuth.
        if (!session || !session.expires || session.expires.getTime() - Date.now() < 60000) {
          ({session} = await shopify.auth.clientCredentials({shop: TEST_SHOP}));
          const granted = new Set((session.scope || '').split(','));
          // Shopify may omit redundant read scopes when the corresponding write scope is granted.
          if (!['write_products', 'write_metaobjects', 'read_metaobject_definitions'].every((scope) => granted.has(scope)))
            throw new ImportError('missing-scopes');
        }
        const client = new shopify.clients.Graphql({session});
        const result = await client.request(query, {variables, retries: 0});
        if (result.errors || !result.data) throw new Error();
        return result.data;
      } catch (error) {
        if (error instanceof ImportError) throw error;
        throw new ImportError('target-unavailable');
      }
    },
  };
}
