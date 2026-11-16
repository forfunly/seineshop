import {MARKET_COUNTRIES} from './markets.js';
import {SHIPPING_REGIONS} from './shipping-regions.js';
import {businessResponse, businessSessionValues, guardBusinessRequest, limitedBody} from './business-tools.server.js';

const HEADERS = {'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow'};
const response = (value, status = 200) => Response.json(value, {status, headers: HEADERS});

const COUNTRIES_QUERY = `#graphql
  query ShippingQuoteCountries($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    localization { availableCountries { isoCode name } }
  }
`;

const QUOTE_MUTATION = `#graphql
  mutation ProductShippingQuote($input: CartInput!, $country: CountryCode!, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    cartCreate(input: $input) {
      cart {
        lines(first: 2) { nodes { quantity merchandise { ... on ProductVariant { id requiresShipping } } } }
        deliveryGroups(first: 10) {
          nodes { deliveryOptions { title description estimatedCost { amount currencyCode } } }
          pageInfo { hasNextPage }
        }
      }
      userErrors { code }
      warnings { code }
    }
  }
`;

export function shippingInput(input) {
  if (!input || typeof input !== 'object' ||
    typeof input.merchandiseId !== 'string' ||
    !/^gid:\/\/shopify\/ProductVariant\/[1-9]\d*$/.test(input.merchandiseId || '') ||
    !Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 9999 ||
    !MARKET_COUNTRIES.includes(input.countryCode)) return null;
  const address = {countryCode: input.countryCode};
  for (const [name, max] of [['address1', 255], ['city', 100], ['provinceCode', 100], ['zip', 32]]) {
    const value = input[name];
    if (typeof value !== 'string' || value.length > max || [...value].some((char) => char.codePointAt(0) < 32 || char.codePointAt(0) === 127)) return null;
    address[name] = value.trim();
  }
  if (!address.address1 || !address.city || !address.zip ||
    (SHIPPING_REGIONS[input.countryCode] && !SHIPPING_REGIONS[input.countryCode].some(({code}) => code === address.provinceCode))) return null;
  return {
    lines: [{merchandiseId: input.merchandiseId, quantity: input.quantity}],
    buyerIdentity: {countryCode: input.countryCode},
    delivery: {addresses: [{address: {deliveryAddress: address}, selected: true, oneTimeUse: true}]},
  };
}

export async function shippingQuoteLoader({context}) {
  return businessResponse(async () => {
    const {localization} = await context.storefront.query(COUNTRIES_QUERY, {
      variables: context.storefront.i18n, cache: context.storefront.CacheNone(),
    });
    const countries = localization.availableCountries.filter(({isoCode}) => MARKET_COUNTRIES.includes(isoCode));
    return response({success: true, countries, country: context.storefront.i18n.country, csrf: businessSessionValues(context).csrf});
  });
}

export async function shippingQuoteAction({request, context}) {
  return businessResponse(async () => {
    if (request.method !== 'POST') return response({success: false, code: 'invalid'}, 405);
    guardBusinessRequest(request, context);
    if (!request.headers.get('content-type')?.startsWith('application/json')) return response({success: false, code: 'invalid'}, 415);
    let input;
    try { input = JSON.parse(await (await limitedBody(request, 8192)).text()); }
    catch (error) {
      if (error.code) throw error;
      return response({success: false, code: 'invalid'}, 400);
    }
    const cartInput = shippingInput(input);
    if (!cartInput) return response({success: false, code: 'invalid'}, 400);
    // Direct mutation keeps the estimate separate from context.cart and its cookie.
    const result = await context.storefront.mutate(QUOTE_MUTATION, {
      variables: {input: cartInput, country: input.countryCode, language: context.storefront.i18n.language},
    });
    const created = result.cartCreate;
    if (result.errors?.length || created?.userErrors?.length || !created?.cart) return response({success: false, code: 'unavailable'}, 503);
    const lines = created.cart.lines?.nodes;
    if (created.warnings?.length || lines?.length !== 1 || lines[0].quantity !== input.quantity || lines[0].merchandise.id !== input.merchandiseId) {
      return response({success: false, code: 'stock'}, 409);
    }
    if (!lines[0].merchandise.requiresShipping) return response({success: true, status: 'not-required', groups: []});
    const groups = created.cart.deliveryGroups;
    if (!groups || groups.pageInfo?.hasNextPage) return response({success: false, code: 'unavailable'}, 503);
    // No cart identifiers, addresses or checkout URLs leave this resource.
    const options = groups.nodes.map((group, groupIndex) => ({id: `shipment-${groupIndex + 1}`, options: group.deliveryOptions.map((option, optionIndex) => ({
      id: `option-${optionIndex + 1}`,
      title: option.title, description: option.description,
      cost: {amount: option.estimatedCost.amount, currencyCode: option.estimatedCost.currencyCode},
    }))}));
    if (options.some((group) => group.options.some(({cost}) => !Number.isFinite(Number(cost.amount)) || Number(cost.amount) < 0))) return response({success: false, code: 'unavailable'}, 503);
    return response({success: true, status: options.length && options.every((group) => group.options.length) ? 'ready' : 'no-rates', groups: options});
  });
}
