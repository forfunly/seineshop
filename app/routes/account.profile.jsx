import {useLocale} from '~/lib/i18n';
import {customerProfileAction} from '~/lib/customer-profile.server';
import {Form, useActionData, useNavigation, useOutletContext} from 'react-router';

export const meta = () => [{title: 'My profile | Seine Shop'}];
export const headers = () => ({'Cache-Control': 'private, no-store'});

export async function loader({context}) {
  await context.customerAccount.handleAuthStatus();
  return {};
}

export const action = customerProfileAction;

export default function AccountProfile() {
  const {t} = useLocale();
  const account = /** @type {{customer: CustomerFragment}} */ (useOutletContext());
  const {state} = useNavigation();
  const result = /** @type {ProfileActionData | undefined} */ (useActionData());
  const customer = result?.success && result.customer ? result.customer : account.customer;
  const marketing = customer.emailAddress?.marketingState;
  const statuses = {
    SUBSCRIBED: 'Subscribed',
    PENDING: 'Awaiting email confirmation',
    NOT_SUBSCRIBED: 'Not subscribed',
    UNSUBSCRIBED: 'Not subscribed',
  };
  const canChangeMarketing = Boolean(customer.emailAddress?.emailAddress && statuses[marketing]);
  const subscribed = ['SUBSCRIBED', 'PENDING'].includes(marketing);
  const busy = state !== 'idle';
  return (
    <div className="account-profile">
      <h2>{t('My profile')}</h2>
      <p>{t('Email')}: {customer.emailAddress?.emailAddress || t('Unavailable')}</p>
      <Form method="POST" className="account-profile-form"
        key={`${customer.id}:${customer.firstName}:${customer.lastName}`}>
        <input type="hidden" name="intent" value="profile" />
        <fieldset disabled={busy}>
          <legend>{t('Personal information')}</legend>
          <label htmlFor="firstName">{t('First name')}</label>
          <input id="firstName" name="firstName" type="text" autoComplete="given-name"
            defaultValue={customer.firstName ?? ''} maxLength={255} />
          <label htmlFor="lastName">{t('Last name')}</label>
          <input id="lastName" name="lastName" type="text" autoComplete="family-name"
            defaultValue={customer.lastName ?? ''} maxLength={255} />
          <button type="submit">{t(busy ? 'Updating' : 'Update')}</button>
        </fieldset>
      </Form>
      <section className="account-marketing" aria-labelledby="marketing-heading">
        <h3 id="marketing-heading">{t('Email preferences')}</h3>
        <p>{t('Subscription status')}: {t(statuses[marketing] || 'Unavailable')}</p>
        <p>{t('Choose whether to receive product news and offers by email. You can change your preference here.')}</p>
        {canChangeMarketing && (
          <Form method="POST">
            <input type="hidden" name="intent" value={subscribed ? 'unsubscribe' : 'subscribe'} />
            <button type="submit" disabled={busy}>
              {t(busy ? 'Updating' : subscribed ? 'Unsubscribe from marketing emails' : 'Subscribe to marketing emails')}
            </button>
          </Form>
        )}
        {!canChangeMarketing && <p>{t('Email preferences are unavailable. Please try again later.')}</p>}
      </section>
      {result?.error && <p role="alert">{t(result.error)}</p>}
      {result?.success && <p role="status">{t(result.message)}</p>}
    </div>
  );
}

/** @typedef {import('customer-accountapi.generated').CustomerFragment} CustomerFragment */
/** @typedef {{success: boolean, customer?: CustomerFragment, error?: string, message?: string}} ProfileActionData */
