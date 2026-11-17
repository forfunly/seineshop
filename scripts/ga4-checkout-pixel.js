/* global analytics, browser, init, api */
// Shopify Customer events > Custom pixel. Paste this entire file, without script tags.
// Prepare/review locally; connecting the production pixel requires separate approval.
(() => {
  const measurementId = 'G-BKLZMJ9EP7';
  const storageKey = 'seine-ga4-checkout-dedupe-v1';
  const mappings = {
    checkout_started: 'begin_checkout',
    payment_info_submitted: 'add_payment_info',
    checkout_completed: 'purchase',
  };
  let privacy = init.customerPrivacy;
  let initialized = false;
  let serial = Promise.resolve();
  const memory = new Map();
  const allowed = () => privacy?.analyticsProcessingAllowed === true;
  const amount = (value) => value !== null && value !== undefined && value !== '' &&
    Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : null;
  const round = (value) => Number(value.toFixed(6));
  const numericId = (value) => String(value || '').match(/(?:^|\/)(\d+)$/)?.[1];

  function contextFor(checkout, timestamp) {
    const attributes = Object.fromEntries((checkout.attributes || []).map(({key, value}) => [key, value]));
    const clientId = attributes.seine_ga_client_id;
    const sessionId = attributes.seine_ga_session_id;
    const captured = Number(attributes.seine_ga_captured_at);
    const fresh = Number.isFinite(captured) && timestamp >= captured - 60000 && timestamp - captured < 30 * 60 * 1000;
    return {
      ...(/^\d{1,20}\.\d{1,20}$/.test(clientId || '') ? {client_id: clientId} : {}),
      ...(fresh && /^\d{1,20}$/.test(sessionId || '') ? {session_id: sessionId} : {}),
    };
  }

  function payloadFor(event) {
    const checkout = event.data?.checkout;
    if (!checkout || !/^[A-Z]{3}$/.test(checkout.currencyCode || '')) return null;
    const items = [];
    for (const line of checkout.lineItems || []) {
      const id = numericId(line.variant?.id);
      const quantity = line.quantity;
      // finalLinePrice includes line discounts. The fallback subtracts allocations.
      const original = amount(line.variant?.price?.amount);
      const discounts = (line.discountAllocations || []).reduce((sum, entry) => sum + (amount(entry.amount?.amount) || 0), 0);
      const final = amount(line.finalLinePrice?.amount) ?? (original === null ? null : Math.max(0, original * quantity - discounts));
      if (!id || !Number.isInteger(quantity) || quantity < 1 || final === null) return null;
      items.push({
        item_id: id,
        item_name: line.variant?.product?.title || line.title || '',
        item_brand: 'Seine Shop',
        item_variant: line.variant?.title || '',
        price: final / quantity,
        quantity,
      });
    }
    if (!items.length) return null;
    const name = mappings[event.name];
    const transactionId = numericId(checkout.order?.id);
    if (name === 'purchase' && !transactionId) return null;
    const payload = {
      currency: checkout.currencyCode,
      value: round(items.reduce((sum, item) => sum + item.price * item.quantity, 0)),
      // GA4's native 200-item limit: keep one transaction and its full value.
      items: items.slice(0, 200),
      ...(name === 'purchase' ? {
        transaction_id: transactionId,
        ...(amount(checkout.totalTax?.amount) !== null ? {tax: amount(checkout.totalTax.amount)} : {}),
        ...(amount(checkout.shippingLine?.price?.amount) !== null ? {shipping: amount(checkout.shippingLine.price.amount)} : {}),
      } : {}),
    };
    return {name, payload, transactionId};
  }

  function initialize(context) {
    if (initialized || !allowed()) return;
    initialized = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', {
      analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
    });
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      ...context, send_page_view: false, ignore_referrer: true,
      allow_google_signals: false, allow_ad_personalization_signals: false,
      page_location: 'https://www.seineshop.com/checkout',
    });
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);
  }

  api.customerPrivacy.subscribe('visitorConsentCollected', (event) => {
    privacy = event.customerPrivacy;
    window[`ga-disable-${measurementId}`] = !allowed();
    if (initialized) window.gtag('consent', 'update', {analytics_storage: allowed() ? 'granted' : 'denied'});
  });

  async function handle(event) {
    if (!allowed()) return;
    const result = payloadFor(event);
    if (!result) return;
    const checkout = event.data.checkout;
    const timestamp = Date.parse(event.timestamp);
    if (!Number.isFinite(timestamp)) return;
    const context = contextFor(checkout, timestamp);
    const sourceKey = result.name === 'purchase' ? result.transactionId : checkout.token || event.id;
    if (!sourceKey) return;
    // Store a digest, never a usable checkout token. The digest is not sent to GA.
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${result.name}:${sourceKey}`));
    const key = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
    const now = Date.now();
    const ttl = result.name === 'purchase' ? 90 * 86400000 : 30 * 60000;
    let entries = [];
    try {
      const stored = JSON.parse(await browser.localStorage.getItem(storageKey) || '[]');
      if (Array.isArray(stored)) entries = stored.filter((entry) => typeof entry.key === 'string' && Number.isFinite(entry.at) && now - entry.at < 90 * 86400000).slice(-100);
    } catch { /* Restricted storage falls back to in-memory and GA transaction dedup. */ }
    const previous = memory.get(key) ?? entries.find((entry) => entry.key === key)?.at;
    if ((previous !== undefined && now - previous < ttl) || !allowed()) return;
    initialize(context);
    window.gtag('event', result.name, {
      ...result.payload,
      ...context,
      send_to: measurementId,
      page_location: 'https://www.seineshop.com/checkout',
      page_title: 'Checkout | Seine Shop',
      page_referrer: '',
      transport_type: 'beacon',
    });
    memory.set(key, now);
    if (memory.size > 100) memory.delete(memory.keys().next().value);
    try {
      await browser.localStorage.setItem(storageKey, JSON.stringify([...entries.filter((entry) => entry.key !== key), {key, at: now}].slice(-100)));
    } catch { /* Analytics storage failure must not affect checkout. */ }
  }

  const enqueue = (event) => {
    // Serialize duplicate callbacks so persistent dedup checks cannot race.
    serial = serial.then(() => handle(event)).catch(() => {});
    return serial;
  };
  // Shopify discovers subscriptions statically: event names must be literals.
  analytics.subscribe('checkout_started', enqueue);
  analytics.subscribe('payment_info_submitted', enqueue);
  analytics.subscribe('checkout_completed', enqueue);
})();
