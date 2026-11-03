export const GA_MEASUREMENT_ID = 'G-BKLZMJ9EP7';
const STATE_KEY = '__seineshopGa4Consent';

/**
 * Basic consent mode: do not request GA until Shopify permits analytics.
 * Keep state on the browser so remounts cannot initialize the same tag twice.
 * The injected browser/document also let tests control a delayed script load.
 */
export function syncGoogleAnalyticsConsent({
  browser,
  document,
  allowed,
  nonce,
}) {
  const state = (browser[STATE_KEY] ??= {
    allowed: false,
    requested: false,
    loaded: false,
    initialized: false,
    defaultsSet: false,
  });
  browser.dataLayer ??= [];
  browser.gtag ??= function () {
    browser.dataLayer.push(arguments);
  };
  const consent = (analytics) => ({
    analytics_storage: analytics ? 'granted' : 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
  const previouslyAllowed = state.allowed;
  state.allowed = allowed === true;
  // Set the Google opt-out flag before queued commands or async script execution.
  browser[`ga-disable-${GA_MEASUREMENT_ID}`] = !state.allowed;
  if (!state.defaultsSet) {
    browser.gtag('consent', 'default', consent(false));
    state.defaultsSet = true;
  }
  if (previouslyAllowed !== state.allowed) {
    browser.gtag('consent', 'update', consent(state.allowed));
  }
  if (!state.allowed) return;

  const initialize = () => {
    // A visitor may revoke consent while the external script is still loading.
    if (!state.allowed || state.initialized) return;
    state.initialized = true;
    browser.gtag('js', new Date());
    browser.gtag('config', GA_MEASUREMENT_ID);
  };
  if (state.loaded) {
    if (!state.initialized) initialize();
    else if (!previouslyAllowed) {
      browser.gtag('event', 'page_view');
    }
    return;
  }
  if (state.requested) return;
  state.requested = true;
  const script = document.createElement('script');
  script.id = 'seineshop-ga4';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  if (nonce) script.nonce = nonce;
  script.onload = () => {
    state.loaded = true;
    initialize();
  };
  script.onerror = () => {
    state.requested = false;
    script.remove();
    console.error('Unable to load the analytics script.');
  };
  document.head.appendChild(script);
}
