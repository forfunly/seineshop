import {paginateScopedProducts} from './collection-filters.js';

/** Search every necessary collection page, rather than truncating suggestions. */
export async function loadScopedSuggestions(storefront, query, {handle, term, limit}) {
  const products = [];
  const seen = new Set();
  let after = null;
  do {
    const {collection} = await storefront.query(query, {
      variables: {...storefront.i18n, handle, after},
    });
    const connection = collection?.products;
    products.push(...paginateScopedProducts(connection?.nodes || [], term, limit, new URLSearchParams()).nodes);
    if (products.length >= limit || !connection?.pageInfo.hasNextPage) break;
    const cursor = connection.pageInfo.endCursor;
    if (!cursor || seen.has(cursor)) throw new Error('Incomplete scoped suggestions');
    seen.add(cursor);
    after = cursor;
  } while (after);
  return products.slice(0, limit);
}
