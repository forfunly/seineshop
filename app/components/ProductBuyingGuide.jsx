import {Link} from 'react-router';
import {useLocale} from '~/lib/i18n';

export function ProductBuyingGuide() {
  const {t, localize} = useLocale();
  const devices = [
    ['01', 'Your phone', 'Qi-enabled phones', 'Up to 15W. Actual speed depends on your phone and power supply.'],
    ['02', 'Your earbuds', 'Wireless-charging cases', '3W charging for compatible earbuds cases. A wireless-charging case is required.'],
    ['03', 'Your watch', 'Samsung Galaxy Watch', 'Supplier-listed models: Galaxy Watch 3 / 4 / 5 / 6 / 7. Confirm your exact model; Apple Watch compatibility is not listed.'],
  ];
  const questions = [
    ['Will it charge my Apple Watch?', 'Apple Watch compatibility is not listed for this model. The watch charger is listed for Samsung Galaxy Watch 3 / 4 / 5 / 6 / 7. Please confirm your device before ordering.'],
    ['Is a power adapter included?', 'The listed package contains the charging station, a charging cable and an English manual. A power adapter is not listed. Required input: 9V/2A or 12V/3A through USB-C.'],
    ['Will my phone charge at 15W?', '15W is the maximum listed phone output, not a guaranteed speed for every phone. Supported outputs are 5W, 7.5W, 10W and 15W; actual speed depends on the device and power supply.'],
    ['Can I use my phone while it charges?', 'The stand supports portrait and landscape phone charging. Check alignment and compatibility with your device and case.'],
    ['How much is delivery?', 'Available delivery methods, shipping charges and taxes are shown in Shopify checkout for your delivery address before you pay.'],
  ];
  return <>
    <section className="pdp-feature-story" id="product-features" aria-labelledby="feature-heading">
      <div className="pdp-story-copy"><p className="pdp-eyebrow">{t('Made for your everyday')}</p><h2 id="feature-heading">{t('Three essentials.')}<br/><em>{t('One charging spot.')}</em></h2><p>{t('Bring your phone, earbuds and compatible Galaxy Watch together. A foldable stand keeps your charging setup in one place, at your desk or on the move.')}</p><a href="#product-compatibility">{t('Find your fit')} ↘</a></div>
      <div className="pdp-story-image"><img src="/images/b20a-white.webp" alt={t('B-20A white charging station; devices not included')} width="800" height="800" loading="lazy"/><span>{t('Black or White. Your space, your choice.')}</span></div>
    </section>
    <div className="pdp-benefit-grid">
      <article><span>01 / {t('Simplify')}</span><h3>{t('A place for all three.')}</h3><p>{t('Dedicated charging areas for a compatible phone, earbuds and Galaxy Watch.')}</p></article>
      <article><span>02 / {t('Adapt')}</span><h3>{t('Portrait or landscape.')}</h3><p>{t('Keep your phone upright or turn it sideways while charging.')}</p></article>
      <article><span>03 / {t('Take along')}</span><h3>{t('Fold into your routine.')}</h3><p>{t('A foldable design and USB-C input make it easy to move your setup.')}</p></article>
    </div>
    <section className="pdp-compatibility-section" id="product-compatibility" aria-labelledby="compatibility-heading">
      <div className="pdp-section-heading"><div><p className="pdp-eyebrow">{t('Check before you choose')}</p><h2 id="compatibility-heading">{t('Does it fit your devices?')}</h2></div><Link to={localize('/support#compatibility')}>{t('Ask us about your device')} ↗</Link></div>
      <div className="pdp-device-grid">{devices.map(([number, title, heading, copy]) => <article key={number}><span>{number} / {t(title)}</span><h3>{t(heading)}</h3><p>{t(copy)}</p></article>)}</div>
      <p className="pdp-fineprint">{t('Devices shown are for illustration and are not included. This model contains a weak magnet; it is not advertised as Qi2 or MagSafe-certified.')}</p>
    </section>
    <section className="pdp-package" aria-labelledby="package-heading"><div><p className="pdp-eyebrow">{t('Ready to unpack')}</p><h2 id="package-heading">{t('What is in the box?')}</h2><p>{t('A power adapter is not listed in the package contents.')}</p></div><ol><li><span>01</span>{t('B-20A charging station')}</li><li><span>02</span>{t('Charging cable')}</li><li><span>03</span>{t('English user manual')}</li></ol></section>
    <section className="pdp-faq" id="product-faq" aria-labelledby="faq-heading"><div><p className="pdp-eyebrow">{t('A little clarity')}</p><h2 id="faq-heading">{t('Before you plug in.')}</h2><p>{t('Still have a question?')} <a href="mailto:hello@seineshop.com">{t('Contact us')}</a></p></div><div>{questions.map(([question, answer]) => <details key={question}><summary>{t(question)}<span aria-hidden="true">+</span></summary><p>{t(answer)}</p></details>)}</div></section>
  </>;
}
