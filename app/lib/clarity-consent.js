// Public installation ID read back from the merchant's Seine Shop project.
export const CLARITY_PROJECT_ID = 'zey8gxj9j0';
const STATE_KEY = '__seineClarity';
const consent = (allowed) => ({analytics_Storage: allowed ? 'granted' : 'denied', ad_Storage: 'denied'});

export function clarityPageAllowed(location) {
  const path = location.pathname.replace(/^\/(jp|de)(?=\/|$)/, '') || '/';
  if (!/^\/$|^\/(products|collections|blogs|discover)\/[a-z0-9/_-]+$|^\/(collections|support|policies)$/.test(path)) return false;
  const allowedKeys = new Set(['variant', 'Color', 'color', 'Size', 'size', '色', 'Farbe', 'Größe', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']);
  for (const [key, value] of new URLSearchParams(location.search || '')) {
    if (!allowedKeys.has(key) || !/^[\p{L}\p{N}\s().+/_-]{1,100}$/u.test(value)) return false;
  }
  return true;
}

/** Never use Clarity's denied-but-cookieless recording as a substitute for consent. */
export function syncClarityConsent({browser, document, allowed, nonce}) {
  const state = (browser[STATE_KEY] ??= {requested: false, loaded: false, active: false, allowed: false});
  const next = allowed === true && browser.navigator?.globalPrivacyControl !== true;
  state.allowed = next;
  if (!next) {
    if (state.requested && state.active) {
      browser.clarity('consentv2', consent(false));
      browser.clarity('stop');
      state.active = false;
    }
    return;
  }
  if (state.requested) {
    if (!state.active) {
      // Clarity's stop API queues calls; start reactivates its retained configuration.
      browser.clarity('start');
      browser.clarity('consentv2', consent(true));
      state.active = true;
    }
    return;
  }
  browser.clarity ??= function (...args) { (browser.clarity.q ??= []).push(args); };
  // Strict text masking is present in the initial document, before script execution.
  browser.clarity('consentv2', consent(true));
  state.requested = true;
  state.active = true;
  const script = document.createElement('script');
  script.id = 'seine-clarity';
  script.async = true;
  if (nonce) script.nonce = nonce;
  script.src = `https://www.clarity.ms/tag/${CLARITY_PROJECT_ID}`;
  script.onload = () => {
    state.loaded = true;
    if (!state.allowed) {
      browser.clarity('consentv2', consent(false));
      browser.clarity('stop');
      state.active = false;
    }
  };
  script.onerror = () => {
    state.requested = false;
    state.active = false;
    if (!browser.clarity.v) browser.clarity.q = [];
    script.remove();
  };
  document.head.appendChild(script);
}
