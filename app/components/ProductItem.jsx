import {useLocale} from '~/lib/i18n';
import {Link} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import {urlWithTrackingParams} from '~/lib/search';
import {useVariantUrl} from '~/lib/variants';

/**
 * @param {{
 *   product:
 *     | CollectionItemFragment
 *     | ProductItemFragment
 *     | RecommendedProductFragment;
 *   searchTerm?: string;
 *   loading?: 'eager' | 'lazy';
 * }}
 */
export function ProductItem({product, loading, searchTerm}) {
  const {t, localize} = useLocale();
  const variantUrl = useVariantUrl(product.handle);
  const image = product.featuredImage;
  return (
    <Link
      className="product-item"
      key={product.id}
      prefetch="intent"
      to={localize(
        searchTerm !== undefined
          ? urlWithTrackingParams({
              baseUrl: variantUrl,
              trackingParams: product.trackingParameters,
              term: searchTerm,
            })
          : variantUrl,
      )}
    >
      {image && (
        <Image
          alt={t(image.altText || product.title)}
          aspectRatio="1/1"
          data={image}
          loading={loading}
          sizes="(min-width: 45em) 400px, 100vw"
        />
      )}
      <h4>{t(product.title)}</h4>
      <small>
        <Money data={product.priceRange.minVariantPrice} />
      </small>
    </Link>
  );
}

/** @typedef {import('storefrontapi.generated').ProductItemFragment} ProductItemFragment */
/** @typedef {import('storefrontapi.generated').CollectionItemFragment} CollectionItemFragment */
/** @typedef {import('storefrontapi.generated').RecommendedProductFragment} RecommendedProductFragment */
