import {ImportError} from './catalog-plan.mjs';

export const SOURCE_PRODUCT_QUERY = `#graphql
  query DropshipSourceProduct($handle: String!, $after: String) @inContext(country: US, language: EN) {
    product(handle: $handle) {
      id title handle descriptionHtml updatedAt
      options { name optionValues { name } }
      images(first: 100, after: $after) { nodes { url altText } pageInfo { hasNextPage endCursor } }
      variants(first: 250) {
        nodes { id sku selectedOptions { name value } price { amount currencyCode } image { url altText } }
        pageInfo { hasNextPage }
      }
    }
  }
`;

export async function readPublicProduct(source, handle) {
  if (!/^[a-z0-9][a-z0-9-]{0,254}$/.test(handle || '')) throw new ImportError('invalid-handle');
  let product, after;
  const cursors = new Set();
  do {
    const data = await source(SOURCE_PRODUCT_QUERY, {handle, after: after || null});
    const next = data.product;
    if (!next?.id) throw new ImportError('product-not-found');
    if (!product) product = {...next, options: next.options.map((option) => ({name: option.name, values: option.optionValues.map(({name}) => name)}))};
    else {
      if (next.id !== product.id || next.updatedAt !== product.updatedAt) throw new ImportError('catalog-changed');
      product.images.nodes.push(...next.images.nodes);
      product.images.pageInfo = next.images.pageInfo;
    }
    if (product.images.nodes.length > 250) throw new ImportError('too-many-images');
    if (!next.images.pageInfo.hasNextPage) break;
    after = next.images.pageInfo.endCursor;
    if (!after || cursors.has(after)) throw new ImportError('incomplete-catalog');
    cursors.add(after);
  } while (product.images.pageInfo.hasNextPage);
  return product;
}
