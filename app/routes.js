import {flatRoutes} from '@react-router/fs-routes';
import {hydrogenRoutes} from '@shopify/hydrogen';

const routes = await flatRoutes();
const localizedIndexes = [];
// Preserve route IDs for existing loader references and account nesting.
// Resource endpoints and the registered OAuth callback remain at stable URLs.
for (const route of routes) {
  if (route.path && /^(sitemap|:sitemap\.xml$|robots|account\/authorize)/.test(route.path))
    continue;
  if (route.index && !route.path) {
    localizedIndexes.push({...route, id: `${route.id}-localized`, index: undefined, path: ':locale'});
  } else if (route.index) {
    delete route.index;
    route.path = `:locale?/${route.path}`;
  } else {
    route.path = `:locale?/${route.path || ''}`;
  }
}
routes.push(...localizedIndexes);
// Suffix parameters receive a static score in React Router: exact XML routes
// must precede the generic XML filename route.
routes.sort((a, b) => Number(a.path === ':sitemap.xml') - Number(b.path === ':sitemap.xml'));
export default hydrogenRoutes(routes);
