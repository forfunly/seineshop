import products from '~/data/catalog-preview.json';
import samples from '~/data/navigation-preview.json';
import {categories} from '~/data/navigation';
export const collectionNodes = categories.flatMap((c) => [c, ...c.children]);
export const collectionIntro =
  'Find your everyday fit: protective cases, screen protectors and camera protection listed for iPhone 18 Pro Max. Compare materials, finishes and features, and check the exact device compatibility on each product.';
export function previewEnabled(context, request) {
  return (
    context.env.PUBLIC_CATALOG_PREVIEW === 'true' &&
    ['localhost', '127.0.0.1'].includes(new URL(request.url).hostname)
  );
}
export function previewCollection(request, handle = 'iphone-18-pro-max') {
  const category = collectionNodes.find((c) => c.handle === handle);
  const source = handle === 'iphone-18-pro-max' ? products : samples.filter((p) => p.collectionHandle === handle);
  if (handle !== 'iphone-18-pro-max' && !category) throw new Response('Not found', {status: 404});
  const url = new URL(request.url),
    params = url.searchParams;
  const type = params.get('type') || '',
    q = (params.get('q') || '').trim(),
    sort = params.get('sort') || 'featured';
  const rawPage = params.get('page') || '1';
  if (!/^[1-9]\d*$/.test(rawPage))
    throw new Response('Invalid page', {status: 404});
  const page = Number(rawPage),
    pageSize = 24;
  let rows = source.filter(
    (p) =>
      (!type || p.type === type) &&
      (!q || p.title.toLowerCase().includes(q.toLowerCase())),
  );
  if (sort === 'price-asc')
    rows = rows.toSorted((a, b) => Number(a.price) - Number(b.price));
  if (sort === 'price-desc')
    rows = rows.toSorted((a, b) => Number(b.price) - Number(a.price));
  const total = rows.length,
    pages = Math.max(1, Math.ceil(total / pageSize));
  if (page > pages) throw new Response('Page not found', {status: 404});
  return {
    preview: true,
    collection: {
      title: category?.title || 'iPhone 18 Pro Max Accessories',
      handle,
      description: category ? `Explore ${category.title.toLowerCase()} at SeineShop. Compare product specifications, materials and compatibility to find the right choice for your everyday needs.` : collectionIntro,
    },
    items: rows.slice((page - 1) * pageSize, page * pageSize),
    total,
    page,
    pages,
    filters: {type, q, sort},
    types: [...new Set(source.map((p) => p.type))],
  };
}
export function previewProduct(sku) {
  return samples.find((p) => p.id === sku) || products.find((p) => p.id === sku);
}
