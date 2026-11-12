import {siteSettings} from '~/lib/seo';
import {siteGuideResponse} from '~/lib/site-guide';

export function loader({request, context}) {
  return siteGuideResponse(siteSettings(context.env, request.url));
}
