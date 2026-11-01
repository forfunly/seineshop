import {useLocale} from '~/lib/i18n';
import journal from '~/data/journal.json';
import {LatestArticles} from '~/components/LatestArticles';
import {useLoaderData, Link} from 'react-router';
import {FeaturedProducts} from '~/components/FeaturedProducts';
import {categories} from '~/data/navigation';
export async function loader({context}) {
  const {collection} = await context.storefront.query(HOME_FEATURED_QUERY);
  const featuredProducts = [...(collection?.products.nodes || [])];
  featuredProducts.sort(
    (a, b) =>
      Number(b.handle === 'b-20a-3-in-1-foldable-wireless-charging-station') -
      Number(a.handle === 'b-20a-3-in-1-foldable-wireless-charging-station'),
  );
  const latestArticles = journal
    .filter((article) => Date.parse(article.publishedAt) <= Date.now())
    .slice()
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .slice(0, 3)
    .map(({handle, title, excerpt, image, publishedAt, readTime}) => ({
      handle,
      title,
      excerpt,
      image,
      publishedAt,
      readTime,
    }));
  return {
    featuredProducts,
    latestArticles,
  };
}
export default function Homepage() {
  const {t, localize} = useLocale();
  /** @type {LoaderReturnData} */
  const data = useLoaderData();
  return (
    <div className="home marketplace-home">
      <div className="market-intro">
        <nav className="category-rail" aria-label={t('Shop by category')}>
          <h2>{t('Shop by category')}</h2>
          {categories.map((category) => (
            <details key={category.title}>
              <summary>
                <span>{t(category.icon)}</span>
                {t(category.title)}
                <b>›</b>
              </summary>
              <div>
                {category.links.map(([title, url]) => (
                  <Link key={title} to={localize(url)}>
                    {t(title)}
                  </Link>
                ))}
              </div>
            </details>
          ))}
        </nav>
        <section className="market-hero">
          <div>
            <p className="eyebrow">{t('THE EVERYDAY TECH EDIT')}</p>
            <h1>
              {t('Small upgrades.')}
              <br />
              <em>{t('Better every day.')}</em>
            </h1>
            <p>
              {t(
                'Explore phone accessories, useful hardware and a simpler way to charge.',
              )}
            </p>
            <Link
              className="seine-button"
              to={localize('/collections/iphone-18-pro-max')}
            >
              {t('Explore phone accessories \u2197')}
            </Link>
            <span className="hero-caption">
              {t('Made for your pocket. Ready for your day.')}
            </span>
          </div>
          <img
            src="/images/b20a-black.webp"
            alt={t('B-20A three-device foldable charging station in black')}
            width="800"
            height="800"
            fetchPriority="high"
          />
        </section>
        <div className="market-features">
          <Link to={localize('/collections/iphone-18-pro-max')}>
            <span>{t('FIND YOUR FIT')}</span>
            <h2>
              {t('iPhone 18')}
              <br />
              {t('Pro Max')}
            </h2>
            <p>{t('Cases & protection \u2192')}</p>
            <b className="device-art" aria-hidden="true">
              18
            </b>
          </Link>
          <Link to={localize('/discover/b20a')}>
            <span>{t('THE CHARGING EDIT')}</span>
            <h2>
              {t('One place.')}
              <br />
              {t('Three devices.')}
            </h2>
            <p>{t('Discover B-20A \u2192')}</p>
          </Link>
        </div>
      </div>
      <section className="market-guide" aria-label={t('Shopping guide')}>
        <div>
          <b>{t('Find your device')}</b>
          <span>{t('Browse by model and accessory')}</span>
        </div>
        <div>
          <b>{t('Compare the details')}</b>
          <span>{t('Materials, features and compatibility')}</span>
        </div>
        <div>
          <b>{t('Choose your finish')}</b>
          <span>{t('Discover colors for your everyday carry')}</span>
        </div>
        <div>
          <b>{t('Need a hand?')}</b>
          <a href={localize('mailto:hello@seineshop.com')}>
            {t('Talk to SeineShop \u2192')}
          </a>
        </div>
      </section>
      <FeaturedProducts products={data.featuredProducts} />
      <section className="market-category-section">
        <div className="market-section-heading">
          <div>
            <p className="eyebrow">{t('START WITH THE ESSENTIALS')}</p>
            <h2>{t('Explore by category')}</h2>
          </div>
          <Link to={localize('/collections')}>
            {t('All collections \u2192')}
          </Link>
        </div>
        <div className="market-category-grid">
          {categories.slice(0, 6).map((category) => (
            <Link key={category.title} to={localize(category.links[0][1])}>
              <span aria-hidden="true">{t(category.icon)}</span>
              <h3>{t(category.title)}</h3>
              <small>{t('Explore \u2192')}</small>
            </Link>
          ))}
        </div>
      </section>
      <section className="market-editorial">
        <div>
          <p className="eyebrow">{t('LESS CLUTTER. MORE POSSIBILITY.')}</p>
          <h2>
            {t('A smarter spot')}
            <br />
            {t('for your everyday tech.')}
          </h2>
          <p>
            {t(
              'Meet a foldable charging station for a compatible phone, earbuds and Galaxy Watch.',
            )}
          </p>
          <Link className="seine-button" to={localize('/discover/b20a')}>
            {t('Discover the charging edit \u2197')}
          </Link>
        </div>
        <img
          src="/images/b20a-white.webp"
          alt={t('White B-20A foldable charging station')}
          width="800"
          height="800"
          loading="lazy"
        />
      </section>
      <section className="seine-contact">
        <h2>{t('Good tech. Clear answers.')}</h2>
        <Link to={localize('/support')}>
          {t('Visit our support center \u2197')}
        </Link>
      </section>
      <LatestArticles articles={data.latestArticles} />
    </div>
  );
}
const HOME_FEATURED_QUERY = `#graphql
 query HomeFeatured($country: CountryCode, $language: LanguageCode)
 @inContext(country: $country, language: $language) {
  collection(handle: "frontpage") {
   products(first: 4) { nodes {
    id title handle availableForSale
    priceRange { minVariantPrice { amount currencyCode } }
    featuredImage { id url altText width height }
   } }
  }
 }
`;
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
