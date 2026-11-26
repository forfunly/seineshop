import {catalogDisplayTitle} from './catalog-labels';
import {browsePhone, indexPhoneProduct, phoneCollection} from './iphone-pro-collection';

const INDEX = `#graphql
  query IphoneProCollectionIndex($handle: String!, $after: String, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id handle title description seo { title description }
      products(first: 250, after: $after) {
        nodes {
          id title vendor productType tags createdAt
          options { name values }
          category: metafield(namespace: "custom", key: "category_group") { value }
          leadTime: metafield(namespace: "custom", key: "lead_time") { value }
          specifications: metafield(namespace: "custom", key: "technical_specifications") { value }
          priceRange { minVariantPrice { amount } }
        }
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
  query IphoneProCollectionRank($handle: String!, $after: String, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      products(first: 250, after: $after, sortKey: BEST_SELLING) {
        nodes { id }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
`;
async function readProducts(storefront, query, handle) {
  const products = [];
  let collection, after = null;
  const seen = new Set();
  for (;;) {
    const response = await storefront.query(query, {variables: {handle, after}, cache: storefront.CacheShort()});
    if (!response.collection) return {collection: null, products: []};
    collection ||= response.collection;
    const {nodes, pageInfo} = response.collection.products;
    products.push(...nodes);
    if (!pageInfo.hasNextPage) return {collection, products};
    if (!pageInfo.endCursor || seen.has(pageInfo.endCursor)) throw new Error('Incomplete iPhone accessory collection');
    after = pageInfo.endCursor;
    seen.add(after);
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
