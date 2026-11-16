import {createHash} from 'node:crypto';
import {DropshipError, seal, unseal, validShop, validTenant} from '../../../../app/lib/dropshipping-transport.server.js';
import {TEST_SHOP, ImportError} from './catalog-plan.mjs';
import {restoreSession, sessionAdmin} from './app-sdk.mjs';
import {importDraftProduct} from './catalog-import.mjs';

export const MAPPINGS_QUERY = `query DropshipMerchantProducts {
  metaobjects(type: "$app:product_mapping", first: 50) { nodes { id fields { key value reference { ... on Product { title } } } } pageInfo { hasNextPage } }
}`;
const digest = (value) => createHash('sha256').update(value).digest('hex');
const connectionId = (tenant, shop) => digest(`${tenant}:${shop}`);
const summary = (id, record) => ({id, shop: record.shop, status: record.status, kind: record.kind, connectedAt: record.connectedAt});

export function createMerchantService({store, clients, sdk, secret, oauthOrigin = null, returnOrigin = null, now = () => Date.now(), importer = importDraftProduct}) {
  const refreshes = new Map();
  function validate(tenant, shop) {
    if (!validTenant(tenant)) throw new DropshipError('unauthorized', 401);
    if (!validShop(shop) || shop !== TEST_SHOP) throw new DropshipError('shop-not-enabled', 403);
  }
  async function saveConnection(tenant, session, kind) {
    validate(tenant, session.shop);
    const id = connectionId(tenant, session.shop);
    const scope = new Set((session.scope || '').split(','));
    if (['write_products', 'write_metaobjects', 'read_metaobject_definitions'].some((s) => !scope.has(s))) throw new DropshipError('missing-scopes', 403);
    const encrypted = await seal(secret, session.toObject(), `${tenant}:${session.shop}`);
    const record = {tenant, shop: session.shop, encrypted, status: 'active', kind, connectedAt: new Date(now()).toISOString()};
    await store.update('vault', (vault) => {
      if (Object.values(vault.entries).some((r) => r.shop === session.shop && r.tenant !== tenant && r.status === 'active')) throw new DropshipError('shop-already-connected', 409);
      vault.entries[id] = record;
      return vault;
    });
    return summary(id, record);
  }
  async function authorize(tenant, id) {
    if (!validTenant(tenant) || typeof id !== 'string' || !/^[a-f0-9]{64}$/.test(id)) throw new DropshipError('connection-not-found', 404);
    const {entries} = await store.get('vault');
    const record = entries[id];
    if (!record || record.tenant !== tenant || record.status !== 'active') throw new DropshipError('connection-not-found', 404);
    validate(tenant, record.shop);
    if (record.kind === 'development') return {record, admin: clients.admin};
    let session = restoreSession(await unseal(secret, record.encrypted, `${tenant}:${record.shop}`));
    if (session.expires && session.expires.getTime() - now() < 60000) {
      const key = `${tenant}:${id}`;
      if (!refreshes.has(key)) refreshes.set(key, (async () => {
        if (!session.refreshToken || !session.refreshTokenExpires || session.refreshTokenExpires.getTime() <= now()) throw new DropshipError('reconnect-required', 401);
        try {
          const refreshed = await sdk.auth.refreshToken({shop: record.shop, refreshToken: session.refreshToken});
          const encrypted = await seal(secret, refreshed.session.toObject(), `${tenant}:${record.shop}`);
          await store.update('vault', (vault) => {
            const current = vault.entries[id];
            if (!current || current.status !== 'active' || current.encrypted !== record.encrypted) throw new DropshipError('reconnect-required', 401);
            vault.entries[id] = {...current, encrypted};
            return vault;
          });
          return refreshed.session;
        } catch {throw new DropshipError('reconnect-required', 401);}
      })());
      try {session = await refreshes.get(key);} finally {refreshes.delete(key);}
    }
    return {record, admin: sessionAdmin(sdk, session)};
  }
  return {
    saveConnection,
    async workspace(tenant) {
      if (!validTenant(tenant)) throw new DropshipError('unauthorized', 401);
      const [vault, ledger] = await Promise.all([store.get('vault'), store.get('ledger')]);
      const connections = Object.entries(vault.entries).filter(([, r]) => r.tenant === tenant).map(([id, r]) => summary(id, r));
      const tasks = Object.values(ledger.entries).filter((r) => r.tenant === tenant && r.type === 'import')
        .map(({id, shop, handle, status, result, updatedAt}) => ({id, shop, handle, status, result, updatedAt}));
      return {connections, tasks, developmentShop: TEST_SHOP, oauthAvailable: !!oauthOrigin && !!returnOrigin, orderSyncAvailable: false};
    },
    async connectDevelopment(tenant) {return saveConnection(tenant, await clients.developmentSession(), 'development');},
    async disconnect(tenant, id) {
      if (!validTenant(tenant) || typeof id !== 'string' || !/^[a-f0-9]{64}$/.test(id)) throw new DropshipError('connection-not-found', 404);
      await store.update('vault', (vault) => {
        if (vault.entries[id]?.tenant !== tenant) throw new DropshipError('connection-not-found', 404);
        vault.entries[id] = {...vault.entries[id], status: 'inactive'};
        return vault;
      });
      return {disconnected: true};
    },
    async products(tenant, id) {
      const {admin} = await authorize(tenant, id);
      const data = await admin(MAPPINGS_QUERY);
      return {products: data.metaobjects.nodes.map((node) => {
        const fields = Object.fromEntries(node.fields.map(({key, value}) => [key, value]));
        return {id: node.id, title: node.fields.find(({key}) => key === 'target_product')?.reference?.title || null, sourceProductId: fields.source_product_id, targetProductId: fields.target_product, currency: fields.currency,
          variants: JSON.parse(fields.variant_map || '[]').length};
      }), hasMore: data.metaobjects.pageInfo.hasNextPage};
    },
    async importProduct(tenant, id, handle) {
      if (typeof handle !== 'string' || !/^[a-z0-9][a-z0-9-]{0,254}$/.test(handle)) throw new DropshipError('invalid', 400);
      const {record, admin} = await authorize(tenant, id);
      const taskId = digest(`${tenant}:${record.shop}:import:${handle}`);
      const attemptId = crypto.randomUUID();
      // An explicit retry reuses the importer recovery path; no automatic remote product write retry.
      await store.update('ledger', (ledger) => {
        const previous = ledger.entries[taskId];
        if (previous?.status === 'running' && now() - Date.parse(previous.updatedAt) < 120000) throw new DropshipError('in-progress', 409);
        ledger.entries[taskId] = {id: taskId, attemptId, tenant, shop: record.shop, handle, type: 'import', status: 'running', updatedAt: new Date(now()).toISOString()};
        return ledger;
      });
      try {
        const result = await importer({source: clients.source, admin}, handle, {apply: true});
        await store.update('ledger', (ledger) => {
          if (ledger.entries[taskId]?.attemptId !== attemptId) throw new DropshipError('conflict', 409);
          ledger.entries[taskId] = {...ledger.entries[taskId], status: 'completed', result, updatedAt: new Date(now()).toISOString()};return ledger;
        });
        return {taskId, ...result};
      } catch (error) {
        await store.update('ledger', (ledger) => {
          if (ledger.entries[taskId]?.attemptId !== attemptId) throw new DropshipError('conflict', 409);
          ledger.entries[taskId] = {...ledger.entries[taskId], status: 'needs-review', code: error instanceof ImportError ? error.code : 'unavailable', updatedAt: new Date(now()).toISOString()};return ledger;
        });
        throw new DropshipError(error instanceof ImportError ? error.code : 'unavailable');
      }
    },
    async prepareOAuth(tenant, shop, locale = 'en') {
      validate(tenant, shop);
      if (!oauthOrigin || !returnOrigin || new URL(oauthOrigin).protocol !== 'https:') throw new DropshipError('oauth-not-configured');
      const ticket = await seal(secret, {tenant, shop, locale: ['en', 'ja', 'de'].includes(locale) ? locale : 'en', expires: now() + 60000}, 'oauth-ticket');
      return {url: `${oauthOrigin}/auth/start?ticket=${encodeURIComponent(ticket)}`};
    },
  };
}
