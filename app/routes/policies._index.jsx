import {useLocale} from '~/lib/i18n';
import {useLoaderData, Link} from 'react-router';

/**
 * @param {Route.LoaderArgs}
 */
export async function loader({context}) {
  const data = await context.storefront.query(POLICIES_QUERY);
  const shopPolicies = data.shop;
  const policies = [
    shopPolicies?.privacyPolicy,
    shopPolicies?.shippingPolicy,
    shopPolicies?.termsOfService,
    shopPolicies?.refundPolicy,
    shopPolicies?.subscriptionPolicy,
  ].filter((policy) => policy != null);
  return {
    policies,
  };
}
export default function Policies() {
  const {t, localize} = useLocale();
  /** @type {LoaderReturnData} */
  const {policies} = useLoaderData();
  return (
    <div className="policies">
      <h1>{t('Store policies')}</h1>
      {!policies.length && (
        <p>
          {t(
            'Our store is preparing to launch. Shipping and return policies will be available before ordering opens. Questions?',
          )}
          <a href={localize('mailto:hello@seineshop.com')}>
            {t('Contact SeineShop')}
          </a>
          .
        </p>
      )}
      <div>
        {policies.map((policy) => (
          <fieldset key={policy.id}>
            <Link to={localize(`/policies/${policy.handle}`)}>
              {t(policy.title)}
            </Link>
          </fieldset>
        ))}
      </div>
    </div>
  );
}
const POLICIES_QUERY = `#graphql
  fragment PolicyItem on ShopPolicy {
    id
    title
    handle
  }
  query Policies ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    shop {
      privacyPolicy {
        ...PolicyItem
      }
      shippingPolicy {
        ...PolicyItem
      }
      termsOfService {
        ...PolicyItem
      }
      refundPolicy {
        ...PolicyItem
      }
      subscriptionPolicy {
        id
        title
        handle
      }
    }
  }
`;

/** @typedef {import('./+types/policies._index').Route} Route */
/** @typedef {import('storefrontapi.generated').PoliciesQuery} PoliciesQuery */
/** @typedef {import('storefrontapi.generated').PolicyItemFragment} PolicyItemFragment */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
