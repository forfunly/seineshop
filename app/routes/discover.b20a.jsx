import {useLocale} from '~/lib/i18n';
import {Link} from 'react-router';
export const meta = () => [
  {
    title: 'B-20A Charging Station | SeineShop',
  },
];
export default function ChargingPreview() {
  const {t, localize} = useLocale();
  return (
    <div className="seine-detail">
      <Link to={localize('/')}>{t('\u2190 Back to SeineShop')}</Link>
      <div className="detail-grid">
        <img
          src="/images/b20a-black.webp"
          alt={t('B-20A black charging station; devices not included')}
          width="800"
          height="800"
        />
        <div>
          <p className="eyebrow">{t('THE CHARGING EDIT')}</p>
          <h1>
            {t('One station.')}
            <br />
            {t('Everyday essentials.')}
          </h1>
          <p>
            {t('B-20A 3-in-1 Foldable Wireless Charging Station \xB7 Black')}
          </p>
          <p>
            {t(
              'Bring a compatible Qi phone, wireless earbuds and Samsung Galaxy Watch together in one foldable charging station.',
            )}
          </p>
          <dl>
            <dt>{t('Phone charging')}</dt>
            <dd>{t('5W / 7.5W / 10W / up to 15W')}</dd>
            <dt>{t('Earbuds / watch')}</dt>
            <dd>{t('3W / 2W')}</dd>
            <dt>{t('Input')}</dt>
            <dd>{t('USB-C \xB7 9V/2A or 12V/3A')}</dd>
            <dt>{t('Dimensions')}</dt>
            <dd>{t('124 \xD7 68 \xD7 135mm')}</dd>
            <dt>{t('Material')}</dt>
            <dd>{t('ABS + PC, rubberized finish')}</dd>
          </dl>
          <p className="availability-note">
            {t(
              'Explore both color options and check current availability on the product page.',
            )}
          </p>
          <Link
            className="seine-button"
            to={localize(
              '/products/b-20a-3-in-1-foldable-wireless-charging-station',
            )}
          >
            {t('View product & colors \u2197')}
          </Link>
          <p className="detail-fineprint">
            {t(
              'Supplier lists Galaxy Watch 3 / 4 / 5 / 6 / 7. Confirm exact device compatibility before purchase. The charger contains a weak magnet. Actual charging speed depends on the device and power supply. Supplier package list: charger, charging cable and English manual; no power adapter is listed. Devices in the image are for illustration.',
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
