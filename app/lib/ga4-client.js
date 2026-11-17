import {GA_MEASUREMENT_ID} from './google-analytics-consent.js';

/** New ecommerce tracking uses Shopify's current analytics permission. */
export function commerceTrackingAllowed(browser = globalThis.window) {
  try {
    const privacy = browser?.Shopify?.customerPrivacy;
    return Boolean(browser && !browser[`ga-disable-${GA_MEASUREMENT_ID}`] &&
      privacy?.currentVisitorConsent?.().analytics !== 'no' && privacy?.analyticsProcessingAllowed?.());
  } catch {
    return false;
  }
}

export function sendCommerceEvent(name, payload, key, browser = globalThis.window) {
  if (!browser) return false;
  const seen = (browser.__seineCommerceEvents ??= new Set());
  if (seen.has(key)) return false;
  // Do not replay an old purchase action after a later consent change.
  seen.add(key);
  if (seen.size > 500) seen.delete(seen.values().next().value);
  if (!commerceTrackingAllowed(browser) || typeof browser.gtag !== 'function') return false;
  try {
    browser.gtag('event', name, {
      ...payload,
      send_to: GA_MEASUREMENT_ID,
      page_location: `${browser.location.origin}${browser.location.pathname}`,
      transport_type: 'beacon',
    });
    return true;
  } catch {
    return false;
  }
}

export function sendCartReceipt(receipt, browser = globalThis.window) {
  if (!receipt?.eventId || !Array.isArray(receipt.events)) return;
  receipt.events.forEach((payload, index) => sendCommerceEvent('add_to_cart', payload, `${receipt.eventId}:${index}`, browser));
}

/** gtag owns cookie formats. A blocked tag must never hold checkout open. */
export async function getCheckoutAnalytics(browser = globalThis.window, timeoutMs = 250) {
  if (!commerceTrackingAllowed(browser) || typeof browser.gtag !== 'function') return {};
  return new Promise((resolve) => {
    const values = {};
    const finish = () => {
      clearTimeout(timer);
      resolve(commerceTrackingAllowed(browser) ? values : {});
    };
    const timer = setTimeout(finish, timeoutMs);
    let remaining = 2;
    const receive = (key) => (value) => {
      if (typeof value === 'string' || typeof value === 'number') values[key] = String(value);
      if (--remaining === 0) finish();
    };
    try {
      browser.gtag('get', GA_MEASUREMENT_ID, 'client_id', receive('gaClientId'));
      browser.gtag('get', GA_MEASUREMENT_ID, 'session_id', receive('gaSessionId'));
    } catch {
      clearTimeout(timer);
      resolve({});
    }
  });
}
