import {useLocale} from '~/lib/i18n';
import {Link} from 'react-router';
export default function Support() {
  const {t, localize} = useLocale();
  return (
    <div className="support-page">
      <p className="eyebrow">{t('WE\u2019RE HERE TO HELP')}</p>
      <h1>{t('SeineShop support')}</h1>
      <p>
        {t('Questions about a product or an order? Email')}{' '}
        <a href={localize('mailto:hello@seineshop.com')}>
          {t('hello@seineshop.com')}
        </a>{' '}
        {t('with the product name or order number.')}
      </p>
      <section id="compatibility">
        <h2>{t('Check compatibility')}</h2>
        <p>
          {t(
            'Check your exact device model, charging standard and connector before ordering. Product descriptions list the compatibility information available for each item.',
          )}
        </p>
      </section>
      <section id="orders">
        <h2>{t('Orders & delivery')}</h2>
        <p>
          {t(
            'Available delivery methods and charges are shown at checkout for your address. For an existing order, include your order number when contacting us.',
          )}
        </p>
      </section>
      <section id="returns">
        <h2>{t('Returns & refunds')}</h2>
        <p>
          {t(
            'Read the store\u2019s current policies before placing an order. Contact us with your order number and a description of the issue for help.',
          )}
        </p>
        <Link to={localize('/policies')}>
          {t('View store policies \u2192')}
        </Link>
      </section>
      <section>
        <h2>{t('Catalog availability')}</h2>
        <p>
          {t(
            'Products marked \u201CComing soon\u201D are previews and cannot be purchased yet.',
          )}
        </p>
        <Link to={localize('/collections')}>
          {t('Browse collections \u2192')}
        </Link>
      </section>
    </div>
  );
}
