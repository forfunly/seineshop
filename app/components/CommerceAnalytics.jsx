import {useEffect} from 'react';
import {useFetchers, useLocation} from 'react-router';
import {useAnalytics} from '@shopify/hydrogen';
import {commerceBatches, commerceItem} from '~/lib/ga4-commerce';
import {sendCartReceipt, sendCommerceEvent} from '~/lib/ga4-client';

/** Observe successful action data, never optimistic cart contents or button clicks.
 * @returns {null}
 */
export function CommerceAnalytics() {
  const fetchers = useFetchers();
  useEffect(() => {
    for (const fetcher of fetchers) sendCartReceipt(fetcher.data?.analytics?.ga4);
  }, [fetchers]);
  return null;
}

export function CartAnalyticsInput() {
  const {canTrack} = useAnalytics();
  return <input type="hidden" name="ga4" value={canTrack() ? '1' : '0'}/>;
}

/** @returns {null} */
export function ProductCommerceView({product, variant}) {
  const location = useLocation();
  const {canTrack} = useAnalytics();
  const allowed = canTrack();
  useEffect(() => {
    if (!allowed) return;
    const item = commerceItem(variant, product, variant?.price);
    if (!item) return;
    const payload = commerceBatches([item], variant.price.currencyCode)[0];
    if (payload) sendCommerceEvent('view_item', payload, `view:${location.key}:${product.id}:${variant.id}`);
  }, [allowed, location.key, product, variant]);
  return null;
}
