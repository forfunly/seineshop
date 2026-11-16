import {DropshipError} from '../../../../app/lib/dropshipping-transport.server.js';
import {TEST_SHOP} from './catalog-plan.mjs';

export const STORE_QUERY = `query DropshipPrivateStore {
  shop { id myshopifyDomain
    vault: metafield(namespace: "$app", key: "connection_vault") { jsonValue compareDigest }
    ledger: metafield(namespace: "$app", key: "order_ledger") { jsonValue compareDigest }
  }
  vaultDefinition: metafieldDefinition(identifier: {namespace: "$app", key: "connection_vault", ownerType: SHOP}) { type { name } access { storefront } }
  ledgerDefinition: metafieldDefinition(identifier: {namespace: "$app", key: "order_ledger", ownerType: SHOP}) { type { name } access { storefront } }
}`;
export const STORE_MUTATION = `mutation DropshipPrivateCompareUpdate($metafields: [MetafieldsSetInput!]!) {
  metafieldsSet(metafields: $metafields) { metafields { key compareDigest } userErrors { code field } }
}`;
function validState(value, name) {
  if (!value || value.version !== 1 || typeof value.entries !== 'object' || !value.entries || Array.isArray(value.entries) ||
    Object.keys(value.entries).length > (name === 'vault' ? 20 : 50) || Buffer.byteLength(JSON.stringify(value), 'utf8') > 100000 ||
    Object.entries(value.entries).some(([id, row]) => !/^[a-f0-9]{64}$/.test(id) || !row || typeof row !== 'object' || Array.isArray(row)))
    throw new DropshipError('storage-invalid');
}

/** Shopify-backed bounded test registry. Mutators must be pure because CAS conflicts may replay them. */
export function createPrivateStore(admin) {
  async function read() {
    const result = await admin(STORE_QUERY);
    if (result.shop?.myshopifyDomain !== TEST_SHOP || [result.vaultDefinition, result.ledgerDefinition].some((d) => d?.type?.name !== 'json' || d.access?.storefront !== 'NONE'))
      throw new DropshipError('storage-not-ready');
    for (const name of ['vault', 'ledger']) {
      const value = result.shop[name]?.jsonValue;
      if (result.shop[name]) validState(value, name);
    }
    return result.shop;
  }
  return {
    async get(name) {
      if (!['vault', 'ledger'].includes(name)) throw new DropshipError('invalid', 400);
      const shop = await read();
      return structuredClone(shop[name]?.jsonValue || {version: 1, entries: {}});
    },
    async update(name, mutate) {
      if (!['vault', 'ledger'].includes(name)) throw new DropshipError('invalid', 400);
      for (let attempt = 0; attempt < 4; attempt++) {
        const shop = await read();
        const previous = shop[name]?.jsonValue || {version: 1, entries: {}};
        const next = mutate(structuredClone(previous));
        if (JSON.stringify(next) === JSON.stringify(previous)) return next;
        const value = JSON.stringify(next);
        if (Object.keys(next.entries).length > (name === 'vault' ? 20 : 50) || Buffer.byteLength(value, 'utf8') > 100000) throw new DropshipError('storage-full', 409);
        validState(next, name);
        const data = await admin(STORE_MUTATION, {metafields: [{ownerId: shop.id, namespace: '$app', key: name === 'vault' ? 'connection_vault' : 'order_ledger',
          type: 'json', value, compareDigest: shop[name]?.compareDigest || null}]});
        const errors = data.metafieldsSet?.userErrors;
        if (errors?.some(({code}) => code === 'INVALID_COMPARE_DIGEST' || code === 'STALE_OBJECT')) continue;
        if (!data.metafieldsSet?.metafields?.length || errors?.length) throw new DropshipError('storage-write-failed');
        return next;
      }
      throw new DropshipError('conflict', 409);
    },
  };
}
