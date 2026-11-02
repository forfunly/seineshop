import {useLocale} from '~/lib/i18n';
export function MockShopNotice() {
  const {t} = useLocale();
  return (
    <section
      className="mock-shop-notice"
      aria-labelledby="mock-shop-notice-heading"
    >
      <div className="inner">
        <h2 id="mock-shop-notice-heading">{t('Welcome to Hydrogen!')}</h2>
        <p>
          {t(
            'You\u2019re seeing mocked products because no store is connected to this project yet.',
          )}
        </p>
        <p>
          {t('Link a store by running')}
          <code>{t('npx shopify hydrogen link')}</code>
          {t('in your terminal.')}
        </p>
      </div>
    </section>
  );
}
