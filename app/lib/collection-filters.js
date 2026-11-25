const ALLOWED = new Set(['available', 'productType', 'productVendor', 'productMetafield', 'variantOption']);
export function parseCollectionFilters(search) {
  const selected = [];
  for (const raw of search.getAll('filter').slice(0, 25)) {
    try {
      const value = JSON.parse(raw);
      if (!value || Array.isArray(value) || Object.keys(value).length !== 1) continue;
      const key = Object.keys(value)[0];
      if (!ALLOWED.has(key)) continue;
      if (['productType', 'productVendor'].includes(key) && (typeof value[key] !== 'string' || value[key].length > 255)) continue;
      if (key === 'available' && typeof value[key] !== 'boolean') continue;
      if (key === 'productMetafield' && (value[key]?.namespace !== 'custom' || !['category_group', 'lead_time', 'material', 'color', 'compatible_models', 'customizable'].includes(value[key]?.key) || typeof value[key]?.value !== 'string')) continue;
      if (key === 'variantOption' && (typeof value[key]?.name !== 'string' || typeof value[key]?.value !== 'string')) continue;
      if (!selected.some(x => JSON.stringify(x) === JSON.stringify(value))) selected.push(value);
    } catch { /* Ignore malformed filter URLs. */ }
  }
  const price = {};
  for (const key of ['min', 'max']) {
    const raw = search.get(key);
    if (raw !== null && raw !== '' && Number.isFinite(Number(raw)) && Number(raw) >= 0) price[key] = Number(raw);
  }
  if (price.min !== undefined && price.max !== undefined && price.min > price.max) [price.min, price.max] = [price.max, price.min];
  const filters = [...selected];
  if (Object.keys(price).length) filters.push({price});
  // Preserve existing category bookmarks.
  if (search.get('type')) filters.push({productType: search.get('type').slice(0,255)});
  const sort = ['featured','best-selling','newest','price-asc','price-desc'].includes(search.get('sort')) ? search.get('sort') : 'featured';
  return {filters, selected: selected.map(x=>JSON.stringify(x)), min:price.min ?? '',max:price.max ?? '',sort, q:(search.get('q') || '').trim().slice(0,120),size:[24,40,60,80].includes(Number(search.get('size'))) ? Number(search.get('size')) : 40,view:search.get('view') === 'list' ? 'list' : 'grid'};
}
export function collectionSearchQuery(q, handle = 'best-sellers', categories = []) {
  const terms = q.replace(/[\\:"(){}\[\]*<>]/g,' ').split(/\s+/).filter(Boolean).map(term=>`"${term}"`).join(' ');
  const tag = handle === 'iphone-duo' ? 'tag:"iPhone Duo"' : 'tag:seineshop-best-sellers';
  const types = categories.map((value) => `product_type:${JSON.stringify(value)}`).join(' OR ');
  return `${tag}${types ? ` AND (${types})` : ''}${terms ? ' AND ('+terms+')' : ''}`;
}

/** Paginate a category from the collection itself, independent of search indexing. */
export function paginateCategoryProducts(products, categories, size, search) {
  const matching = products.filter((product) => categories.includes(product.productType));
  return paginateLocalProducts(matching, size, search);
}

export function paginateScopedProducts(products, term, size, search) {
  const words = term.toLowerCase().split(/\s+/).filter(Boolean);
  const matching = products.filter((product) => {
    const text = [product.title, product.handle, product.vendor, product.productType].join(' ').toLowerCase();
    return words.every((word) => text.includes(word));
  });
  return paginateLocalProducts(matching, size, search);
}

function paginateLocalProducts(matching, size, search) {
  const cursor = /^category:(\d+)$/.exec(search.get('cursor') || '');
  const boundary = cursor ? Number(cursor[1]) : 0;
  const requested = search.get('direction') === 'previous' ? boundary - size : boundary;
  const lastOffset = Math.max(0, Math.floor((matching.length - 1) / size) * size);
  const offset = Math.min(Math.max(0, requested), lastOffset);
  const nodes = matching.slice(offset, offset + size);
  return {nodes, totalCount: matching.length, pageInfo: {
    hasPreviousPage: offset > 0,
    hasNextPage: offset + nodes.length < matching.length,
    startCursor: `category:${offset}`,
    endCursor: `category:${offset + nodes.length}`,
  }};
}
