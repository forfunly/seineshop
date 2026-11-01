/* eslint-disable jsx-a11y/no-noninteractive-tabindex -- The comparison region must support keyboard scrolling. */
import {useEffect, useRef, useState} from 'react';
import {Link} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import {useLocale} from '~/lib/i18n';
import '~/styles/journal.css';

export function JournalArticle({article, products = {}}) {
  const {locale, t, localize} = useLocale();
  const articleRef = useRef(null);
  const [active, setActive] = useState('verdict');
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState(0);
  const date = (value) =>
    new Date(value).toLocaleDateString(locale.code, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    });
  const picks = article.recommendations || [];
  const sections = article.sections || [];
  const contents = [
    ...sections.slice(0, 2),
    {id: 'comparison', title: 'Compare at a glance'},
    {id: 'recommendations', title: 'Three cases, up close'},
    ...sections.slice(2),
    {id: 'questions', title: 'Frequently asked questions'},
    {id: 'editorial-team', title: 'How we made this guide'},
  ];
  useEffect(() => {
    const node = articleRef.current;
    if (!node) return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = node.getBoundingClientRect();
        setProgress(
          Math.max(
            0,
            Math.min(
              1,
              -rect.top / Math.max(1, rect.height - window.innerHeight),
            ),
          ),
        );
        const headings = [
          ...node.querySelectorAll('.journal-body > section[id]'),
        ];
        const current = headings
          .filter((heading) => heading.getBoundingClientRect().top <= 240)
          .pop();
        setActive(current?.id || 'verdict');
      });
    };
    update();
    window.addEventListener('scroll', update, {passive: true});
    window.addEventListener('resize', update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [article.handle]);
  async function copyLink() {
    try {
      const canonical = document
        .querySelector('link[rel="canonical"]')
        ?.getAttribute('href');
      await navigator.clipboard.writeText(
        canonical || `${window.location.origin}${window.location.pathname}`,
      );
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }
  const tocLinks = contents.map((s, i) => (
    <a
      key={s.id}
      href={`#${s.id}`}
      aria-current={active === s.id ? 'location' : undefined}
    >
      <span>{String(i + 1).padStart(2, '0')}</span>
      {t(s.title)}
    </a>
  ));
  return (
    <article className="journal-article journal-guide" ref={articleRef}>
      <div
        className="journal-reading-progress"
        style={{transform: `scaleX(${progress})`}}
        aria-hidden="true"
      />
      <nav className="journal-breadcrumb" aria-label={t('Breadcrumb')}>
        <Link to={localize('/')}>{t('Home')}</Link>
        <span>/</span>
        <Link to={localize(`/blogs/${article.blog.handle}`)}>
          {t(article.blog.title)}
        </Link>
        <span>/</span>
        <span>{t('Case buying guide')}</span>
      </nav>
      <header className="journal-hero">
        <div>
          <p className="eyebrow">
            {t('THE SEINESHOP JOURNAL · BUYING GUIDES')}
          </p>
          <h1>{t(article.title)}</h1>
          <p className="journal-deck">{t(article.excerpt)}</p>
          <div className="journal-byline">
            <a href="#editorial-team">
              {t(article.author?.name || 'SeineShop Editorial')}
            </a>
            <span>{t(article.readTime)}</span>
          </div>
          <div className="journal-dates">
            <span>
              {t('Published')}{' '}
              <time dateTime={article.publishedAt}>
                {date(article.publishedAt)}
              </time>
            </span>
            <span>
              {t('Updated')}{' '}
              <time dateTime={article.updatedAt || article.publishedAt}>
                {date(article.updatedAt || article.publishedAt)}
              </time>
            </span>
          </div>
          <div className="journal-hero-actions">
            <a className="journal-button" href="#comparison">
              {t('Compare the cases')} ↓
            </a>
            <button type="button" onClick={copyLink}>
              {t(copied ? 'Link copied' : 'Copy article link')}
            </button>
            <span className="sr-only" role="status">
              {copied ? t('Article link copied to clipboard') : ''}
            </span>
          </div>
        </div>
        <figure className="journal-cover">
          <div className="journal-cover-main">
            <span className="journal-cover-label">
              {t('Find your everyday fit')}
            </span>
            <Image
              data={article.image}
              alt={t('Orange kickstand case with sliding camera cover')}
              sizes="(min-width: 900px) 350px, 75vw"
              loading="eager"
            />
          </div>
          <div className="journal-cover-strip">
            {picks.slice(1).map((p) => (
              <a href={`#${p.id}`} key={p.id}>
                <Image
                  data={p.image}
                  alt={t(p.name)}
                  sizes="80px"
                  style={{width: 64, height: 64}}
                  loading="eager"
                />
                <span>
                  {t(p.id === 'clear' ? 'Keep it clear' : 'Carry more')} ↗
                </span>
              </a>
            ))}
          </div>
          <figcaption>
            {t('Catalog photography · specification-based comparison')}
          </figcaption>
        </figure>
      </header>
      <div
        className="journal-quick-picks"
        aria-label={t('Find a case for your routine')}
      >
        {picks.map((p, i) => (
          <a key={p.id} href={`#${p.id}`}>
            <span className="journal-quick-number">0{i + 1}</span>
            <div>
              <span>{t(p.label)}</span>
              <strong>
                {t(
                  p.id === 'clear'
                    ? 'Clear TPU'
                    : p.id === 'wallet'
                      ? 'Detachable wallet'
                      : 'Magnetic kickstand',
                )}
              </strong>
            </div>
            <span aria-hidden="true">↗</span>
          </a>
        ))}
      </div>
      <div className="journal-layout">
        <div className="journal-sidebar">
          <nav className="journal-toc" aria-label={t('In this article')}>
            <p className="eyebrow">{t('YOUR READING GUIDE')}</p>
            <h2>{t('In this article')}</h2>
            {tocLinks}
            <Link
              className="journal-toc-shop"
              to={localize('/collections/iphone-18-pro-max')}
            >
              {t('Shop the collection')} ↗
            </Link>
          </nav>
        </div>
        <div className="journal-body">
          <details className="journal-mobile-toc">
            <summary>{t('In this article')}</summary>
            <nav aria-label={t('Article contents')}>{tocLinks}</nav>
          </details>
          {sections.slice(0, 2).map((s) => (
            <Section key={s.id} section={s} />
          ))}
          <section id="comparison">
            <p className="eyebrow">{t('THREE DESIGNS, THREE PRIORITIES')}</p>
            <h2>{t('Compare at a glance')}</h2>
            {/* Keyboard focus makes the comparison horizontally scrollable on small screens. */}
            <div
              className="journal-table-scroll"
              role="region"
              aria-label={t('Case comparison table')}
              tabIndex={0}
            >
              <table>
                <caption>
                  {t(
                    'Listed features. Prices follow your selected shopping country.',
                  )}
                </caption>
                <thead>
                  <tr>
                    {[
                      'Case',
                      'Materials',
                      'Best suited to',
                      'Current price',
                    ].map((label) => (
                      <th scope="col" key={label}>
                        {t(label)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {picks.map((p) => (
                    <tr key={p.id}>
                      <th scope="row">
                        <a href={`#${p.id}`}>{t(p.name)}</a>
                      </th>
                      <td>{t(p.material)}</td>
                      <td>{t(p.label)}</td>
                      <td>
                        <CasePrice product={products[p.handle]} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="journal-small-note">
              {t(
                'Prices can change. Confirm the selected variant and dispatch timing on the product page.',
              )}
            </p>
          </section>
          <section id="recommendations">
            <p className="eyebrow">{t('THE SHORTLIST')}</p>
            <h2>{t('Three cases, up close')}</h2>
            <p>
              {t(
                'Start with how you use your phone, then compare the features and compromises of each design.',
              )}
            </p>
            {picks.map((p, i) => (
              <section className="journal-pick" id={p.id} key={p.sku}>
                <div className="journal-pick-intro">
                  <a
                    href={
                      products[p.handle]
                        ? localize(`/products/${p.handle}`)
                        : `#${p.id}`
                    }
                    aria-label={t(p.name)}
                  >
                    <Image
                      data={p.image}
                      alt={`${t(p.name)}, ${t(p.finish)}`}
                      sizes="(min-width: 760px) 230px, 75vw"
                      loading="lazy"
                    />
                  </a>
                  <div>
                    <p className="eyebrow">
                      0{i + 1} / {t(p.label)}
                    </p>
                    <h3>{t(p.name)}</h3>
                    <p>{t(p.summary)}</p>
                    <dl>
                      {[
                        ['Material', p.material],
                        ['Finish', p.finish],
                        ['SKU', p.sku],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <dt>{t(label)}</dt>
                          <dd>{t(value)}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>
                <div className="journal-pick-details">
                  <div>
                    <h4>{t('Why shortlist it')}</h4>
                    <p>{t(p.pros)}</p>
                  </div>
                  <div>
                    <h4>{t('The trade-off')}</h4>
                    <p>{t(p.tradeoff)}</p>
                  </div>
                </div>
                <div className="journal-fit-note">
                  <strong>{t('Check before buying')}</strong>
                  <p>{t(p.check)}</p>
                </div>
                <div className="journal-pick-action">
                  <div>
                    <span className="journal-price-label">
                      {t('Current price')}
                    </span>
                    <CasePrice product={products[p.handle]} />
                  </div>
                  {products[p.handle] ? (
                    <Link
                      className="journal-button"
                      to={localize(`/products/${p.handle}`)}
                    >
                      {t('View this case')} ↗
                    </Link>
                  ) : (
                    <a
                      className="journal-button"
                      href={`mailto:steven@seineshop.com?subject=${encodeURIComponent(`Case enquiry: ${p.sku}`)}`}
                    >
                      {t('Ask about this case')} ↗
                    </a>
                  )}
                </div>
              </section>
            ))}
          </section>
          {sections.slice(2).map((s) => (
            <Section key={s.id} section={s} />
          ))}
          <section className="journal-collection-cta">
            <p className="eyebrow">{t('MAKE IT YOUR EVERYDAY')}</p>
            <h2>{t('Explore more ways to carry your phone')}</h2>
            <p>
              {t(
                'Browse the full collection and compare the exact model, finish and features for your setup.',
              )}
            </p>
            <Link
              className="journal-button"
              to={localize('/collections/iphone-18-pro-max')}
            >
              {t('Shop iPhone 18 Pro Max accessories')} ↗
            </Link>
          </section>
          <section id="questions">
            <h2>{t('Frequently asked questions')}</h2>
            {article.faqs?.map((f) => (
              <details className="journal-faq" key={f.question}>
                <summary>
                  <h3>{t(f.question)}</h3>
                </summary>
                <p>{t(f.answer)}</p>
              </details>
            ))}
          </section>
          <section className="journal-method" id="editorial-team">
            <p className="eyebrow">{t('SEINESHOP EDITORIAL')}</p>
            <h2>{t('How we made this guide')}</h2>
            <p>
              {t(
                'Our store team compared catalog specifications and product photographs for the three SKUs shown above. We sell these products and may benefit from purchases. This is a specification-based buying guide, without physical review units, laboratory testing or customer rating data.',
              )}
            </p>
            <p>
              {t(
                'This update adds a feature comparison, charging checks and a pre-purchase checklist. Prices are supplied by our live catalog; they are not fixed editorial quotations.',
              )}
            </p>
            <p>
              {t('For help identifying your phone, see')}{' '}
              <a
                href="https://support.apple.com/en-us/108044"
                rel="noopener noreferrer"
              >
                {t('Apple’s model-identification guide')}
              </a>
              . {t('For SKU-specific fit or dispatch questions, contact')}{' '}
              <a href="mailto:steven@seineshop.com">steven@seineshop.com</a>.
            </p>
          </section>
          <nav
            className="journal-related"
            aria-label={t('More from SeineShop')}
          >
            <h2>{t('Keep exploring')}</h2>
            <Link to={localize('/blogs/tag/iphone-18')}>
              {t('More iPhone buying guides')} ↗
            </Link>
            <Link to={localize('/policies/refund-policy')}>
              {t('Read our return policy')} ↗
            </Link>
            <Link to={localize('/support')}>{t('Get help choosing')} ↗</Link>
          </nav>
        </div>
      </div>
    </article>
  );
}
function CasePrice({product}) {
  const {t} = useLocale();
  const price = product?.priceRange?.minVariantPrice;
  return price ? (
    <span className="journal-live-price">
      {t('From')} <Money data={price} />
    </span>
  ) : (
    <span>{t('See product page')}</span>
  );
}
function Section({section}) {
  const {t} = useLocale();
  return (
    <section id={section.id}>
      <h2>{t(section.title)}</h2>
      {section.paragraphs.map((p) => (
        <p key={p}>{t(p)}</p>
      ))}
      {section.bullets && (
        <ul className="journal-checklist">
          {section.bullets.map((item) => (
            <li key={item}>{t(item)}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* eslint-enable jsx-a11y/no-noninteractive-tabindex */
