import {useEffect, useId, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {Link, useFetcher} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import {useLocale} from '~/lib/i18n';
import {useAside} from './Aside';
import {AddToCartButton} from './AddToCartButton';
import {CheckoutForm} from './CheckoutForm';

const icons = {
  eye: (
    <>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  heart: (
    <path d="M12 20S3 14.5 3 8.8a4.5 4.5 0 0 1 9-1.2 4.5 4.5 0 0 1 9 1.2C21 14.5 12 20 12 20Z" />
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 5 5" />
    </>
  ),
  grid: <path d="M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z" />,
  list: <path d="M3 4h5v5H3zm0 11h5v5H3zm9-9h9m-9 11h9" />,
};

export function CatalogIcon({name}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  );
}

const favoritesKey = 'seine-best-seller-favorites';
export function useBestSellerFavorites(enabled) {
  const [favorites, setFavorites] = useState([]);
  useEffect(() => {
    if (!enabled) return;
    try {
      const stored = JSON.parse(
        window.localStorage.getItem(favoritesKey) || '[]',
      );
      if (Array.isArray(stored))
        setFavorites(stored.filter((value) => typeof value === 'string'));
    } catch {
      /* Retain in-memory state when storage is unavailable. */
    }
  }, [enabled]);
  const toggleFavorite = (handle) => {
    const next = favorites.includes(handle)
      ? favorites.filter((value) => value !== handle)
      : [...favorites, handle];
    setFavorites(next);
    try {
      window.localStorage.setItem(favoritesKey, JSON.stringify(next));
    } catch {
      /* Storage may be disabled. */
    }
  };
  return {favorites, toggleFavorite};
}

export function BestSellerCard({
  product,
  loading,
  favorite,
  onFavorite,
  onPreview,
}) {
  const {t, localize} = useLocale();
  const title = t(product.title);
  return (
    <article className="best-seller-card">
      <Link
        className="product-item"
        to={localize(`/products/${product.handle}`)}
        aria-label={title}
      >
        {product.featuredImage && (
          <Image
            aspectRatio="1/1"
            data={product.featuredImage}
            alt={product.featuredImage.altText || title}
            loading={loading}
            sizes="(max-width: 760px) 50vw, 25vw"
          />
        )}
        <h3 title={title}>{title}</h3>
      </Link>
      <div className="best-seller-card-price">
        <Money data={product.priceRange.minVariantPrice} />
      </div>
      <div className="best-seller-card-tools">
        <button
          type="button"
          onClick={onFavorite}
          aria-pressed={favorite}
          aria-label={`${t('Save on this device')}: ${title}`}
          title={t('Save on this device')}
        >
          <CatalogIcon name="heart" />
        </button>
        <button
          type="button"
          onClick={onPreview}
          aria-haspopup="dialog"
          aria-label={`${t('Quick View')}: ${title}`}
          title={t('Quick View')}
        >
          <CatalogIcon name="eye" />
        </button>
      </div>
      <button
        className="best-seller-card-buy"
        type="button"
        onClick={onPreview}
        aria-haspopup="dialog"
        disabled={!product.availableForSale}
      >
        {t(product.availableForSale ? 'Add to Cart' : 'Sold out')}
      </button>
    </article>
  );
}

export function BestSellerQuickView({product: card, onClose}) {
  const {t, localize} = useLocale();
  const dialog = useRef(null);
  const titleId = useId();
  const url = localize(
    `/api/collection-preview/${encodeURIComponent(card.handle)}`,
  );
  const [result, setResult] = useState(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    const element = dialog.current;
    const trigger = document.activeElement;
    element.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      element.close();
      document.body.style.overflow = previous;
      if (trigger instanceof HTMLElement && trigger.isConnected)
        trigger.focus({preventScroll: true});
    };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    fetch(url, {
      signal: controller.signal,
      headers: {Accept: 'application/json'},
    })
      .then((response) => {
        if (!response.ok) throw new Error('Product unavailable');
        return response.json();
      })
      .then(({product}) => setResult(product))
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => controller.abort();
  }, [url]);
  const detailsUrl = localize(`/products/${card.handle}`);
  return createPortal(
    <dialog
      ref={dialog}
      className="best-seller-dialog"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="best-seller-dialog-content">
        <button
          className="best-seller-dialog-close"
          type="button"
          onClick={onClose}
          aria-label={t('Close')}
        >
          ×
        </button>
        <PreviewGallery
          images={
            result?.images.nodes.length
              ? result.images.nodes
              : card.featuredImage
                ? [card.featuredImage]
                : []
          }
          detailsUrl={detailsUrl}
          title={card.title}
        />
        <div className="best-seller-preview-details">
          <h2 id={titleId}>{t(result?.title || card.title)}</h2>
          {error ? (
            <p role="alert">
              {t('Quick View is unavailable.')}{' '}
              <Link to={detailsUrl}>{t('View full details')}</Link>
            </p>
          ) : result ? (
            <PreviewPurchase
              product={result}
              detailsUrl={detailsUrl}
              onClose={onClose}
            />
          ) : (
            <p role="status">{t('Loading...')}</p>
          )}
        </div>
      </div>
    </dialog>,
    document.body,
  );
}

function PreviewGallery({images, title, detailsUrl}) {
  const {t} = useLocale();
  const [index, setIndex] = useState(0);
  const active = images[index];
  return (
    <div className="best-seller-preview-gallery">
      <div className="best-seller-preview-thumbs">
        {images.length > 1 &&
          images.map((image, i) => (
            <button
              key={image.url}
              type="button"
              aria-pressed={i === index}
              onClick={() => setIndex(i)}
              aria-label={`${t('Product image')} ${i + 1}`}
            >
              <Image data={image} aspectRatio="1/1" alt="" sizes="48px" />
            </button>
          ))}
      </div>
      <div className="best-seller-preview-main-image">
        {active && (
          <Image
            data={active}
            aspectRatio="1/1"
            alt={active.altText || title}
            sizes="(max-width: 760px) 80vw, 400px"
          />
        )}
        {images.length > 1 && (
          <div className="best-seller-preview-nav">
            <button
              type="button"
              aria-label={t('Previous image')}
              disabled={index === 0}
              onClick={() => setIndex(index - 1)}
            >
              ‹
            </button>
            <button
              type="button"
              aria-label={t('Next image')}
              disabled={index === images.length - 1}
              onClick={() => setIndex(index + 1)}
            >
              ›
            </button>
          </div>
        )}
        <Link to={detailsUrl}>{t('View full details')} ›</Link>
      </div>
    </div>
  );
}

function PreviewPurchase({product, detailsUrl, onClose}) {
  const {t} = useLocale();
  const {open} = useAside();
  const checkout = useFetcher();
  const variants = product.variants.nodes;
  const [variantId, setVariantId] = useState(
    product.selectedOrFirstAvailableVariant?.id,
  );
  const variant =
    variants.find(({id}) => id === variantId) ||
    product.selectedOrFirstAvailableVariant;
  const minimum = variant?.quantityRule?.minimum ?? 1;
  const maximum = Math.min(9999, variant?.quantityRule?.maximum ?? 9999);
  const increment = variant?.quantityRule?.increment ?? 1;
  const [quantity, setQuantity] = useState(minimum);
  const valid =
    Number.isInteger(Number(quantity)) &&
    Number(quantity) >= minimum &&
    Number(quantity) <= maximum &&
    (Number(quantity) - minimum) % increment === 0;
  const disabled = !variant?.availableForSale || !valid;
  return (
    <>
      <div className="best-seller-preview-meta">
        {variant?.sku && (
          <span>
            {t('Item No.')}: {variant.sku}
          </span>
        )}
        {product.leadTime?.value && (
          <span>
            {t('Estimated Lead Time')}: {t(product.leadTime.value)}
          </span>
        )}
      </div>
      {variant?.price && (
        <div className="best-seller-preview-price">
          <Money data={variant.price} />
        </div>
      )}
      {variants.length > 1 && (
        <fieldset className="best-seller-preview-options">
          <legend>{t('Options')}</legend>
          {variants.map((choice) => (
            <button
              type="button"
              key={choice.id}
              aria-pressed={choice.id === variantId}
              onClick={() => {
                setVariantId(choice.id);
                setQuantity(choice.quantityRule?.minimum ?? 1);
              }}
            >
              {choice.image && (
                <Image
                  data={choice.image}
                  alt=""
                  aspectRatio="1/1"
                  sizes="36px"
                />
              )}
              {t(choice.title)}
              {!choice.availableForSale && ` · ${t('Sold out')}`}
            </button>
          ))}
          {product.variants.pageInfo.hasNextPage && (
            <Link to={detailsUrl}>{t('View full details')}</Link>
          )}
        </fieldset>
      )}
      <div className="best-seller-preview-quantity">
        <button
          type="button"
          aria-label={t('Decrease quantity')}
          disabled={!valid || Number(quantity) - increment < minimum}
          onClick={() => setQuantity(Number(quantity) - increment)}
        >
          −
        </button>
        <input
          type="number"
          inputMode="numeric"
          aria-label={t('Quantity')}
          min={minimum}
          max={maximum}
          step={increment}
          value={quantity}
          onChange={(event) => setQuantity(event.currentTarget.value)}
        />
        <button
          type="button"
          aria-label={t('Increase quantity')}
          disabled={!valid || Number(quantity) + increment > maximum}
          onClick={() => setQuantity(Number(quantity) + increment)}
        >
          +
        </button>
      </div>
      {variant?.price && valid && (
        <div className="best-seller-preview-total">
          {t('Total')}:{' '}
          <strong>
            <Money
              data={{
                ...variant.price,
                amount: String(Number(variant.price.amount) * Number(quantity)),
              }}
            />
          </strong>
        </div>
      )}
      <div className="best-seller-preview-actions">
        <CheckoutForm fetcher={checkout}>
          <input type="hidden" name="merchandiseId" value={variant?.id || ''} />
          <input type="hidden" name="quantity" value={quantity} />
          <button
            className="best-seller-preview-buy"
            type="submit"
            disabled={disabled}
          >
            {t(checkout.state !== 'idle' ? 'Opening checkout…' : 'Buy now')}
          </button>
          {[...new Set(checkout.data?.errors?.map(({message}) => message))].map(
            (message) => (
              <p role="alert" key={message}>
                {t(message)}
              </p>
            ),
          )}
        </CheckoutForm>
        <AddToCartButton
          disabled={disabled || checkout.state !== 'idle'}
          lines={
            variant
              ? [
                  {
                    merchandiseId: variant.id,
                    quantity: Number(quantity),
                    selectedVariant: {
                      ...variant,
                      product: {handle: product.handle, title: product.title},
                    },
                  },
                ]
              : []
          }
          onSuccess={() => {
            onClose();
            open('cart');
          }}
        >
          {variant?.availableForSale ? 'Add to Cart' : 'Sold out'}
        </AddToCartButton>
      </div>
    </>
  );
}
