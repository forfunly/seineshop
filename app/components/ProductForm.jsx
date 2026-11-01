import {Money} from '@shopify/hydrogen';
import {WholesaleTiers} from './ProductBusiness';
import {MAX_PURCHASE_QUANTITY, validPurchaseQuantity} from '~/lib/wholesale';
import {useLocale} from '~/lib/i18n';
import {Link, useNavigate, useFetcher, useFetchers, useNavigation} from 'react-router';
import {useId} from 'react';
import {AddToCartButton} from './AddToCartButton';
import {useAside} from './Aside';

/**
 * @param {{
 *   productOptions: MappedProductOptions[];
 *   selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
 *   quantity: string;
 *   setQuantity: (quantity: string) => void;
 * }}
 */
export function ProductForm({productOptions, selectedVariant, quantity, setQuantity}) {
  const {t, localize} = useLocale();
  const navigate = useNavigate();
  const {open} = useAside();
  const checkout = useFetcher();
  const fetchers = useFetchers();
  const navigation = useNavigation();
  const quantityId = useId();
  const validQuantity = validPurchaseQuantity(quantity);
  const busy = navigation.state !== 'idle' || fetchers.some((fetcher) => fetcher.state !== 'idle');
  const unavailable = !selectedVariant?.availableForSale || !validQuantity || busy;
  return (
    <div className="product-form">
      {productOptions.map((option) => {
        // If there is only a single value in the option values, don't display the option
        if (option.optionValues.length === 1) return null;
        return (
          <div className="product-options" key={option.name}>
            <h5>{t(option.name)} <span className="pdp-option-selected">{t(option.optionValues.find((value) => value.selected)?.name)}</span></h5>
            <div className="product-options-grid">
              {option.optionValues.map((value) => {
                const {
                  name,
                  handle,
                  variantUriQuery,
                  selected,
                  available,
                  exists,
                  isDifferentProduct,
                  swatch,
                } = value;
                if (isDifferentProduct) {
                  // SEO
                  // When the variant is a combined listing child product
                  // that leads to a different url, we need to render it
                  // as an anchor tag
                  return (
                    <Link
                      className="product-options-item"
                      key={option.name + name}
                      prefetch="intent"
                      preventScrollReset
                      replace
                      to={localize(`/products/${handle}?${variantUriQuery}`)}
                      style={{
                        border: selected
                          ? '1px solid black'
                          : '1px solid transparent',
                        opacity: available ? 1 : 0.3,
                      }}
                    >
                      <ProductOptionSwatch swatch={swatch} name={name} />
                    </Link>
                  );
                } else {
                  // SEO
                  // When the variant is an update to the search param,
                  // render it as a button with javascript navigating to
                  // the variant so that SEO bots do not index these as
                  // duplicated links
                  return (
                    <button
                      type="button"
                      className={`product-options-item${exists && !selected ? ' link' : ''}`}
                      key={option.name + name}
                      style={{
                        border: selected
                          ? '1px solid black'
                          : '1px solid transparent',
                        opacity: available ? 1 : 0.3,
                      }}
                      disabled={!exists || busy}
                      aria-pressed={selected}
                      onClick={() => {
                        if (!selected) {
                          void navigate(`?${variantUriQuery}`, {
                            replace: true,
                            preventScrollReset: true,
                          });
                        }
                      }}
                    >
                      <ProductOptionSwatch swatch={swatch} name={name} />
                    </button>
                  );
                }
              })}
            </div>
            <br />
          </div>
        );
      })}
      <WholesaleTiers quantity={quantity} setQuantity={setQuantity} price={selectedVariant?.price} busy={busy}/>
      <div className="pdp-quantity-row">
        <label htmlFor={quantityId}>{t('Quantity')}</label>
        <div className="pdp-quantity">
          <button type="button" aria-label={t('Decrease quantity')} disabled={busy || Number(quantity) <= 1} onClick={() => setQuantity(String(Math.max(1, Number(quantity) - 1)))}>−</button>
          <input id={quantityId} type="number" min="1" max={MAX_PURCHASE_QUANTITY} step="1" inputMode="numeric" value={quantity} disabled={busy} onChange={(event) => setQuantity(event.target.value)} />
          <button type="button" aria-label={t('Increase quantity')} disabled={busy || Number(quantity) >= MAX_PURCHASE_QUANTITY} onClick={() => setQuantity(String(Math.min(MAX_PURCHASE_QUANTITY, Number(quantity) + 1)))}>+</button>
        </div>
      </div>
      {!validQuantity && <p role="alert">{t('Choose a valid option and a quantity from 1 to 9999.')}</p>}
      {validQuantity && selectedVariant?.price && <div className="pdp-order-total"><span>{t('Total at current unit price')}</span><strong><Money data={{...selectedVariant.price, amount: String(Number(selectedVariant.price.amount) * Number(quantity))}} /></strong></div>}
      <div className="pdp-purchase-actions">
        <AddToCartButton
          disabled={unavailable}
          onClick={() => open('cart')}
          lines={selectedVariant ? [{merchandiseId: selectedVariant.id, quantity: Number(quantity), selectedVariant}] : []}
        >
          {t(selectedVariant?.availableForSale ? 'Add to cart' : 'Sold out')}
        </AddToCartButton>
        <checkout.Form method="post" action={localize('/checkout')}>
          <input type="hidden" name="merchandiseId" value={selectedVariant?.id || ''} />
          <input type="hidden" name="quantity" value={quantity} />
          <button className="pdp-buy-now" type="submit" disabled={unavailable}>
            {t(checkout.state !== 'idle' ? 'Opening checkout…' : 'Buy now')}
          </button>
          {checkout.data?.errors?.length > 0 && <div className="pdp-purchase-error" role="alert">{checkout.data.errors.map((error, index) => <p key={index}>{t(error.message)}</p>)}</div>}
        </checkout.Form>
      </div>
      <p className="pdp-checkout-note">{t('Secure checkout by Shopify. Shipping and taxes calculated at checkout.')}</p>

    </div>
  );
}

/**
 * @param {{
 *   swatch?: Maybe<ProductOptionValueSwatch> | undefined;
 *   name: string;
 * }}
 */
function ProductOptionSwatch({swatch, name}) {
  const {t, localize} = useLocale();
  const image = swatch?.image?.previewImage?.url;
  const color = swatch?.color;
  if (!image && !color) return <span className="pdp-option-text">{['Black', 'White'].includes(name) && <span className={`pdp-color-dot ${name.toLowerCase()}`} aria-hidden="true" />}{t(name)}</span>;
  return (
    <div
      aria-label={t(name)}
      className="product-option-label-swatch"
      style={{
        backgroundColor: color || 'transparent',
      }}
    >
      {!!image && <img src={image} alt={t(name)} />}
    </div>
  );
}

/** @typedef {import('@shopify/hydrogen').MappedProductOptions} MappedProductOptions */
/** @typedef {import('@shopify/hydrogen/storefront-api-types').Maybe} Maybe */
/** @typedef {import('@shopify/hydrogen/storefront-api-types').ProductOptionValueSwatch} ProductOptionValueSwatch */
/** @typedef {import('storefrontapi.generated').ProductFragment} ProductFragment */
