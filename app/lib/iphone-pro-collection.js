import {catalogColorLabel, catalogDisplayTitle} from './catalog-labels.js';

export const PHONE_COLLECTIONS = [
  {handle: 'iphone-18-pro', title: 'iPhone 18 Pro'},
  {handle: 'iphone-18', title: 'iPhone 18', showTopics: false},
];
export const PHONE_CATEGORIES = [
  {key: 'cases', title: 'Cases', topics: ['MagSafe Case', 'Silicone Case', 'Clear Case', 'Leather Case', 'Bumper Case', 'Metal Case', 'Slim Case', 'Wallet Case', 'Case with Card Holder', 'Case with Stand']},
  {key: 'screen-protectors', title: 'Screen Protectors', topics: ['Privacy Screen Protector', 'Tempered Glass', 'Camera Cover', 'Camera Lens Protector', 'Matte Screen Protector']},
];
export const PHONE_FACETS = ['Product Tags', 'Estimated Lead Time', 'Promotions', 'Brand', 'Manufacturer', 'Model', 'Material', 'Color', 'Case Feature', 'Screen Protector Feature', 'Screen Protector Type', 'Texture', 'Surface Workmanship', 'Packaging Type', 'Edges', 'Screen Protector Material', 'Screen Coverage', 'ColorStyle', 'Pattern'];
export const PHONE_TAGS = ['New Arrivals', 'Best Sellers', 'Branded Products', 'Seine Shop Recommends'];
const TOPIC_MATCHERS = [
  /magsafe/i, /silicone/i, /clear|transparent/i, /leather/i, /bumper/i, /metal|alumini?um/i, /\bslim\b|ultra.thin/i, /wallet/i, /card holder|card slot/i, /kickstand|with (?:a )?stand/i,
  /privacy|anti.spy|anti.peep/i, /tempered glass/i, /camera (?:lens )?cover/i, /camera lens protect|lens film/i, /matte/i,
];
const TOPICS = new Map(PHONE_CATEGORIES.flatMap((category) => category.topics).map((topic, i) => [topic, TOPIC_MATCHERS[i]]));
const clean = (value) => String(value || '').trim();
const parts = (value) => clean(value).split(/[,\n]/).map(clean).filter(Boolean);
export function phoneCollection(handle) {
  for (const series of PHONE_COLLECTIONS) {
    if (handle === series.handle) return {series, category: undefined};
    const category = PHONE_CATEGORIES.find(({key}) => handle === `${series.handle}-${key}`);
    if (category) return {series, category: series.showTopics === false ? {...category, topics: []} : category};
  }
  return null;
}
export function phoneCategory(handle) {return phoneCollection(handle)?.category;}
export function isPhoneCollection(handle) {return Boolean(phoneCollection(handle));}
function attributes(product) {
  try {return JSON.parse(product.specifications?.value || '{}').attributes || {};} catch {return {};}
}
export function phoneProductKinds(product) {
  const classification = clean(product.category?.value) || clean(product.productType);
  const kinds = [];
  if (/\bcase(s)?\b|phone pouch/i.test(classification)) kinds.push('cases');
  if (/screen protect|camera lens|back protect|tempered glass/i.test(classification)) kinds.push('screen-protectors');
  return kinds;
}
export function indexPhoneProduct(product) {
  const attrs = attributes(product);
  const type = clean(product.productType);
  const title = catalogDisplayTitle(clean(product.title));
  const kinds = phoneProductKinds(product);
  const compatible = parts(attrs['Compatible with']);
  const facets = Object.fromEntries(PHONE_FACETS.map((key) => [key, parts(attrs[key])]));
  facets.Brand = [...new Set([...facets.Brand, ...parts(product.vendor)].filter((x) => !/^seine\s?shop$/i.test(x)))];
  facets.Manufacturer = compatible.filter((x) => x === 'Apple');
  facets.Model = compatible.filter((x) => x !== 'Apple');
  facets.Color = [...new Set([...facets.Color, ...(product.options || []).filter((o) => /^(colou?r)$/i.test(o.name)).flatMap((o) => o.values)].map(catalogColorLabel).filter(Boolean))];
  facets['Estimated Lead Time'] = parts(product.leadTime?.value);
  facets['Product Tags'] = PHONE_TAGS.filter((tag) => (product.tags || []).some((v) => v.toLowerCase() === tag.toLowerCase() || (tag === 'Best Sellers' && v === 'seineshop-best-sellers')));
  const search = [title, product.vendor, type, ...Object.values(facets).flat()].join(' ').toLowerCase();
  return {id: product.id, kinds, facets, search, topics: [...TOPICS].filter(([, rule]) => rule.test(search)).map(([topic]) => topic), price: Number(product.priceRange.minVariantPrice.amount), created: product.createdAt};
}
export function browsePhone(index, category, params, bestSellerIds = []) {
  const sort = ['featured', 'price-asc', 'price-desc', 'newest', 'best-selling'].includes(params.get('sort')) ? params.get('sort') : 'featured';
  const size = [40, 60, 80].includes(Number(params.get('size'))) ? Number(params.get('size')) : 80;
  const active = Object.fromEntries(PHONE_FACETS.map((key) => [key, [...new Set(params.getAll(`filter.${key}`).slice(0, 20).map((label) => key === 'Color' ? catalogColorLabel(label) : label))]]).filter(([, values]) => values.length));
  const q = clean(params.get('q')).slice(0, 120);
  const topic = category?.topics.includes(params.get('topic')) ? params.get('topic') : '';
  const getPrice = (key) => {const raw = clean(params.get(key)); return raw && Number.isFinite(Number(raw)) && Number(raw) >= 0 ? Number(raw) : null;};
  let min = getPrice('min'), max = getPrice('max');
  if (min !== null && max !== null && min > max) [min, max] = [max, min];
  const selectedCategories = category ? [] : PHONE_CATEGORIES.map(({key}) => key).filter((key) => params.getAll('filter.category').includes(key));
  const categoryItems = index.filter((p) => category ? p.kinds.includes(category.key) : !selectedCategories.length || selectedCategories.some((key) => p.kinds.includes(key)));
  const base = categoryItems.filter((p) => (!topic || p.topics.includes(topic)) && q.toLowerCase().split(/\s+/).every((term) => p.search.includes(term)) && (min === null || p.price >= min) && (max === null || p.price <= max));
  const matches = (p, except) => Object.entries(active).every(([key, values]) => key === except || values.some((label) => p.facets[key].includes(label)));
  const facets = PHONE_FACETS.map((key) => {
    const counts = new Map((active[key] || []).map((v) => [v, 0]));
    for (const p of base) if (matches(p, key)) for (const v of new Set(p.facets[key])) counts.set(v, (counts.get(v) || 0) + 1);
    return {key, values: key === 'Product Tags' ? PHONE_TAGS.map((tag) => [tag, counts.get(tag) || 0]) : [...counts].sort(([a],[b]) => a.localeCompare(b, undefined, {numeric: true}))};
  });
  const result = base.filter((p) => matches(p));
  const bestRank = new Map(bestSellerIds.map((id, rank) => [id, rank]));
  if (sort === 'price-asc') result.sort((a,b) => a.price - b.price);
  if (sort === 'price-desc') result.sort((a,b) => b.price - a.price);
  if (sort === 'newest') result.sort((a,b) => clean(b.created).localeCompare(clean(a.created)));
  if (sort === 'best-selling') result.sort((a,b) => (bestRank.get(a.id) ?? Infinity) - (bestRank.get(b.id) ?? Infinity));
  const pages = Math.max(1, Math.ceil(result.length / size));
  const page = Math.min(pages, Math.max(1, Number.parseInt(params.get('page') || '1',10) || 1));
  return {selectedCategories, bestSellerIds: result.slice((page - 1) * size, page * size).filter((p) => p.facets['Product Tags'].includes('Best Sellers')).map((p) => p.id), ids: result.slice((page - 1) * size, page * size).map((p) => p.id), count: result.length, counts: PHONE_CATEGORIES.map(({key}) => index.filter((p) => p.kinds.includes(key)).length), facets, sort, size, page, pages, active, q, min, max, topic, view: params.get('view') === 'list' ? 'list' : 'grid'};
}
