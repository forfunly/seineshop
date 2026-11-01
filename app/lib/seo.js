import {journalPaths} from './journal.js';
export function siteSettings(env, requestUrl) {
  const request = new URL(requestUrl);
  let origin = request.origin;
  if (env.PUBLIC_SITE_URL) {
    const configured = new URL(env.PUBLIC_SITE_URL);
    if (configured.protocol !== 'https:')
      throw new Error('PUBLIC_SITE_URL must use HTTPS');
    origin = configured.origin;
  }
  const productionOrigin =
    Boolean(env.PUBLIC_SITE_URL) &&
    origin === request.origin &&
    request.protocol === 'https:';
  return {
    origin,
    journalIndexable:
      productionOrigin && env.PUBLIC_JOURNAL_INDEXABLE === 'true',
    indexable:
      Boolean(env.PUBLIC_SITE_URL) &&
      env.PUBLIC_INDEXABLE === 'true' &&
      origin === request.origin &&
      request.protocol === 'https:',
  };
}

export function canonicalUrl(origin, pathname, search = '') {
  const url = new URL(pathname, origin);
  const params = new URLSearchParams(search);
  // Each pagination URL is self-canonical. Tracking and sort/filter parameters are omitted.
  for (const key of ['page', 'cursor', 'direction']) {
    const value = params.get(key);
    if (value && !(key === 'page' && value === '1'))
      url.searchParams.set(key, value);
  }
  return url.href;
}

export function plainText(value = '') {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function jsonLd(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export function pageTitle(value, page) {
  const base = value.replace(/\s*\|\s*SeineShop$/i, '');
  const suffix = page && page !== '1' ? ` — Page ${page}` : '';
  return `${base}${suffix}${base === 'SeineShop' ? '' : ' | SeineShop'}`;
}

export function isJournalPath(pathname) {
  return journalPaths().includes(pathname);
}

/** Shorten at a word boundary, keeping readable search snippets. */
export function searchSnippet(value, limit = 160) {
  const text = plainText(value);
  if (text.length <= limit) return text;
  const candidate = text.slice(0, limit - 1);
  const boundary = candidate.lastIndexOf(' ');
  return `${candidate.slice(0, boundary > limit * 0.65 ? boundary : candidate.length).replace(/[.,;:\s-]+$/, '')}…`;
}

export function commerceMetadata(content, kind) {
  const name = plainText(content.title || '');
  const customTitle = plainText(content.seo?.title || '');
  const customDescription = plainText(content.seo?.description || '');
  const title = searchSnippet(customTitle || name, 85);
  if (kind === 'product') {
    const shortName = searchSnippet(name, 95);
    return {
      title,
      description: customDescription && customDescription.length <= 165
        ? customDescription
        : `${shortName} Shop online at SeineShop. View specifications or ask about bulk orders.`,
    };
  }
  return {
    title: customTitle || `${name} - Shop & Bulk Orders`,
    description: customDescription && customDescription.length <= 165
      ? customDescription
      : `Shop ${searchSnippet(name, 65)} at SeineShop. Compare prices, materials and compatibility. Order online or contact us for wholesale and customization inquiries.`,
  };
}
