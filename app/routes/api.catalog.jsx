import {PRODUCT_HANDLE} from '~/lib/wishlist';

// Public, read-only product lookup. No access to customer data, Admin API,
// inventory system records, or source and supplier metadata.
const apiHeaders = {'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, follow'};
export async function loader({request, context}) {
  const handle = new URL(request.url).searchParams.get('handle') || '';
  if (!PRODUCT_HANDLE.test(handle)) return Response.json({error: 'A valid product handle is required.'}, {status: 400, headers: apiHeaders});
  try {
    const {product} = await context.storefront.query(PUBLIC_CATALOG_QUERY, {variables: {...context.storefront.i18n, handle}});
    if (!product) return Response.json({error: 'Product not found.'}, {status: 404, headers: apiHeaders});
    return Response.json({product}, {headers: apiHeaders});
  } catch {
    return Response.json({error: 'Catalog temporarily unavailable.'}, {status: 503, headers: {...apiHeaders, 'Cache-Control': 'no-store'}});
  }
}

const PUBLIC_CATALOG_QUERY = `#graphql
  query PublicCatalogItem($handle: String!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      handle title description vendor availableForSale
      featuredImage { url altText }
      priceRange { minVariantPrice { amount currencyCode } maxVariantPrice { amount currencyCode } }
    }
  }
`;
