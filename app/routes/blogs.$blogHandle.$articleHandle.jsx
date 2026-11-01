import {redirect} from 'react-router';
import {blogArticles, blogTags} from '~/lib/journal';

export function loader({params, request}) {
  const {blogHandle, articleHandle} = params;
  const articles = blogArticles(blogHandle);
  const article = articles.find((item) => item.handle === articleHandle);
  if (article) {
    const url = new URL(request.url);
    return redirect(`/blog/${article.handle}${url.search}`, 301);
  }
  const tag = blogTags(blogHandle).find(
    (item) => item.handle === articleHandle,
  );
  if (!tag) throw new Response('Not found', {status: 404});
  return redirect(
    `/blogs/tag/${tag.handle}${new URL(request.url).search}`,
    301,
  );
}
