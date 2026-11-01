import {LOCALES, localizePath} from './locale.js';
import journal from '../data/journal.json' with {type: 'json'};
import {siteSettings} from './seo.js';

export const SITEMAP_LANGUAGE = 'en';
export const RESOURCE_TYPES = [
  'products',
  'collections',
  'articles',
  'blog-collections',
  'blog-tags',
  'pages',
  'policies',
];
const REMOTE_TYPES = {
  products: 'PRODUCT',
  collections: 'COLLECTION',
  pages: 'PAGE',
};
const STATIC_PAGES = ['/', '/collections', '/support', '/discover/b20a'];
export const escapeXml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
const prefix =
  '<?xml version="1.0" encoding="UTF-8"?>\n<!-- Human-readable sitemap: https://www.seineshop.com/sitemap-view -->\n';
export function xmlResponse(body, enabled = true) {
  return new Response(prefix + body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      ...(!enabled ? {'X-Robots-Tag': 'noindex'} : {}),
    },
  });
}
export function sitemapImageUrl(filepath, shopDomain) {
  if (!filepath) return undefined;
  if (/^https?:\/\//.test(filepath)) return filepath;
  if (filepath.startsWith('//')) return `https:${filepath}`;
  if (!shopDomain || !/^(files|products)\//.test(filepath)) return undefined;
  return `https://${shopDomain.replace(/^https?:\/\//, '').replace(/\/$/, '')}/cdn/shop/${filepath}`;
}
export function urlset(entries, origin) {
  const seen = new Set();
  const unique = entries.filter((entry) => {
    if (seen.has(entry.path)) return false;
    seen.add(entry.path);
    return true;
  });
  return `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${unique.map(({path, updatedAt, image, alternates = []}) => {
    const modified = updatedAt && Number.isFinite(Date.parse(updatedAt))
      ? `\n    <lastmod>${escapeXml(new Date(updatedAt).toISOString())}</lastmod>` : '';
    const imageTag = image && /^https?:\/\//.test(image)
      ? `\n    <image:image><image:loc>${escapeXml(image)}</image:loc></image:image>` : '';
    const links = alternates.map(({language, path: alternatePath}) =>
      `\n    <xhtml:link rel="alternate" hreflang="${escapeXml(language)}" href="${escapeXml(origin + alternatePath)}"/>`,
    ).join('');
    return `  <url>\n    <loc>${escapeXml(origin + path)}</loc>${modified}${imageTag}${links}\n  </url>`;
  }).join('\n')}\n</urlset>`;
}
export function localEntries(type, now = Date.now()) {
  const published = journal.filter((a) => Date.parse(a.publishedAt) <= now);
  if (type === 'articles')
    return published.map((a) => ({
      path: `/blog/${a.handle}`,
      updatedAt: a.updatedAt || a.publishedAt,
    }));
  if (type === 'blog-collections')
    return [
      {path: '/blogs'},
      ...published.map((a) => ({path: `/blogs/${a.blog.handle}`})),
    ];
  if (type === 'blog-tags')
    return published.flatMap((a) =>
      (a.tags || []).map((t) => ({path: `/blogs/tag/${t.handle}`})),
    );
  return [];
}
export const isAllowed = (type, settings) =>
  settings.indexable ||
  (settings.journalIndexable &&
    ['articles', 'blog-collections', 'blog-tags'].includes(type));
export const sitemapPath = (type, page = 1, language = 'en') =>
  `/sitemap.${language}.${type}-${page}.xml`;
export const COUNTS_QUERY = `#graphql
  query SeineSitemapCounts {
    products: sitemap(type: PRODUCT) { pagesCount { count } }
    collections: sitemap(type: COLLECTION) { pagesCount { count } }
    pages: sitemap(type: PAGE) { pagesCount { count } }
  }
`;
export const RESOURCES_QUERY = `#graphql
  query SeineSitemapResources($type: SitemapType!, $page: Int!) {
    sitemap(type: $type) { resources(page: $page) { items { handle updatedAt ... on SitemapResource { image { filepath } } } } }
  }
`;
export const POLICIES_QUERY = `#graphql
  query SeineSitemapPolicies {
    shop {
      privacyPolicy { handle }
      shippingPolicy { handle }
      termsOfService { handle }
      refundPolicy { handle }
      subscriptionPolicy { handle }
    }
  }
`;
export const COLLECTIONS_QUERY = `#graphql
  query SeineSitemapCollections($after: String) {
    collections(first: 250, after: $after) {
      nodes { handle updatedAt products(first: 1) { nodes { id } } }
      pageInfo { hasNextPage endCursor }
    }
  }
`;
async function collectionEntries(storefront) {
  let after = '';
  const entries = [];
  do {
    /** @type {{collections: {nodes: Array<{handle: string, updatedAt: string, products: {nodes: Array<{id: string}>}}>, pageInfo: {hasNextPage: boolean, endCursor: string|null}}}} */
    const result = await storefront.query(COLLECTIONS_QUERY, {
      variables: {after: after || null},
    });
    const collections = result.collections;
    entries.push(
      ...collections.nodes
        .filter((c) => c.products.nodes.length)
        .map((c) => ({
          path: `/collections/${c.handle}`,
          updatedAt: c.updatedAt,
        })),
    );
    after = collections.pageInfo.hasNextPage
      ? collections.pageInfo.endCursor
      : '';
  } while (after);
  return entries;
}
export async function sitemapCounts(storefront, settings) {
  const counts = settings.indexable ? await storefront.query(COUNTS_QUERY) : {};
  if (settings.indexable)
    counts.collections = {
      pagesCount: {
        count: Math.ceil((await collectionEntries(storefront)).length / 1000),
      },
    };
  return Object.fromEntries(
    RESOURCE_TYPES.filter((type) => isAllowed(type, settings)).map((type) => [
      type,
      REMOTE_TYPES[type]
        ? Math.max(
            type === 'pages' ? 1 : 0,
            counts[type]?.pagesCount?.count || 0,
          )
        : 1,
    ]),
  );
}
export async function indexLoader({request, context}) {
  const settings = siteSettings(context.env, request.url);
  const counts = await sitemapCounts(context.storefront, settings);
  const paths = LOCALES.flatMap((locale) =>
    Object.entries(counts).flatMap(([type, count]) =>
      Array.from({length: count}, (_, i) =>
        sitemapPath(type, i + 1, locale.code),
      ),
    ),
  );
  return xmlResponse(
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map((path) => `  <sitemap><loc>${escapeXml(settings.origin + path)}</loc></sitemap>`).join('\n')}\n</sitemapindex>`,
    settings.indexable || settings.journalIndexable,
  );
}
export async function resourceLoader({request, context, params}) {
  const match = /^([a-z-]+)-([1-9]\d*)$/.exec(params.resource || '');
  if (
    !LOCALES.some((locale) => locale.code === params.language) ||
    !match ||
    !RESOURCE_TYPES.includes(match[1])
  )
    throw new Response('Sitemap not found', {status: 404});
  const [, type, pageText] = match;
  const page = Number(pageText);
  const settings = siteSettings(context.env, request.url);
  const counts = await sitemapCounts(context.storefront, settings);
  if (!isAllowed(type, settings) || page > (counts[type] || 0))
    throw new Response('Sitemap not found', {status: 404});
  let entries = localEntries(type);
  if (type === 'collections') {
    entries = (await collectionEntries(context.storefront)).slice((page - 1) * 1000, page * 1000);
  } else if (REMOTE_TYPES[type]) {
    const result = await context.storefront.query(RESOURCES_QUERY, {
      variables: {type: REMOTE_TYPES[type], page},
    });
    entries = (result.sitemap?.resources?.items || []).map((item) => ({
      path: `/${type}/${item.handle}`,
      updatedAt: item.updatedAt,
      image: sitemapImageUrl(item.image?.filepath, context.env.PUBLIC_STORE_DOMAIN),
    }));
    if (type === 'pages' && page === 1)
      entries.unshift(...STATIC_PAGES.map((path) => ({path})));
  }
  if (type === 'policies') {
    const {shop} = await context.storefront.query(POLICIES_QUERY);
    entries = [
      {path: '/policies'},
      ...[
        'privacyPolicy',
        'shippingPolicy',
        'termsOfService',
        'refundPolicy',
        'subscriptionPolicy',
      ]
        .map((key) => shop[key])
        .filter((p) => p?.handle)
        .map((p) => ({path: `/policies/${p.handle}`})),
    ];
  }
  const locale = LOCALES.find((item) => item.code === params.language);
  return xmlResponse(
    urlset(
      entries.map((entry) => ({
        ...entry,
        path: localizePath(entry.path, locale),
        alternates: [
          ...LOCALES.map((language) => ({language: language.code, path: localizePath(entry.path, language)})),
          {language: 'x-default', path: entry.path},
        ],
      })),
      settings.origin,
    ),
  );
}
