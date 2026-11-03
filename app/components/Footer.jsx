import {MarketSelector} from '~/components/MarketSelector';
import {useLocale} from '~/lib/i18n';
import {Link} from 'react-router';
import {CookiePreferences} from '~/components/CookiePreferences';
export function Footer() {
  const {t, localize} = useLocale();
  return (
    <footer className="market-footer">
      <div className="footer-columns">
        <div>
          <Link className="brand" to={localize('/')}>
            {t('seine')}
            <span>{t('shop')}</span>
          </Link>
          <p>
            {t('Thoughtful tech.')}
            <br />
            {t('Everyday possibilities.')}
          </p>
          <a href={localize('mailto:hello@seineshop.com')}>
            {t('hello@seineshop.com')}
          </a>
        </div>
        <nav aria-label={t('Footer shop')}>
          <h2>{t('Shop & discover')}</h2>
          <Link to={localize('/collections')}>{t('All collections')}</Link>
          <Link to={localize('/collections/iphone-18-pro-max')}>
            {t('iPhone 18 Pro Max')}
          </Link>
          <Link to={localize('/discover/b20a')}>{t('Charging edit')}</Link>
          <Link to={localize('/search')}>{t('Search products')}</Link>
          <Link to={localize('/blogs/journal')}>{t('Journal & guides')}</Link>
        </nav>
        <nav aria-label={t('Footer support')}>
          <h2>{t('Customer support')}</h2>
          <Link to={localize('/support')}>{t('Support center')}</Link>
          <Link to={localize('/support#compatibility')}>
            {t('Product compatibility')}
          </Link>
          <Link to={localize('/support#orders')}>{t('Orders & delivery')}</Link>
          <a href={localize('mailto:hello@seineshop.com')}>{t('Contact us')}</a>
        </nav>
        <nav aria-label={t('Footer policies')}>
          <h2>{t('Store information')}</h2>
          <Link to={localize('/policies')}>{t('Store policies')}</Link>
          <Link to={localize('/support#returns')}>
            {t('Returns & refunds')}
          </Link>
          <CookiePreferences />
          <div className="footer-shopping-preferences"><MarketSelector /></div>
        </nav>
      </div>
      <div className="footer-bottom">
        <small>
          © {new Date().getFullYear()}
          {t('SeineShop. All rights reserved.')}
        </small>
        <span>{t('Everyday tech, thoughtfully chosen.')}</span>
      </div>
    </footer>
  );
}
