export {dropshippingAction as action} from '~/lib/dropshipping.server';
export function loader() {return new Response(null, {status: 405, headers: {'Allow': 'POST', 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow'}});}
