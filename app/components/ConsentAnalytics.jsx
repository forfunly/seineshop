import {useEffect} from 'react';
import {useAnalytics, useNonce} from '@shopify/hydrogen';
import {syncGoogleAnalyticsConsent} from '~/lib/google-analytics-consent';

export function ConsentAnalytics() {
  const {canTrack, customerPrivacy, privacyBanner} = useAnalytics();
  const nonce = useNonce();

  useEffect(() => {
    const synchronize = () => {
      syncGoogleAnalyticsConsent({
        browser: window,
        document,
        allowed: canTrack(),
        nonce,
      });
    };
    synchronize();
    document.addEventListener('shopifyCustomerPrivacyApiLoaded', synchronize);
    document.addEventListener('visitorConsentCollected', synchronize);
    return () => {
      document.removeEventListener(
        'shopifyCustomerPrivacyApiLoaded',
        synchronize,
      );
      document.removeEventListener('visitorConsentCollected', synchronize);
    };
  }, [canTrack, customerPrivacy, nonce]);

  useEffect(() => {
    privacyBanner?.loadBanner();
  }, [privacyBanner]);

  return null;
}
