export function trackingNumber(value) {
  const number = String(value ?? '').trim();
  return /^[a-zA-Z0-9][a-zA-Z0-9-]{0,49}$/.test(number) ? number : null;
}

export function trackingLanguage(code) {
  return ['en', 'ja', 'de'].includes(code) ? code : 'en';
}

export function trackingLink(number, code) {
  return `https://t.17track.net/${trackingLanguage(code)}#nums=${encodeURIComponent(number)}`;
}

let pending;
export function loadTrackingWidget(nonce) {
  if (window.YQV5?.trackSingle) return Promise.resolve(window.YQV5);
  if (pending) return pending;
  pending = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const finish = (error) => {
      clearTimeout(timer);
      script.onload = null;
      script.onerror = null;
      if (error) {
        script.remove();
        pending = null;
        reject(error);
      } else {
        resolve(window.YQV5);
      }
    };
    const timer = setTimeout(() => finish(new Error('Tracking unavailable')), 15000);
    script.src = 'https://www.17track.net/externalcall.js';
    script.async = true;
    if (nonce) script.nonce = nonce;
    script.onload = () => finish(window.YQV5?.trackSingle ? null : new Error('Tracking unavailable'));
    script.onerror = () => finish(new Error('Tracking unavailable'));
    document.head.appendChild(script);
  });
  return pending;
}
