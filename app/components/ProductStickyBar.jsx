import {validPurchaseQuantity} from '~/lib/wholesale';
import {useEffect, useState} from 'react';
import {Money} from '@shopify/hydrogen';
import {useFetchers, useNavigation} from 'react-router';
import {useLocale} from '~/lib/i18n';
import {useAside} from './Aside';
import {AddToCartButton} from './AddToCartButton';

export function ProductStickyBar({title, variant, quantity}) {
  const {t} = useLocale();
  const {type, open} = useAside();
  const [visible, setVisible] = useState(false);
  const fetchers = useFetchers();
  const navigation = useNavigation();
  useEffect(() => {
    const target = document.getElementById('product-purchase');
    if (!target || !window.IntersectionObserver) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.boundingClientRect.bottom < 0));
    observer.observe(target);
    return () => observer.disconnect();
  }, []);
  const validQuantity = validPurchaseQuantity(quantity);
  const busy = navigation.state !== 'idle' || fetchers.some((fetcher) => fetcher.state !== 'idle');
  return <section className="pdp-sticky-bar" hidden={!visible || type !== 'closed'} aria-label={t('Quick purchase')}>
    <div className="pdp-sticky-product"><strong>{t(title)}</strong><span>{t(variant?.title)} · {t('Quantity')}: {quantity}</span></div>
    <div className="pdp-sticky-price">{variant?.price && <Money data={variant.price} />}</div>
    <a href="#product-purchase">{t('Edit options')}</a>
    <AddToCartButton disabled={!variant?.availableForSale || !validQuantity || busy} onClick={() => open('cart')} lines={variant ? [{merchandiseId: variant.id, quantity: Number(quantity), selectedVariant: variant}] : []}>
      {t(variant?.availableForSale ? 'Add to cart' : 'Sold out')}
    </AddToCartButton>
  </section>;
}
