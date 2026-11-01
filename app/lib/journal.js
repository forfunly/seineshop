import journal from '../data/journal.json' with {type: 'json'};

export function blogArticles(handle) {
  return journal.filter((article) => article.blog.handle === handle);
}

export function blogTags(handle = '') {
  const articles = handle ? blogArticles(handle) : journal;
  const tags = new Map();
  for (const article of articles) {
    for (const tag of article.tags || []) {
      if (articles.some((item) => item.handle === tag.handle))
        throw new Error(
          `Blog tag conflicts with article handle: ${tag.handle}`,
        );
      tags.set(tag.handle, tag);
    }
  }
  return [...tags.values()];
}

export function journalPaths() {
  const blogs = [...new Set(journal.map((article) => article.blog.handle))];
  return [
    '/blogs',
    ...blogTags().map((tag) => `/blogs/tag/${tag.handle}`),
    ...blogs.flatMap((handle) => [
      `/blogs/${handle}`,

      ...blogArticles(handle).map((article) => `/blog/${article.handle}`),
    ]),
  ];
}

export function articlesByTag(handle) {
  return journal.filter((article) =>
    article.tags?.some((tag) => tag.handle === handle),
  );
}
