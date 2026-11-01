import {siteSettings} from '~/lib/seo';
export function loader({request, context}) {
  const settings = siteSettings(context.env, request.url);
  // Allow crawling of noindex routes so crawlers can observe the directive.
  const body =
    settings.indexable || settings.journalIndexable
      ? `User-agent: *\nDisallow: /account/\nDisallow: /checkout\nSitemap: ${settings.origin}/sitemap.xml\n`
      : 'User-agent: *\nDisallow: /\n';
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
