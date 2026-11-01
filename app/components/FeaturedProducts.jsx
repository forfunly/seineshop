import {useLocale} from '~/lib/i18n';
import {Link} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
export function FeaturedProducts({
  products,
  title = 'The SeineShop edit',
  eyebrow = 'OUR FEATURED PICKS',
  id = 'featured-products',
}) {
  const {t, localize} = useLocale();
  if (!products?.length) return null;
  return (
    <section className="featured-edit" aria-labelledby={id}>
      <div className="market-section-heading">
        <div>
          <p className="eyebrow">{t(eyebrow)}</p>
          <h2 id={id}>{t(title)}</h2>
        </div>
        <Link to={localize('/collections/frontpage')}>
          {t('Explore the edit \u2192')}
        </Link>
      </div>
      <p className="featured-intro">
        {t(
          'Everyday charging and phone protection. Explore the details and find your fit.',
        )}
      </p>
      <div className="featured-edit-grid">
        {products.map((product, i) => (
          <article className="featured-edit-card" key={product.id}>
            <Link
              to={localize(`/products/${product.handle}`)}
              prefetch="intent"
              className="featured-edit-image"
            >
              {product.featuredImage && (
                <Image
                  data={product.featuredImage}
                  alt={t(product.featuredImage.altText || product.title)}
                  sizes="(min-width: 1100px) 25vw, (min-width: 600px) 50vw, 90vw"
                  loading="lazy"
                />
              )}
              <span className="featured-rank">0{i + 1}</span>
            </Link>
            <div className="featured-edit-copy">
              <p className="eyebrow">
                {t(
                  product.handle.includes('b-20a')
                    ? 'CHARGING ESSENTIAL'
                    : 'PHONE PROTECTION',
                )}
              </p>
              <h3>
                <Link to={localize(`/products/${product.handle}`)}>
                  {t(product.title)}
                </Link>
              </h3>
              <div className="featured-edit-price">
                <Money data={product.priceRange.minVariantPrice} />
                <span>
                  {t(product.availableForSale ? 'Available' : 'Sold out')}
                </span>
              </div>
              <Link
                className="featured-detail-link"
                to={localize(`/products/${product.handle}`)}
              >
                {t('View product \u2192')}
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
