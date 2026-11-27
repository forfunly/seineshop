import {data, Link, useLoaderData} from 'react-router';
import {Money} from '@shopify/hydrogen';
import {useLocale} from '~/lib/i18n';
import {loadCustomerCredit} from '~/lib/customer-credit.server';

const privateHeaders = {'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow'};
export function headers() {return privateHeaders;}
export async function loader({context}) {
  return data(await loadCustomerCredit(context.customerAccount), {headers: privateHeaders});
}
export default function Credits() {
  const {t, localize} = useLocale();
  const {accounts, unavailable} = useLoaderData();
  return <section className="navigation-page">
    <h2>{t('Account Credits')}</h2><p>{t('Store credit balances are shown in their original currencies. Eligible credit can be used at checkout when signed in.')}</p>
    {unavailable ? <p role="alert">{t('Your store credit balance is temporarily unavailable. Please try again later.')}</p>
      : accounts.length ? <div className="help-contact-cards">{accounts.map((account) => <article key={account.id}><h3>{account.balance.currencyCode}</h3><Money data={account.balance} /></article>)}</div>
        : <div className="navigation-empty"><p>{t('No store credit accounts are available.')}</p></div>}
    <Link to={localize('/collections')}>{t('Browse collections')}</Link>
  </section>;
}
