import {dropshipReturnPath} from '~/lib/dropshipping';
/**
 * @param {Route.LoaderArgs}
 */
export async function loader({context}) {
  const response = await context.customerAccount.authorize();
  // Attach the authenticated buyer to an existing guest cart before checkout.
  const existingCart = await context.cart.get();
  if (existingCart?.id) {
    const result = await context.cart.updateBuyerIdentity({});
    if (result.errors?.length) {
      console.error(
        'Unable to attach customer to cart',
        result.errors.map((error) => error.code),
      );
    }
  }
  const locale = context.session.get('storefrontLocale');
  const returnTo = dropshipReturnPath(context.session.get('accountReturnTo'));
  context.session.unset('accountReturnTo');
  if (returnTo) response.headers.set('Location', returnTo);
  else if (['jp', 'de'].includes(locale))
    response.headers.set('Location', `/${locale}/account/orders`);
  return response;
}

/** @typedef {import('./+types/account_.authorize').Route} Route */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
