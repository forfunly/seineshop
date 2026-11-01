import {useLocale} from '~/lib/i18n';
import {useLoaderData} from 'react-router';
import {Analytics} from '@shopify/hydrogen';
import {FacetedCollection} from '~/components/FacetedCollection';
import {parseCollectionFilters} from '~/lib/collection-filters';
import {SearchForm} from '~/components/SearchForm';
import {SearchResults} from '~/components/SearchResults';
import {getEmptyPredictiveSearchResult} from '~/lib/search';

/**
 * @type {Route.MetaFunction}
 */
export const meta = () => {
  return [
    {
      title: `Hydrogen | Search`,
    },
  ];
};

/**
 * @param {Route.LoaderArgs}
 */
export async function loader({request, context}) {
  const url = new URL(request.url);
  const isPredictive = url.searchParams.has('predictive');
  const searchPromise = isPredictive
    ? predictiveSearch({
        request,
        context,
      })
    : regularSearch({
        request,
        context,
      });
  return await searchPromise.catch(() => {
    return {
      term: (url.searchParams.get('q') || '').trim().slice(0, 120),
      result: null,
      type: isPredictive ? 'predictive' : 'regular',
      error: 'Search is temporarily unavailable. Please try again.',
    };
  });
}

/**
 * Renders the /search route
 */
export default function SearchPage() {
  const {t} = useLocale();
  /** @type {LoaderReturnData} */
  const {type, term, result, error, browse} = useLoaderData();
  if (type === 'predictive') return null;
  if (term && result)
    return (
      <>
        <FacetedCollection
          searchMode
          browse={browse}
          collection={{
            title: `Search results for “${term}”`,
            description:
              'Find the right accessory. Refine by category, availability and price.',
            searchTotal: result.items.products.totalCount,
            products: {
              ...result.items.products,
              filters: result.items.products.productFilters,
            },
          }}
        />
        <div className="search-content-results">
          <SearchResults.Pages pages={result.items.pages} term={term} />
          <SearchResults.Articles
            articles={result.items.articles}
            term={term}
          />
        </div>
        <Analytics.SearchView
          data={{searchTerm: term, searchResults: result}}
        />
      </>
    );
  return (
    <div className="search">
      <h1>{t('Search')}</h1>
      <SearchForm>
        {({inputRef}) => (
          <>
            <input
              defaultValue={term}
              name="q"
              placeholder={t('Search…')}
              ref={inputRef}
              type="search"
            />
            &nbsp;
            <button type="submit">{t('Search')}</button>
          </>
        )}
      </SearchForm>
      {error && (
        <p
          style={{
            color: 'red',
          }}
        >
          {t(error)}
        </p>
      )}
      {t(
        !term || !result?.total ? (
          <SearchResults.Empty />
        ) : (
          <SearchResults result={result} term={term}>
            {({articles, pages, products, term}) => (
              <div>
                <SearchResults.Products products={products} term={term} />
                <SearchResults.Pages pages={pages} term={term} />
                <SearchResults.Articles articles={articles} term={term} />
              </div>
            )}
          </SearchResults>
        ),
      )}
      <Analytics.SearchView
        data={{
          searchTerm: term,
          searchResults: result,
        }}
      />
    </div>
  );
}

/**
 * Regular search query and fragments
 * (adjust as needed)
 */
const SEARCH_PRODUCT_FRAGMENT = `#graphql
  fragment SearchProduct on Product {
    __typename
    handle
    id
    publishedAt
    title
    trackingParameters
    vendor
    productType
    availableForSale
    featuredImage { url altText width height }
    priceRange { minVariantPrice { amount currencyCode } }
    selectedOrFirstAvailableVariant(
      selectedOptions: []
      ignoreUnknownOptions: true
      caseInsensitiveMatch: true
    ) {
      id
      image {
        url
        altText
        width
        height
      }
      price {
        amount
        currencyCode
      }
      compareAtPrice {
        amount
        currencyCode
      }
      selectedOptions {
        name
        value
      }
      product {
        handle
        title
      }
    }
  }
`;
const SEARCH_PAGE_FRAGMENT = `#graphql
  fragment SearchPage on Page {
     __typename
     handle
    id
    title
    trackingParameters
  }
`;
const SEARCH_ARTICLE_FRAGMENT = `#graphql
  fragment SearchArticle on Article {
    __typename
    handle
    id
    title
    trackingParameters
    blog { handle }
  }
`;
const PAGE_INFO_FRAGMENT = `#graphql
  fragment PageInfoFragment on PageInfo {
    hasNextPage
    hasPreviousPage
    startCursor
    endCursor
  }
`;

// NOTE: https://shopify.dev/docs/api/storefront/latest/queries/search
export const SEARCH_QUERY = `#graphql
  query RegularSearch(
    $country: CountryCode
    $endCursor: String
    $first: Int
    $language: LanguageCode
    $last: Int
    $term: String!
    $startCursor: String
    $filters: [ProductFilter!]
    $sortKey: SearchSortKeys
    $reverse: Boolean
  ) @inContext(country: $country, language: $language) {
    articles: search(
      query: $term,
      types: [ARTICLE],
      first: $first,
    ) {
      nodes {
        ...on Article {
          ...SearchArticle
        }
      }
    }
    pages: search(
      query: $term,
      types: [PAGE],
      first: $first,
    ) {
      nodes {
        ...on Page {
          ...SearchPage
        }
      }
    }
    products: search(
      after: $endCursor,
      before: $startCursor,
      first: $first,
      last: $last,
      query: $term,
      sortKey: $sortKey,
      reverse: $reverse,
      productFilters: $filters,
      types: [PRODUCT],
      unavailableProducts: LAST,
    ) {
      nodes {
        ...on Product {
          ...SearchProduct
        }
      }
      totalCount
      productFilters { id label type values { id label count input } }
      pageInfo {
        ...PageInfoFragment
      }
    }
  }
  ${SEARCH_PRODUCT_FRAGMENT}
  ${SEARCH_PAGE_FRAGMENT}
  ${SEARCH_ARTICLE_FRAGMENT}
  ${PAGE_INFO_FRAGMENT}
`;

/**
 * Regular search fetcher
 * @param {Pick<
 *   Route.LoaderArgs,
 *   'request' | 'context'
 * >}
 * @return {Promise<RegularSearchReturn>}
 */
async function regularSearch({request, context}) {
  const {storefront} = context;
  const url = new URL(request.url);
  const browse = parseCollectionFilters(url.searchParams);
  const term = browse.q;
  if (!term) return {type: 'regular', term, browse, result: null};
  const previous = url.searchParams.get('direction') === 'previous';
  const cursor = url.searchParams.get('cursor');
  const variables = previous
    ? {last: browse.size, startCursor: cursor}
    : {first: browse.size, endCursor: cursor};

  // Search articles, pages, and products for the `q` term
  const {errors, ...items} = await storefront.query(SEARCH_QUERY, {
    variables: {
      ...variables,
      ...storefront.i18n,
      term,
      filters: browse.filters,
      sortKey: browse.sort.startsWith('price-') ? 'PRICE' : 'RELEVANCE',
      reverse: browse.sort === 'price-desc',
    },
  });
  if (!items) {
    throw new Error('No search data returned from Shopify API');
  }
  const total =
    (items.products?.totalCount || 0) +
    (items.pages?.nodes?.length || 0) +
    (items.articles?.nodes?.length || 0);
  const error = errors
    ? errors.map(({message}) => message).join(', ')
    : undefined;
  return {
    type: 'regular',
    browse,
    term,
    error,
    result: {
      total,
      items,
    },
  };
}

/**
 * Predictive search query and fragments
 * (adjust as needed)
 */
const PREDICTIVE_SEARCH_ARTICLE_FRAGMENT = `#graphql
  fragment PredictiveArticle on Article {
    __typename
    id
    title
    handle
    blog {
      handle
    }
    image {
      url
      altText
      width
      height
    }
    trackingParameters
  }
`;
const PREDICTIVE_SEARCH_COLLECTION_FRAGMENT = `#graphql
  fragment PredictiveCollection on Collection {
    __typename
    id
    title
    handle
    image {
      url
      altText
      width
      height
    }
    trackingParameters
  }
`;
const PREDICTIVE_SEARCH_PAGE_FRAGMENT = `#graphql
  fragment PredictivePage on Page {
    __typename
    id
    title
    handle
    trackingParameters
  }
`;
const PREDICTIVE_SEARCH_PRODUCT_FRAGMENT = `#graphql
  fragment PredictiveProduct on Product {
    __typename
    id
    title
    handle
    trackingParameters
    selectedOrFirstAvailableVariant(
      selectedOptions: []
      ignoreUnknownOptions: true
      caseInsensitiveMatch: true
    ) {
      id
      image {
        url
        altText
        width
        height
      }
      price {
        amount
        currencyCode
      }
    }
  }
`;
const PREDICTIVE_SEARCH_QUERY_FRAGMENT = `#graphql
  fragment PredictiveQuery on SearchQuerySuggestion {
    __typename
    text
    styledText
    trackingParameters
  }
`;

// NOTE: https://shopify.dev/docs/api/storefront/latest/queries/predictiveSearch
const PREDICTIVE_SEARCH_QUERY = `#graphql
  query PredictiveSearch(
    $country: CountryCode
    $language: LanguageCode
    $limit: Int!
    $limitScope: PredictiveSearchLimitScope!
    $term: String!
    $types: [PredictiveSearchType!]
  ) @inContext(country: $country, language: $language) {
    predictiveSearch(
      limit: $limit,
      limitScope: $limitScope,
      query: $term,
      types: $types,
    ) {
      articles {
        ...PredictiveArticle
      }
      collections {
        ...PredictiveCollection
      }
      pages {
        ...PredictivePage
      }
      products {
        ...PredictiveProduct
      }
      queries {
        ...PredictiveQuery
      }
    }
  }
  ${PREDICTIVE_SEARCH_ARTICLE_FRAGMENT}
  ${PREDICTIVE_SEARCH_COLLECTION_FRAGMENT}
  ${PREDICTIVE_SEARCH_PAGE_FRAGMENT}
  ${PREDICTIVE_SEARCH_PRODUCT_FRAGMENT}
  ${PREDICTIVE_SEARCH_QUERY_FRAGMENT}
`;

/**
 * Predictive search fetcher
 * @param {Pick<
 *   Route.ActionArgs,
 *   'request' | 'context'
 * >}
 * @return {Promise<PredictiveSearchReturn>}
 */
async function predictiveSearch({request, context}) {
  const {storefront} = context;
  const url = new URL(request.url);
  const term = String(url.searchParams.get('q') || '')
    .trim()
    .slice(0, 120);
  const limit = Math.max(
    1,
    Math.min(6, Number(url.searchParams.get('limit')) || 5),
  );
  const type = 'predictive';
  if (!term)
    return {
      type,
      term,
      result: getEmptyPredictiveSearchResult(),
    };

  // Predictively search articles, collections, pages, products, and queries (suggestions)
  const {predictiveSearch: items, errors} = await storefront.query(
    PREDICTIVE_SEARCH_QUERY,
    {
      variables: {
        // customize search options as needed
        limit,
        limitScope: 'EACH',
        ...storefront.i18n,
        term,
      },
    },
  );
  if (errors) {
    throw new Error(
      `Shopify API errors: ${errors.map(({message}) => message).join(', ')}`,
    );
  }
  if (!items) {
    throw new Error('No predictive search data returned from Shopify API');
  }
  const total = Object.values(items)
    .map((item) => (Array.isArray(item) ? item.length : 0))
    .reduce((sum, count) => sum + count, 0);
  return {
    type,
    term,
    result: {
      items,
      total,
    },
  };
}

/** @typedef {import('./+types/search').Route} Route */
/** @typedef {import('~/lib/search').RegularSearchReturn} RegularSearchReturn */
/** @typedef {import('~/lib/search').PredictiveSearchReturn} PredictiveSearchReturn */
/** @typedef {import('storefrontapi.generated').RegularSearchQuery} RegularSearchQuery */
/** @typedef {import('storefrontapi.generated').PredictiveSearchQuery} PredictiveSearchQuery */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
