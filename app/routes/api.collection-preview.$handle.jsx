/** The Best Sellers dialog fetches only the selected product in the active market. */
export async function loader({context, params}) {
  const headers = {'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex'};
  if (!/^[a-z0-9][a-z0-9-]{0,254}$/i.test(params.handle || '')) {
    return Response.json({product: null}, {status: 404, headers});
  }
  try {
    const {product} = await context.storefront.query(PREVIEW_QUERY, {
      variables: {handle: params.handle},
    });
    return Response.json({product}, {status: product ? 200 : 404, headers});
  } catch {
    return Response.json({product: null}, {status: 503, headers});
  }
}

const PREVIEW_QUERY = `#graphql
  fragment CollectionPreviewVariant on ProductVariant {
    id title sku availableForSale
    selectedOptions { name value }
    price { amount currencyCode }
    image { id url altText width height }
    quantityRule { minimum maximum increment }
  }
  query CollectionPreview($handle: String!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      handle title
      leadTime: metafield(namespace: "custom", key: "lead_time") { value }
      images(first: 12) { nodes { id url altText width height } }
      selectedOrFirstAvailableVariant { ...CollectionPreviewVariant }
      variants(first: 100) { nodes { ...CollectionPreviewVariant } pageInfo { hasNextPage } }
    }
  }
`;
