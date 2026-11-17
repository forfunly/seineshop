import {useEffect} from 'react';
import {useAnalytics, useNonce} from '@shopify/hydrogen';
import {useLocation, useNavigation} from 'react-router';
import {clarityPageAllowed, syncClarityConsent} from '~/lib/clarity-consent';

export function ClarityAnalytics({enabled}) {
  const {canTrack, customerPrivacy} = useAnalytics();
  const location = useLocation();
  const navigation = useNavigation();
  const nonce = useNonce();
  useEffect(() => {
    const synchronize = () => syncClarityConsent({
      browser: window, document, nonce,
      allowed: enabled && canTrack() && clarityPageAllowed(location) &&
        (!navigation.location || clarityPageAllowed(navigation.location)),
    });
    synchronize();
    document.addEventListener('visitorConsentCollected', synchronize);
    document.addEventListener('shopifyCustomerPrivacyApiLoaded', synchronize);
    const guardNavigation = (event) => {
      const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!anchor) return;
      const target = new URL(anchor.href, window.location.href);
      if (target.origin === window.location.origin && !clarityPageAllowed(target)) {
        syncClarityConsent({browser: window, document, allowed: false, nonce});
      }
    };
    document.addEventListener('click', guardNavigation, true);
    return () => {
      document.removeEventListener('visitorConsentCollected', synchronize);
      document.removeEventListener('shopifyCustomerPrivacyApiLoaded', synchronize);
      document.removeEventListener('click', guardNavigation, true);
    };
  }, [enabled, canTrack, customerPrivacy, location, navigation.location, nonce]);
  return null;
}
