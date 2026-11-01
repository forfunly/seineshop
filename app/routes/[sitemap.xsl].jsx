import stylesheet from '~/assets/sitemap.xsl?raw';
export function loader() {
  return new Response(stylesheet, {
    headers: {
      'Content-Type': 'application/xslt+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
