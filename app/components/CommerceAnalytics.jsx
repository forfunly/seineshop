import {useEffect, useState} from 'react';
import {useFetchers, useLocation} from 'react-router';
import {useAnalytics} from '@shopify/hydrogen';
import {commerceBatches, commerceItem} from '~/lib/ga4-commerce';
import {getCheckoutAnalytics, sendCartReceipt, sendCommerceEvent} from '~/lib/ga4-client';

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
  const allowed = canTrack();
  const [identity, setIdentity] = useState(/** @type {{gaClientId?: string, gaSessionId?: string}} */ ({}));
  useEffect(() => {
    let active = true;
    let timer;
    let attempts = 0;
    const readIdentity = async () => {
      const value = await getCheckoutAnalytics();
      if (!active) return;
      if (value.gaClientId && value.gaSessionId) setIdentity(value);
      else if (++attempts < 8) timer = setTimeout(readIdentity, 500);
    };
    if (allowed) void readIdentity();
    return () => {active = false; clearTimeout(timer);};
  }, [allowed]);
  return <>
    <input type="hidden" name="ga4" value={allowed ? '1' : '0'}/>
    <input type="hidden" name="gaClientId" value={allowed ? identity.gaClientId || '' : ''}/>
    <input type="hidden" name="gaSessionId" value={allowed ? identity.gaSessionId || '' : ''}/>
  </>;
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
