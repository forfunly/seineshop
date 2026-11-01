import {useLocale} from '~/lib/i18n';
import {Link} from 'react-router';
import {blogTags} from '~/lib/journal';
import {Image} from '@shopify/hydrogen';
export function JournalIndex({
  articles,
  blog: suppliedBlog,
  tags: suppliedTags,
  activeTag,
}) {
  const {t, localize} = useLocale();
  const blog = suppliedBlog || articles[0]?.blog;
  const tags = suppliedTags || blogTags(blog?.handle);
  return (
    <section className="journal-index">
      <p className="eyebrow">{t('THE SEINESHOP JOURNAL')}</p>
      <h1>
        {t(
          activeTag
            ? `${activeTag.title} guides & comparisons`
            : blog?.title || 'Good tech. Thoughtful choices.',
        )}
      </h1>
      <p className="journal-deck">
        {t(
          activeTag?.description ||
            'Accessory comparisons and practical guides, with the details that matter before you choose.',
        )}
      </p>
      {blog && (
        <nav className="journal-tags" aria-label={t('Blog topics')}>
          <Link
            to={localize(activeTag ? '/blogs' : `/blogs/${blog.handle}`)}
            aria-current={!activeTag ? 'page' : undefined}
          >
            {t('All articles')}
          </Link>
          {tags.map((tag) => (
            <Link
              key={tag.handle}
              to={localize(`/blogs/tag/${tag.handle}`)}
              aria-current={
                activeTag?.handle === tag.handle ? 'page' : undefined
              }
            >
              {t(tag.title)}
            </Link>
          ))}
        </nav>
      )}
      <div className="journal-index-grid">
        {articles.map((a) => (
          <article key={a.handle}>
            <Link to={localize(`/blog/${a.handle}`)}>
              <Image
                data={a.image}
                sizes="(min-width: 760px) 400px, 90vw"
                loading="eager"
              />
              <div>
                <p className="eyebrow">
                  {t('CASE COMPARISON \xB7')}
                  {t(a.readTime)}
                </p>
                <h2>{t(a.title)}</h2>
                <p>{t(a.excerpt)}</p>
                <span>{t('Read the guide \u2192')}</span>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
