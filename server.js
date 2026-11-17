import {localizedRedirectPath, stripLocale} from '~/lib/locale';
import * as serverBuild from 'virtual:react-router/server-build';
import {createRequestHandler, storefrontRedirect} from '@shopify/hydrogen';
import {createHydrogenRouterContext} from '~/lib/context';
import {developmentRequest} from '~/lib/development-request.server';
import {checkoutReceipt} from '~/lib/ga4-endpoints.server';

/**
 * Export a fetch handler in module format.
 */
export default {
  /**
   * @param {Request} request
   * @param {Env} env
   * @param {ExecutionContext} executionContext
   * @return {Promise<Response>}
   */
  async fetch(request, env, executionContext) {
    try {
      request = developmentRequest(request, import.meta.env?.DEV === true);
      const requestUrl = new URL(request.url);
      // Shopify's pixel sandbox uses an opaque origin and a CORS preflight.
      if (requestUrl.pathname === '/api/ga4-checkout' && request.method === 'OPTIONS') {
        return checkoutReceipt(request, env);
      }
      if (['/jp', '/de'].includes(requestUrl.pathname)) {
        requestUrl.pathname += '/';
        return Response.redirect(requestUrl.href, 301);
      }
      const hydrogenContext = await createHydrogenRouterContext(
        request,
        env,
        executionContext,
      );

      /**
       * Create a Hydrogen request handler that internally
       * delegates to React Router for routing and rendering.
       */
      const handleRequest = createRequestHandler({
        build: serverBuild,
        mode: process.env.NODE_ENV,
        getLoadContext: () => hydrogenContext,
      });

      const response = await handleRequest(request);

      const destination = response.headers.get('Location');
      if (destination?.startsWith('/') && !destination.startsWith('//') && !requestUrl.pathname.endsWith('/localization')) {
        response.headers.set(
          'Location',
          localizedRedirectPath(
            destination,
            requestUrl.pathname,
          ),
        );
      }

      const privatePath = stripLocale(requestUrl.pathname).replace(/\.data$/, '');
      if (hydrogenContext.session.get('marketCountry') || privatePath === '/account' || privatePath.startsWith('/account/')) {
        response.headers.set('Cache-Control', 'private, no-store');
      }
      if (privatePath === '/account' || privatePath.startsWith('/account/')) {
        response.headers.set('X-Robots-Tag', 'noindex, nofollow');
      }

      if (hydrogenContext.session.isPending) {
        response.headers.append(
          'Set-Cookie',
          await hydrogenContext.session.commit(),
        );
      }

      if (response.status === 404) {
        /**
         * Check for redirects only when there's a 404 from the app.
         * If the redirect doesn't exist, then `storefrontRedirect`
         * will pass through the 404 response.
         */
        return storefrontRedirect({
          request,
          response,
          storefront: hydrogenContext.storefront,
        });
      }

      return response;
    } catch (error) {
      console.error(error);
      return new Response('An unexpected error occurred', {status: 500});
    }
  },
};
