export const CUSTOMER_CREDIT_QUERY = `#graphql
  query CustomerCredit($after: String, $language: LanguageCode) @inContext(language: $language) {
    customer {
      storeCreditAccounts(first: 50, after: $after) {
        nodes { id balance { amount currencyCode } }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
`;
