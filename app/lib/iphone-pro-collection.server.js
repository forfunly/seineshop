import {catalogDisplayTitle} from './catalog-labels.js';
import {browsePhone, indexPhoneProduct, phoneCollection} from './iphone-pro-collection.js';

const INDEX = `#graphql
  fragment PhoneIndexItem on Product {
    id title vendor productType tags createdAt
    options { name values }
    category: metafield(namespace: "custom", key: "category_group") { value }
    leadTime: metafield(namespace: "custom", key: "lead_time") { value }
    specifications: metafield(namespace: "custom", key: "technical_specifications") { value }
    priceRange { minVariantPrice { amount } }
  }
  query IphoneProCollectionIndex($handle: String!, $after: String, $reverse: Boolean!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id handle title description seo { title description }
      products(first: 250, after: $after, reverse: $reverse) {
        nodes { ...PhoneIndexItem }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
`;
const CARDS = `#graphql
  query IphoneProCollectionCards($ids: [ID!]!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    nodes(ids: $ids) {
      ... on Product {
        id title handle availableForSale
        featuredImage { id altText url width height }
        priceRange { minVariantPrice { amount currencyCode } }
      }
    }
  }
`;
const SALES = `#graphql
  query IphoneProCollectionRank($handle: String!, $after: String, $reverse: Boolean!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      products(first: 250, after: $after, sortKey: BEST_SELLING, reverse: $reverse) {
        nodes { id }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
`;
/** @typedef {{id: string, [key: string]: unknown}} IndexProduct */
/** @typedef {{collection: {id?: string, products: {nodes: IndexProduct[], pageInfo: {hasNextPage: boolean, endCursor?: string | null}}} | null}} IndexResponse */
async function readProducts(storefront, query, handle) {
  /** @type {IndexProduct[]} */
  const head = [];
  /** @type {IndexProduct[]} */
  const tail = [];
  const headIds = new Set(), tailIds = new Set();
  const afterCursors = new Set(), tailCursors = new Set();
  let collection, after = null, tailAfter = null;
  for (;;) {
    /** @type {[IndexResponse, IndexResponse]} */
    const [frontResponse, backResponse] = await Promise.all([
      storefront.query(query, {variables: {handle, after, reverse: false}, cache: storefront.CacheShort()}),
      storefront.query(query, {variables: {handle, after: tailAfter, reverse: true}, cache: storefront.CacheShort()}),
    ]);
    if (!frontResponse.collection && !backResponse.collection) return {collection: null, products: []};
    collection ||= frontResponse.collection;
    // Both connections retain the same Shopify order. Walk from both ends to
    // halve the serial round trips, without inventing or decoding opaque cursors.
    const forward = frontResponse.collection?.products, backward = backResponse.collection?.products;
    if (!forward?.nodes || !backward?.nodes || !forward.pageInfo || !backward.pageInfo) throw new Error('Incomplete iPhone accessory collection');
    for (const node of forward.nodes) {
      if (!node.id || headIds.has(node.id)) throw new Error('Incomplete iPhone accessory collection');
      headIds.add(node.id);
      head.push(node);
    }
    for (const node of backward.nodes) {
      if (!node.id || tailIds.has(node.id)) throw new Error('Incomplete iPhone accessory collection');
      tailIds.add(node.id);
    }
    tail.unshift(...[...backward.nodes].reverse());
    const overlap = forward.nodes.some(({id}) => tailIds.has(id)) || backward.nodes.some(({id}) => headIds.has(id));
    if (overlap) {
      const start = head.findIndex(({id}) => id === tail[0]?.id);
      if (start < 0 || head.slice(start).some(({id}, i) => id !== tail[i]?.id)) throw new Error('Incomplete iPhone accessory collection');
    }
    if (overlap || !forward.pageInfo.hasNextPage || !backward.pageInfo.hasNextPage) {
      return {collection, products: [...head, ...tail.filter(({id}) => !headIds.has(id))]};
    }
    const next = forward.pageInfo.endCursor, previous = backward.pageInfo.endCursor;
    if (!forward.nodes.length || !backward.nodes.length || !next || !previous || afterCursors.has(next) || tailCursors.has(previous)) throw new Error('Incomplete iPhone accessory collection');
    after = next;
    tailAfter = previous;
    afterCursors.add(after);
    tailCursors.add(tailAfter);
  }
}
export async function loadPhoneCollection({storefront, catalogCache, env}, handle, params) {
  const definition = phoneCollection(handle);
  if (!definition) throw new Response('Collection not found', {status: 404});
  const {series, category} = definition;
  const cacheOptions = (key) => ({cacheKey: [key, series.handle, env.PUBLIC_STORE_DOMAIN, storefront.i18n.country, storefront.i18n.language], cacheStrategy: storefront.CacheCustom({mode: 'public', maxAge: 300, staleWhileRevalidate: 3600}), shouldCacheResult: (result) => Boolean(result.collection)});
  const [{collection, products}, rank] = await Promise.all([
    catalogCache.run(cacheOptions('iphone-pro-index-v2'), async () => {
      const {collection, products} = await readProducts(storefront, INDEX, series.handle);
      return {collection: collection ? {id: collection.id} : null, products: products.map(indexPhoneProduct)};
    }),
    params.get('sort') === 'best-selling' ? catalogCache.run(cacheOptions('iphone-pro-rank-v1'), () => readProducts(storefront, SALES, series.handle)) : null,
  ]);
  if (!collection) throw new Response('Collection not found', {status: 404});
  const phone = browsePhone(products, category, params, rank?.products.map((p) => p.id));
  const {nodes} = phone.ids.length ? await storefront.query(CARDS, {variables: {ids: phone.ids}}) : {nodes: []};
  const cards = new Map(nodes.filter((node) => node?.handle).map((node) => [node.id, {...node, title: catalogDisplayTitle(node.title), featuredImage: node.featuredImage ? {...node.featuredImage, altText: catalogDisplayTitle(node.featuredImage.altText || node.title)} : null}]));
  const title = category ? `${series.title} ${category.title}` : series.title;
  const description = category?.key === 'cases' ? `Explore ${series.title} cases and compare their materials, features and device compatibility.` : category ? `Compare ${series.title} screen and camera lens protectors by material, coverage and finish.` : `Explore ${series.title} cases and screen protectors. Compare materials, protection features and device compatibility.`;
  return {phone, series, collection: {id: collection.id, handle, title, description, seo: {title, description}, products: {nodes: phone.ids.map((id) => cards.get(id)).filter(Boolean)}}};
}
