/** Optional discovery guide. robots.txt and page metadata remain authoritative. */
export function siteGuide(origin) {
  const link = (path) => new URL(path, origin).href;
  return `# Seine Shop

> Phone accessories, protective cases, screen protection and charging products.

## Shopping

- [Collections](${link('/collections')}): Browse current product collections.
- [iPhone Duo accessories](${link('/collections/iphone-duo')}): Cases, screen protectors and camera lens protectors. Check the exact product and variant specifications before ordering.
- [All products](${link('/collections/all')}): Current product listings with links to individual product pages.

## Product information

Product pages provide descriptions, specifications, variant options, images and current prices. Availability and prices can change; use the current selected variant and checkout for the applicable price, shipping and taxes. Bulk orders and customization require a separate quotation.

## Customer information

- [Support](${link('/support')}): Product compatibility, orders, delivery and contact information.
- [Store policies](${link('/policies')}): Published store policies.

## Discovery

- [XML sitemap](${link('/sitemap.xml')}): Canonical public page URLs.
- [Crawler rules](${link('/robots.txt')}): Crawling directives.

This guide describes public storefront information. It is not an inventory feed or a replacement for the current product pages and published policies.
`;
}

export function siteGuideResponse(settings) {
  return new Response(siteGuide(settings.origin), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      ...(!settings.indexable ? {'X-Robots-Tag': 'noindex'} : {}),
    },
  });
}
