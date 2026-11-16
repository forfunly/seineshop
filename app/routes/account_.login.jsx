import {dropshipReturnPath} from '~/lib/dropshipping';
/**
 * @param {Route.LoaderArgs}
 */
export async function loader({request, context}) {
  const url = new URL(request.url);
  const acrValues = url.searchParams.get('acr_values') || undefined;
  const loginHint = url.searchParams.get('login_hint') || undefined;
  const loginHintMode = url.searchParams.get('login_hint_mode') || undefined;
  const locale = context.storefront.i18n.language.toLowerCase();
  context.session.set('storefrontLocale', locale === 'ja' ? 'jp' : locale);
  const returnTo = dropshipReturnPath(url.searchParams.get('returnTo'));
  if (returnTo) context.session.set('accountReturnTo', returnTo);
  else context.session.unset('accountReturnTo');

  return context.customerAccount.login({
    countryCode: context.storefront.i18n.country,
    acrValues,
    loginHint,
    loginHintMode,
    uiLocales: locale,
  });
}

/** @typedef {import('./+types/account_.login').Route} Route */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
