import {useLoaderData} from 'react-router';
import {articlesByTag, blogTags} from '~/lib/journal';
import {JournalIndex} from '~/components/JournalIndex';

export function loader({params}) {
  const tags = blogTags();
  const tag = tags.find((item) => item.handle === params.tagHandle);
  const articles = articlesByTag(params.tagHandle);
  if (!tag || !articles.length) throw new Response('Not found', {status: 404});
  return {
    articles,
    tag,
    tags,
    blog: {
      title: 'Blog',
      seo: {
        title: `${tag.title} Guides & Comparisons`,
        description: tag.description,
      },
    },
  };
}

export default function BlogTag() {
  const {articles, tag, tags, blog} = useLoaderData();
  return (
    <JournalIndex articles={articles} blog={blog} tags={tags} activeTag={tag} />
  );
}
