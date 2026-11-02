import {useLocale} from '~/lib/i18n';
import {
  data as remixData,
  Form,
  NavLink,
  Outlet,
  useLoaderData,
} from 'react-router';
import {CUSTOMER_DETAILS_QUERY} from '~/graphql/customer-account/CustomerDetailsQuery';
export function shouldRevalidate() {
  return true;
}

/**
 * @param {Route.LoaderArgs}
 */
export async function loader({context}) {
  const {customerAccount} = context;
  const {data, errors} = await customerAccount.query(CUSTOMER_DETAILS_QUERY, {
    variables: {
      language: customerAccount.i18n.language,
    },
  });
  if (errors?.length || !data?.customer) {
    throw new Error('Customer not found');
  }
  return remixData(
    {
      customer: data.customer,
    },
    {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    },
  );
}
export default function AccountLayout() {
  const {t} = useLocale();
  /** @type {LoaderReturnData} */
  const {customer} = useLoaderData();
  const heading = customer
    ? customer.firstName
      ? `Welcome, ${customer.firstName}`
      : `Welcome to your account.`
    : 'Account Details';
  return (
    <div className="account">
      <h1>{t(heading)}</h1>
      <br />
      <AccountMenu />
      <br />
      <br />
      <Outlet
        context={{
          customer,
        }}
      />
    </div>
  );
}
function AccountMenu() {
  const {t, localize} = useLocale();
  function isActiveStyle({isActive, isPending}) {
    return {
      fontWeight: isActive ? 'bold' : undefined,
      color: isPending ? 'grey' : 'black',
    };
  }
  return (
    <nav role="navigation">
      <NavLink to={localize('/account/orders')} style={isActiveStyle}>
        {t('Orders')}
      </NavLink>
      <NavLink to={localize('/account/profile')} style={isActiveStyle}>
        {t('Profile')}
      </NavLink>
      <NavLink to={localize('/account/addresses')} style={isActiveStyle}>
        {t('Addresses')}
      </NavLink>
      <Logout />
    </nav>
  );
}
function Logout() {
  const {t, localize} = useLocale();
  return (
    <Form
      className="account-logout"
      method="POST"
      action={localize('/account/logout')}
    >
      &nbsp;<button type="submit">{t('Sign out')}</button>
    </Form>
  );
}

/** @typedef {import('./+types/account').Route} Route */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
