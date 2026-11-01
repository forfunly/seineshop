import {useLocale} from '~/lib/i18n';
import {Link} from 'react-router';
import {Image} from '@shopify/hydrogen';
export function LatestArticles({articles}) {
  const {locale, t, localize} = useLocale();
  if (!articles.length) return null;
  return (
    <section className="home-journal" aria-labelledby="latest-articles">
      <div className="market-section-heading">
        <div>
          <p className="eyebrow">{t('FROM THE SEINESHOP JOURNAL')}</p>
          <h2 id="latest-articles">{t('Latest stories & guides')}</h2>
        </div>
        <Link to={localize('/blogs')}>{t('View all articles \u2192')}</Link>
      </div>
      <div
        className={`home-journal-grid${articles.length === 1 ? ' home-journal-single' : ''}`}
      >
        {articles.map((article) => (
          <article className="home-journal-card" key={article.handle}>
            <Link
              className="home-journal-image"
              to={localize(`/blog/${article.handle}`)}
              aria-label={t(`Read ${article.title}`)}
            >
              <Image
                data={article.image}
                alt={t(article.image?.altText || article.title)}
                loading="lazy"
                sizes="(min-width: 900px) 400px, (min-width: 600px) 50vw, 90vw"
              />
            </Link>
            <div className="home-journal-copy">
              <p className="home-journal-meta">
                <time dateTime={article.publishedAt}>
                  {new Intl.DateTimeFormat(locale.code, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    timeZone: 'UTC',
                  }).format(new Date(article.publishedAt))}
                </time>
                {article.readTime && <span> · {t(article.readTime)}</span>}
              </p>
              <h3>
                <Link to={localize(`/blog/${article.handle}`)}>
                  {t(article.title)}
                </Link>
              </h3>
              <p>{t(article.excerpt)}</p>
              <Link
                className="home-journal-read"
                to={localize(`/blog/${article.handle}`)}
              >
                {t('Read article \u2192')}
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
