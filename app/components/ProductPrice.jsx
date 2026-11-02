import {useLocale} from '~/lib/i18n';
import {Money} from '@shopify/hydrogen';

/**
 * @param {{
 *   price?: MoneyV2;
 *   compareAtPrice?: MoneyV2 | null;
 * }}
 */
export function ProductPrice({price, compareAtPrice}) {
  const {t} = useLocale();
  return (
    <div aria-label={t('Price')} className="product-price" role="group">
      {t(
        compareAtPrice ? (
          <div className="product-price-on-sale">
            {price ? <Money data={price} /> : null}
            <s>
              <Money data={compareAtPrice} />
            </s>
          </div>
        ) : price ? (
          <Money data={price} />
        ) : (
          <span>&nbsp;</span>
        ),
      )}
    </div>
  );
}

/** @typedef {import('@shopify/hydrogen/storefront-api-types').MoneyV2} MoneyV2 */
