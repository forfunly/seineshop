import {MARKET_COUNTRIES, LOCALIZATION_QUERY, marketReturnTo} from './markets.js';
export async function applyMarket(form, context) {
  const country = form.get('country');
  const destination = marketReturnTo(form.get('returnTo'), form.get('language'));
  if (!MARKET_COUNTRIES.includes(country) || !destination) return {error: 'Choose a supported country and language.'};
  const {localization} = await context.storefront.query(LOCALIZATION_QUERY, {variables: {country, language: 'EN'}});
  const selected = localization.availableCountries.find((item) => item.isoCode === country);
  if (!selected || selected.currency.isoCode !== form.get('currency')) return {error: 'Currency options have changed. Please refresh and try again.'};
  if (context.cart.getCartId()) {
    const result = await context.cart.updateBuyerIdentity({countryCode: country});
    if (result.errors?.length || result.warnings?.length || !result.cart) return {error: 'Your cart could not be updated. Please review your cart and try again.'};
  }
  context.session.set('marketCountry', country);
  return {destination};
}
