const HEADERS = {'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow'};

const VARIANTS_QUERY = `#graphql
  query BulkPurchaseVariants($handle: String!, $after: String, $country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      id title handle
      variants(first: 50, after: $after) {
        nodes {
          id title sku availableForSale
          image { url altText width height }
          price { amount currencyCode }
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
`;

/** Public purchase data only: no sourcing fields, customer data or app credentials. */
export async function productVariantsLoader({request, context}) {
  const params = new URL(request.url).searchParams;
  const handle = params.get('handle');
  const after = params.get('after');
  if (!handle || !/^[a-zA-Z0-9_-]{1,255}$/.test(handle) ||
    (after !== null && (!after.length || after.length > 1024))) {
    return Response.json({error: 'invalid'}, {status: 400, headers: HEADERS});
  }
  try {
    const {product} = await context.storefront.query(VARIANTS_QUERY, {
      variables: {handle, after, ...context.storefront.i18n},
      cache: context.storefront.CacheNone(),
    });
    if (!product) return Response.json({error: 'not-found'}, {status: 404, headers: HEADERS});
    return Response.json({product}, {headers: HEADERS});
  } catch {
    return Response.json({error: 'unavailable'}, {status: 503, headers: HEADERS});
  }
}
