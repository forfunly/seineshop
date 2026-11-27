import {CUSTOMER_CREDIT_QUERY} from '../graphql/customer-account/CustomerCreditQuery.js';

// Missing permission and network errors are not a zero balance.
export async function loadCustomerCredit(customerAccount) {
  const accounts = [];
  let after = null;
  try {
    do {
      const response = await customerAccount.query(CUSTOMER_CREDIT_QUERY, {
        variables: {after, language: customerAccount.i18n.language},
      });
      const connection = response.data?.customer?.storeCreditAccounts;
      if (response.errors?.length || !Array.isArray(connection?.nodes)) return {accounts: [], unavailable: true};
      accounts.push(...connection.nodes);
      if (!connection.pageInfo.hasNextPage) return {accounts, unavailable: false};
      if (!connection.pageInfo.endCursor || connection.pageInfo.endCursor === after) return {accounts: [], unavailable: true};
      after = connection.pageInfo.endCursor;
    } while (after);
  } catch (error) {
    if (error instanceof Response && error.status >= 300 && error.status < 400) throw error;
    return {accounts: [], unavailable: true};
  }
  return {accounts, unavailable: false};
}
