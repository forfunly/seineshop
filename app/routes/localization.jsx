import {data, redirectDocument} from 'react-router';
import {applyMarket} from '~/lib/markets.server';
export async function action({request, context}) {
  const headers = {'Cache-Control': 'private, no-store'};
  if (request.headers.get('Origin') !== new URL(request.url).origin) return data({error: 'Invalid request.'}, {status: 403, headers});
  try {
    const result = await applyMarket(await request.formData(), context);
    if (result.error) return data(result, {status: 422, headers});
    return redirectDocument(result.destination, {status: 303, headers});
  } catch {
    return data({error: 'Unable to update your preferences. Please try again.'}, {status: 503, headers});
  }
}
export function loader() { return new Response('Method not allowed', {status:405,headers:{Allow:'POST'}}); }
