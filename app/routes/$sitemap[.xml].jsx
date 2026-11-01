import {resourceLoader} from '~/lib/sitemaps.server';
export function loader(args) {
  const match = /^sitemap\.(en|ja|de)\.([a-z-]+-[1-9]\d*)$/.exec(args.params.sitemap || '');
  if (!match) throw new Response('Sitemap not found', {status: 404});
  return resourceLoader({...args, params: {language: match[1], resource: match[2]}});
}
