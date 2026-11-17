export const CUSTOMER_MARKETING_SUBSCRIBE_MUTATION = `#graphql
  mutation CustomerMarketingSubscribe {
    customerEmailMarketingSubscribe {
      emailAddress { emailAddress marketingState }
      userErrors { code field message }
    }
  }
`;

export const CUSTOMER_MARKETING_UNSUBSCRIBE_MUTATION = `#graphql
  mutation CustomerMarketingUnsubscribe {
    customerEmailMarketingUnsubscribe {
      emailAddress { emailAddress marketingState }
      userErrors { code field message }
    }
  }
`;
