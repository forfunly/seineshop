import {LOCALES, localizePath} from './locale.js';
// Launch regions authorized for this storefront; currencies always come from Shopify.
export const MARKET_COUNTRIES = 'US JP GB CA AU AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE'.split(' ');
export const marketCountry = (value) => MARKET_COUNTRIES.includes(value) ? value : 'US';
export function marketReturnTo(value, language) {
  const locale = LOCALES.find((item) => item.code === language);
  if (!locale) return null;
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\\\r\n]/.test(value)) return localizePath('/', locale);
  const url = new URL(value, 'https://return.invalid');
  if (url.origin !== 'https://return.invalid') return localizePath('/', locale);
  return localizePath(url.pathname, locale) + url.search + url.hash;
}
export const LOCALIZATION_QUERY = `#graphql
  query MarketLocalization($country: CountryCode!, $language: LanguageCode!) @inContext(country: $country, language: $language) {
    localization {
      country { isoCode name currency { isoCode name symbol } }
      availableCountries { isoCode name currency { isoCode name symbol } }
    }
  }
`;
