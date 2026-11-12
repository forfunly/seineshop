import {useEffect, useRef, useState} from 'react';
import {Link} from 'react-router';
import {useNonce} from '@shopify/hydrogen';
import {useLocale} from '~/lib/i18n';
import {loadTrackingWidget, trackingLanguage, trackingLink, trackingNumber} from '~/lib/tracking';

export default function OrderTracking() {
  const {t, locale, localize} = useLocale();
  const nonce = useNonce();
  const [value, setValue] = useState('');
  const [number, setNumber] = useState('');
  const [status, setStatus] = useState('idle');
  const [invalid, setInvalid] = useState(false);
  const container = useRef(null);
  const request = useRef(0);
  const timer = useRef(null);
  useEffect(() => () => {
    request.current += 1;
    clearTimeout(timer.current);
  }, []);

  async function track(event) {
    event.preventDefault();
    const next = trackingNumber(value);
    setInvalid(!next);
    if (!next) return;
    const current = ++request.current;
    clearTimeout(timer.current);
    setNumber(next);
    setStatus('loading');
    container.current?.replaceChildren();
    try {
      const widget = await loadTrackingWidget(nonce);
      if (current !== request.current) return;
      widget.trackSingle({
        YQ_ContainerId: 'shipment-tracking-results',
        YQ_Height: 680,
        YQ_Fc: '0',
        YQ_Lang: trackingLanguage(locale.code),
        YQ_Num: next,
        onLoaded: () => {
          if (current !== request.current) return;
          clearTimeout(timer.current);
          setStatus('ready');
        },
      });
      const frame = container.current?.querySelector('iframe');
      if (!frame) throw new Error('Tracking unavailable');
      frame.title = t('Shipment tracking results');
      frame.referrerPolicy = 'no-referrer';
      // An iframe load event does not prove that the provider returned results.
      timer.current = setTimeout(() => {
        if (current === request.current) setStatus('slow');
      }, 20000);
    } catch {
      if (current === request.current) setStatus('error');
    }
  }

  return (
    <div className="tracking-page">
      <header className="tracking-intro">
        <p className="eyebrow">Seineshop · {t('Order tracking')}</p>
        <h1>{t('Follow your delivery')}</h1>
        <p>{t('Enter the tracking number from your shipping confirmation to see the latest carrier updates.')}</p>
      </header>
      <section className="tracking-card" aria-labelledby="tracking-form-title">
        <h2 id="tracking-form-title">{t('Where is my package?')}</h2>
        <form onSubmit={track}>
          <label htmlFor="shipment-number">{t('Tracking number')}</label>
          <div className="tracking-input-row">
            <input id="shipment-number" value={value} onChange={(event) => {setValue(event.target.value); setInvalid(false);}} maxLength={50} autoComplete="off" autoCapitalize="off" spellCheck={false} aria-invalid={invalid} aria-describedby="tracking-help tracking-validation" placeholder={t('Enter your tracking number')} />
            <button type="submit" disabled={status === 'loading'}>{t(status === 'loading' ? 'Searching…' : 'Track package')}</button>
          </div>
          <p id="tracking-validation" role="alert">{invalid ? t('Enter one tracking number using letters, numbers or hyphens (up to 50 characters).') : ''}</p>
          <p id="tracking-help" className="tracking-note">{t('Use your shipment tracking number, not your order number.')}</p>
        </form>
        <p className="tracking-privacy">{t('Tracking is provided by 17TRACK. Your tracking number is sent to 17TRACK when you select Track package.')}</p>
        <noscript><a href="https://www.17track.net/en" rel="noreferrer">{t('Open 17TRACK to track your package')}</a></noscript>
      </section>
      <section className="tracking-results" hidden={!number} aria-label={t('Shipment tracking results')}>
        <div role="status" aria-live="polite">
          {status === 'loading' && <p>{t('Connecting to the tracking service…')}</p>}
          {(status === 'error' || status === 'slow') && <p>{t('The tracking service is taking longer than expected. Try again or open 17TRACK below.')}</p>}
        </div>
        <div id="shipment-tracking-results" ref={container} />
        {number && <a className="tracking-fallback" href={trackingLink(number, locale.code)} target="_blank" rel="noreferrer">{t('View tracking on 17TRACK')} ↗</a>}
      </section>
      <section className="tracking-questions" aria-labelledby="tracking-help-title">
        <h2 id="tracking-help-title">{t('A little help along the way')}</h2>
        <div>
          <article><h3>{t('Where do I find my tracking number?')}</h3><p>{t('Check your shipping confirmation email. If your order ships in separate parcels, track each parcel using its own tracking number.')}</p></article>
          <article><h3>{t('Why are there no updates yet?')}</h3><p>{t('A new tracking number may not show events until the carrier scans the parcel. Check the number and try again later. Updates depend on the carrier.')}</p></article>
          <article><h3>{t('Need help with your delivery?')}</h3><p>{t('Contact Seineshop with your order number and tracking number so our team can help.')}</p><Link to={localize('/support')}>{t('Contact support')} →</Link></article>
        </div>
      </section>
    </div>
  );
}
