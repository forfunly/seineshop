import {redirect} from 'react-router';
import {sitemapPath} from '~/lib/sitemaps.server';
export function loader({params}) {
  const types = {
    products: 'products',
    collections: 'collections',
    pages: 'pages',
    articles: 'articles',
    blogs: 'blog-collections',
  };
  if (!types[params.type] || !/^[1-9]\d*$/.test(params.page || ''))
    throw new Response('Not found', {status: 404});
  return redirect(sitemapPath(types[params.type], Number(params.page)), 301);
}
