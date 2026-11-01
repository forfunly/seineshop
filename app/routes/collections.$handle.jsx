import {FacetedCollection} from '~/components/FacetedCollection';
import {parseCollectionFilters, collectionSearchQuery} from '~/lib/collection-filters';
import {useLoaderData} from 'react-router';
import {getPaginationVariables, Analytics} from '@shopify/hydrogen';
import {CollectionTemplate} from '~/components/CollectionTemplate';
import {
  previewEnabled,
  previewCollection,
  collectionNodes,
} from '~/lib/catalog.server';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
export async function loader({context, params, request}) {
  if (
    (params.handle === 'iphone-18-pro-max' ||
      collectionNodes.some((c) => c.handle === params.handle)) &&
    previewEnabled(context, request)
  )
    return previewCollection(request, params.handle);
  const search = new URL(request.url).searchParams;
  const browse = parseCollectionFilters(search);
  const searching = params.handle === 'best-sellers' && Boolean(browse.q);
  if (searching && !browse.sort.startsWith('price-')) browse.sort = 'featured';
  const variables = {
    handle: params.handle,
    filters: browse.filters,
    sortKey: browse.sort.startsWith('price-') ? 'PRICE' : browse.sort === 'newest' ? 'CREATED' : browse.sort === 'best-selling' ? 'BEST_SELLING' : 'COLLECTION_DEFAULT',
    reverse: browse.sort === 'price-desc' || browse.sort === 'newest',
    ...getPaginationVariables(request, {pageBy: browse.size}),
  };
  let {collection} = await context.storefront.query(COLLECTION_QUERY, {variables});
  if (searching && collection) {
    const {search: results} = await context.storefront.query(COLLECTION_SEARCH_QUERY, {variables: {
      ...variables, query: collectionSearchQuery(browse.q), sortKey: browse.sort.startsWith('price-') ? 'PRICE' : 'RELEVANCE', reverse: browse.sort === 'price-desc',
    }});
    collection = {...collection, products: {...results, filters: results.productFilters}, searchTotal: results.totalCount};
  }
  if (!collection) {
    const pending = collectionNodes.find((c) => c.handle === params.handle);
    if (!pending) throw new Response('Collection not found', {status: 404});
    collection = {
      title: pending.title,
      handle: pending.handle,
      description: '',
      products: {nodes: []},
    };
  }
  if (!collection.description)
    collection.description = `Explore ${collection.title.toLowerCase()} at SeineShop. Compare product specifications, materials and compatibility to find the right choice for your everyday needs.`;
  redirectIfHandleIsLocalized(request, {
    handle: params.handle,
    data: collection,
  });
  return {
    collection,
    preview: false,
    browse,
    types: [],
  };
}
export default function Collection() {
  const data = useLoaderData();
  return (
    <>
      {data.preview ? <CollectionTemplate {...data} /> : <FacetedCollection {...data} />}
      {!data.preview && data.collection.id && (
        <Analytics.CollectionView
          data={{
            collection: {
              id: data.collection.id,
              handle: data.collection.handle,
            },
          }}
        />
      )}
    </>
  );
}
const PRODUCT_ITEM_FRAGMENT = `#graphql
  fragment MoneyProductItem on MoneyV2 {
    amount
    currencyCode
  }
  fragment ProductItem on Product {
    id
    handle
    title
    vendor
    productType
    availableForSale
    featuredImage {
      id
      altText
      url
      width
      height
    }
    priceRange {
      minVariantPrice {
        ...MoneyProductItem
      }
      maxVariantPrice {
        ...MoneyProductItem
      }
    }
  }
`;

// NOTE: https://shopify.dev/docs/api/storefront/2022-04/objects/collection
const COLLECTION_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query Collection(
    $handle: String!
    $filters: [ProductFilter!]
    $sortKey: ProductCollectionSortKeys
    $reverse: Boolean
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      seo { title description }
      products(
        filters: $filters,
        sortKey: $sortKey,
        reverse: $reverse,
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor
      ) {
        filters { id label type values { id label count input } }
        nodes {
          ...ProductItem
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          endCursor
          startCursor
        }
      }
    }
  }
`;

/** @typedef {import('./+types/collections.$handle').Route} Route */
/** @typedef {import('storefrontapi.generated').ProductItemFragment} ProductItemFragment */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */

const COLLECTION_SEARCH_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query CollectionSearch($query: String!, $filters: [ProductFilter!], $sortKey: SearchSortKeys, $reverse: Boolean, $first: Int, $last: Int, $startCursor: String, $endCursor: String, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    search(query: $query, types: [PRODUCT], productFilters: $filters, sortKey: $sortKey, reverse: $reverse, first: $first, last: $last, before: $startCursor, after: $endCursor) {
      totalCount
      productFilters { id label type values { id label count input } }
      nodes { ... on Product { ...ProductItem } }
      pageInfo { hasPreviousPage hasNextPage endCursor startCursor }
    }
  }
`;
