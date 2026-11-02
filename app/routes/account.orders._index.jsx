import {useLocale} from '~/lib/i18n';
import {
  Link,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from 'react-router';
import {useRef} from 'react';
import {
  Money,
  getPaginationVariables,
  flattenConnection,
} from '@shopify/hydrogen';
import {
  buildOrderSearchQuery,
  parseOrderFilters,
  ORDER_FILTER_FIELDS,
} from '~/lib/orderFilters';
import {CUSTOMER_ORDERS_QUERY} from '~/graphql/customer-account/CustomerOrdersQuery';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';

/**
 * @type {Route.MetaFunction}
 */
export const meta = () => {
  return [
    {
      title: 'Orders',
    },
  ];
};

/**
 * @param {Route.LoaderArgs}
 */
export async function loader({request, context}) {
  const {customerAccount} = context;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 20,
  });
  const url = new URL(request.url);
  const filters = parseOrderFilters(url.searchParams);
  const query = buildOrderSearchQuery(filters);
  const {data, errors} = await customerAccount.query(CUSTOMER_ORDERS_QUERY, {
    variables: {
      ...paginationVariables,
      query,
      language: customerAccount.i18n.language,
    },
  });
  if (errors?.length || !data?.customer) {
    throw Error('Customer orders not found');
  }
  return {
    customer: data.customer,
    filters,
  };
}
export default function Orders() {
  /** @type {LoaderReturnData} */
  const {customer, filters} = useLoaderData();
  const {orders} = customer;
  return (
    <div className="orders">
      <OrderSearchForm currentFilters={filters} />
      <OrdersTable orders={orders} filters={filters} />
    </div>
  );
}

/**
 * @param {{
 *   orders: CustomerOrdersFragment['orders'];
 *   filters: OrderFilterParams;
 * }}
 */
function OrdersTable({orders, filters}) {
  const {t} = useLocale();
  const hasFilters = !!(filters.name || filters.confirmationNumber);
  return (
    <div className="acccount-orders" aria-live="polite">
      {t(
        orders?.nodes.length ? (
          <PaginatedResourceSection connection={orders}>
            {({node: order}) => <OrderItem key={order.id} order={order} />}
          </PaginatedResourceSection>
        ) : (
          <EmptyOrders hasFilters={hasFilters} />
        ),
      )}
    </div>
  );
}

/**
 * @param {{hasFilters?: boolean}}
 */
function EmptyOrders({hasFilters = false}) {
  const {t, localize} = useLocale();
  return (
    <div>
      {t(
        hasFilters ? (
          <>
            <p>{t('No orders found matching your search.')}</p>
            <br />
            <p>
              <Link to={localize('/account/orders')}>
                {t('Clear filters \u2192')}
              </Link>
            </p>
          </>
        ) : (
          <>
            <p>{t("You haven't placed any orders yet.")}</p>
            <br />
            <p>
              <Link to={localize('/collections')}>
                {t('Start Shopping \u2192')}
              </Link>
            </p>
          </>
        ),
      )}
    </div>
  );
}

/**
 * @param {{
 *   currentFilters: OrderFilterParams;
 * }}
 */
function OrderSearchForm({currentFilters}) {
  const {t} = useLocale();
  const [, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  const isSearching =
    navigation.state !== 'idle' &&
    navigation.location?.pathname?.includes('orders');
  const formRef = useRef(null);
  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    const name = formData.get(ORDER_FILTER_FIELDS.NAME)?.toString().trim();
    const confirmationNumber = formData
      .get(ORDER_FILTER_FIELDS.CONFIRMATION_NUMBER)
      ?.toString()
      .trim();
    if (name) params.set(ORDER_FILTER_FIELDS.NAME, name);
    if (confirmationNumber)
      params.set(ORDER_FILTER_FIELDS.CONFIRMATION_NUMBER, confirmationNumber);
    setSearchParams(params);
  };
  const hasFilters = currentFilters.name || currentFilters.confirmationNumber;
  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="order-search-form"
      aria-label={t('Search orders')}
    >
      <fieldset className="order-search-fieldset">
        <legend className="order-search-legend">{t('Filter Orders')}</legend>

        <div className="order-search-inputs">
          <input
            type="search"
            name={ORDER_FILTER_FIELDS.NAME}
            placeholder={t('Order #')}
            aria-label={t('Order number')}
            defaultValue={currentFilters.name || ''}
            className="order-search-input"
          />
          <input
            type="search"
            name={ORDER_FILTER_FIELDS.CONFIRMATION_NUMBER}
            placeholder={t('Confirmation #')}
            aria-label={t('Confirmation number')}
            defaultValue={currentFilters.confirmationNumber || ''}
            className="order-search-input"
          />
        </div>

        <div className="order-search-buttons">
          <button type="submit" disabled={isSearching}>
            {t(isSearching ? 'Searching' : 'Search')}
          </button>
          {hasFilters && (
            <button
              type="button"
              disabled={isSearching}
              onClick={() => {
                setSearchParams(new URLSearchParams());
                formRef.current?.reset();
              }}
            >
              {t('Clear')}
            </button>
          )}
        </div>
      </fieldset>
    </form>
  );
}

/**
 * @param {{order: OrderItemFragment}}
 */
function OrderItem({order}) {
  const {t, localize, locale} = useLocale();
  const fulfillmentStatus = flattenConnection(order.fulfillments)[0]?.status;
  return (
    <>
      <fieldset>
        <Link to={localize(`/account/orders/${btoa(order.id)}`)}>
          <strong>#{t(order.number)}</strong>
        </Link>
        <p>
          {new Date(order.processedAt).toLocaleDateString(locale.code, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'UTC',
          })}
        </p>
        {order.confirmationNumber && (
          <p>
            {t('Confirmation:')}
            {order.confirmationNumber}
          </p>
        )}
        <p>{t(order.financialStatus)}</p>
        {fulfillmentStatus && <p>{t(fulfillmentStatus)}</p>}
        <Money data={order.totalPrice} />
        <Link to={localize(`/account/orders/${btoa(order.id)}`)}>
          {t('View Order \u2192')}
        </Link>
      </fieldset>
      <br />
    </>
  );
}

/**
 * @typedef {{
 *   customer: CustomerOrdersFragment;
 *   filters: OrderFilterParams;
 * }} OrdersLoaderData
 */

/** @typedef {import('./+types/account.orders._index').Route} Route */
/** @typedef {import('~/lib/orderFilters').OrderFilterParams} OrderFilterParams */
/** @typedef {import('customer-accountapi.generated').CustomerOrdersFragment} CustomerOrdersFragment */
/** @typedef {import('customer-accountapi.generated').OrderItemFragment} OrderItemFragment */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
