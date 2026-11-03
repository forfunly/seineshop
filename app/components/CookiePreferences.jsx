import {useAnalytics} from '@shopify/hydrogen';
import {useLocale} from '~/lib/i18n';

export function CookiePreferences() {
  const {privacyBanner} = useAnalytics();
  const {t} = useLocale();
  return (
    <button
      type="button"
      className="cookie-settings"
      disabled={!privacyBanner}
      title={!privacyBanner ? t('Cookie settings are loading') : undefined}
      onClick={() => privacyBanner?.showPreferences()}
    >
      {t('Cookie settings')}
    </button>
  );
}
