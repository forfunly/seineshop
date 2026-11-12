import {redirect} from 'react-router';
import {localeFromPath, localizePath} from '~/lib/locale';

export function loader({request}) {
  const locale = localeFromPath(new URL(request.url).pathname);
  return redirect(localizePath('/page/order-tracking', locale), 301);
}
