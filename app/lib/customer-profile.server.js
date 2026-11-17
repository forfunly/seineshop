import {CUSTOMER_DETAILS_QUERY} from '../graphql/customer-account/CustomerDetailsQuery.js';
import {CUSTOMER_UPDATE_MUTATION} from '../graphql/customer-account/CustomerUpdateMutation.js';
import {
  CUSTOMER_MARKETING_SUBSCRIBE_MUTATION,
  CUSTOMER_MARKETING_UNSUBSCRIBE_MUTATION,
} from '../graphql/customer-account/CustomerMarketingMutations.js';

const headers = {'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow'};
const reply = (body, status = 200) => Response.json(body, {status, headers});
const failure = (error, status = 400) => reply({error, success: false}, status);

async function readCustomer(customerAccount) {
  const result = await customerAccount.query(CUSTOMER_DETAILS_QUERY, {
    variables: {language: customerAccount.i18n.language},
  });
  if (result.errors?.length || !result.data?.customer?.id) throw new Error('Unavailable');
  return result.data.customer;
}

/** All writes use the authenticated Shopify customer; no Admin credentials or client identity. */
export async function customerProfileAction({request, context}) {
  if (!['POST', 'PUT'].includes(request.method)) return failure('Method not allowed', 405);
  if (request.headers.get('Origin') !== new URL(request.url).origin) {
    return failure('Please reload this page and try again.', 403);
  }
  const {customerAccount} = context;
  try {
    if (!await customerAccount.isLoggedIn()) return failure('Please sign in again.', 401);
  } catch {
    return failure('Please sign in again.', 401);
  }
  let form;
  try { form = await request.formData(); } catch {
    return failure('Please reload this page and try again.');
  }
  const intent = form.get('intent');
  if (form.getAll('intent').length !== 1 || !['profile', 'subscribe', 'unsubscribe'].includes(intent)) {
    return failure('Please reload this page and try again.');
  }
  const customerInput = {};
  if (intent === 'profile') {
    for (const key of ['firstName', 'lastName']) {
      const value = form.get(key);
      if (form.getAll(key).length !== 1 || typeof value !== 'string' || value.trim().length > 255 ||
        Array.from(value).some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)) {
        return failure('Enter a valid name of up to 255 characters.');
      }
      customerInput[key] = value.trim();
    }
  }
  let writeAttempted = false;
  try {
    const before = await readCustomer(customerAccount);
    const state = before.emailAddress?.marketingState;
    if (intent !== 'profile' && (!before.emailAddress?.emailAddress || !['SUBSCRIBED', 'UNSUBSCRIBED', 'NOT_SUBSCRIBED', 'PENDING'].includes(state))) {
      return failure('Email preferences are unavailable. Please try again later.', 409);
    }
    const alreadySet = (intent === 'subscribe' && ['SUBSCRIBED', 'PENDING'].includes(state)) ||
      (intent === 'unsubscribe' && ['UNSUBSCRIBED', 'NOT_SUBSCRIBED'].includes(state));
    if (!alreadySet) {
      writeAttempted = true;
      const mutation = intent === 'profile' ? CUSTOMER_UPDATE_MUTATION : intent === 'subscribe'
        ? CUSTOMER_MARKETING_SUBSCRIBE_MUTATION : CUSTOMER_MARKETING_UNSUBSCRIBE_MUTATION;
      const result = await customerAccount.mutate(mutation, intent === 'profile'
        ? {variables: {customer: customerInput, language: customerAccount.i18n.language}} : {});
      const payload = result.data?.[intent === 'profile' ? 'customerUpdate' : intent === 'subscribe'
        ? 'customerEmailMarketingSubscribe' : 'customerEmailMarketingUnsubscribe'];
      if (result.errors?.length || !payload || payload.userErrors?.length ||
        !(intent === 'profile' ? payload.customer : payload.emailAddress)) {
        return failure('Your changes could not be confirmed. Refresh this page to check before trying again.', 409);
      }
    }
    const after = await readCustomer(customerAccount);
    const verified = after.id === before.id && (intent === 'profile'
      ? ['firstName', 'lastName'].every((key) => (after[key] || '') === customerInput[key])
      : (intent === 'subscribe' ? ['SUBSCRIBED', 'PENDING'] : ['UNSUBSCRIBED', 'NOT_SUBSCRIBED']).includes(after.emailAddress?.marketingState));
    if (!verified) return failure('Your changes could not be confirmed. Refresh this page to check before trying again.', 409);
    const message = intent === 'profile' ? 'Your profile has been saved.'
      : intent === 'unsubscribe' ? 'You have unsubscribed from marketing emails.'
        : after.emailAddress.marketingState === 'PENDING' ? 'Your subscription is awaiting email confirmation.'
          : 'You are subscribed to marketing emails.';
    return reply({success: true, intent, message, customer: after});
  } catch {
    return failure(writeAttempted
      ? 'Your changes could not be confirmed. Refresh this page to check before trying again.'
      : 'Your account could not be loaded. Please refresh this page and try again.', 503);
  }
}
