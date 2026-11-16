// Restore TLS metadata only for Shopify's official local development proxy.
// Never trust arbitrary forwarded headers in production.
export function developmentRequest(request, development = false) {
  const url = new URL(request.url);
  if (development !== true || url.protocol !== 'http:' || url.port ||
    !/^[a-z0-9-]+\.tryhydrogen\.dev$/.test(url.hostname) ||
    request.headers.get('x-forwarded-proto') !== 'https') return request;
  url.protocol = 'https:';
  return new Request(url, request);
}
