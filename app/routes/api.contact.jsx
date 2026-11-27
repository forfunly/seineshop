import {contactBootstrap, submitContact} from '../lib/contact.server.js';

export function loader({request, context}) {
  if (request.method !== 'GET') return new Response(null, {status: 405, headers: {'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow'}});
  return contactBootstrap(context);
}

export function action({request, context}) {
  return submitContact(request, context);
}
