import {useLocale} from '~/lib/i18n';
import {redirect, useLoaderData} from 'react-router';
import {Money, Image} from '@shopify/hydrogen';
import {CUSTOMER_ORDER_QUERY} from '~/graphql/customer-account/CustomerOrderQuery';

/**
 * @type {Route.MetaFunction}
 */
export const meta = ({data}) => {
  return [
    {
      title: `Order ${data?.order?.name}`,
    },
  ];
};

/**
 * @param {Route.LoaderArgs}
 */
export async function loader({params, context}) {
  const {customerAccount} = context;
  if (!params.id) {
    return redirect('/account/orders');
  }
  const orderId = atob(params.id);
  const {data, errors} = await customerAccount.query(CUSTOMER_ORDER_QUERY, {
    variables: {
      orderId,
      language: customerAccount.i18n.language,
    },
  });
  if (errors?.length || !data?.order) {
    throw new Error('Order not found');
  }
  const {order} = data;

  // Extract line items directly from nodes array
  const lineItems = order.lineItems.nodes;

  // Extract discount applications directly from nodes array
  const discountApplications = order.discountApplications.nodes;

  // Get fulfillment status from first fulfillment node
  const fulfillmentStatus = order.fulfillments.nodes[0]?.status ?? 'N/A';

  // Get first discount value with proper type checking
  const firstDiscount = discountApplications[0]?.value;

  // Type guard for MoneyV2 discount
  const discountValue =
    firstDiscount?.__typename === 'MoneyV2' ? firstDiscount : null;

  // Type guard for percentage discount
  const discountPercentage =
    firstDiscount?.__typename === 'PricingPercentageValue'
      ? firstDiscount.percentage
      : null;
  return {
    order,
    lineItems,
    discountValue,
    discountPercentage,
    fulfillmentStatus,
  };
}
export default function OrderRoute() {
  const {t, localize, locale} = useLocale();
  /** @type {LoaderReturnData} */
  const {
    order,
    lineItems,
    discountValue,
    discountPercentage,
    fulfillmentStatus,
  } = useLoaderData();
  return (
    <div className="account-order">
      <h2>
        {t('Order')}
        {order.name}
      </h2>
      <p>
        {t('Placed on')}
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
      <br />
      <div>
        <table>
          <thead>
            <tr>
              <th scope="col">{t('Product')}</th>
              <th scope="col">{t('Price')}</th>
              <th scope="col">{t('Quantity')}</th>
              <th scope="col">{t('Total')}</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((lineItem, lineItemIndex) => (
              // eslint-disable-next-line react/no-array-index-key
              <OrderLineRow key={lineItemIndex} lineItem={lineItem} />
            ))}
          </tbody>
          <tfoot>
            {((discountValue && discountValue.amount) ||
              discountPercentage) && (
              <tr>
                <th scope="row" colSpan={3}>
                  <p>{t('Discounts')}</p>
                </th>
                <th scope="row">
                  <p>{t('Discounts')}</p>
                </th>
                <td>
                  {t(
                    discountPercentage ? (
                      <span>
                        -{t(discountPercentage)}
                        {t('% OFF')}
                      </span>
                    ) : (
                      discountValue && <Money data={discountValue} />
                    ),
                  )}
                </td>
              </tr>
            )}
            <tr>
              <th scope="row" colSpan={3}>
                <p>{t('Subtotal')}</p>
              </th>
              <th scope="row">
                <p>{t('Subtotal')}</p>
              </th>
              <td>
                <Money data={order.subtotal} />
              </td>
            </tr>
            <tr>
              <th scope="row" colSpan={3}>
                {t('Tax')}
              </th>
              <th scope="row">
                <p>{t('Tax')}</p>
              </th>
              <td>
                <Money data={order.totalTax} />
              </td>
            </tr>
            <tr>
              <th scope="row" colSpan={3}>
                {t('Total')}
              </th>
              <th scope="row">
                <p>{t('Total')}</p>
              </th>
              <td>
                <Money data={order.totalPrice} />
              </td>
            </tr>
          </tfoot>
        </table>
        <div>
          <h3>{t('Shipping Address')}</h3>
          {t(
            order?.shippingAddress ? (
              <address>
                <p>{t(order.shippingAddress.name)}</p>
                {order.shippingAddress.formatted ? (
                  <p>{t(order.shippingAddress.formatted)}</p>
                ) : (
                  ''
                )}
                {order.shippingAddress.formattedArea ? (
                  <p>{t(order.shippingAddress.formattedArea)}</p>
                ) : (
                  ''
                )}
              </address>
            ) : (
              <p>{t('No shipping address defined')}</p>
            ),
          )}
          <h3>{t('Status')}</h3>
          <div>
            <p>{t(fulfillmentStatus)}</p>
          </div>
        </div>
      </div>
      <br />
      <p>
        <a
          target="_blank"
          href={localize(order.statusPageUrl)}
          rel="noreferrer"
        >
          {t('View Order Status \u2192')}
        </a>
      </p>
    </div>
  );
}

/**
 * @param {{lineItem: OrderLineItemFullFragment}}
 */
function OrderLineRow({lineItem}) {
  const {t} = useLocale();
  return (
    <tr key={lineItem.id}>
      <td>
        <div>
          {lineItem?.image && (
            <div>
              <Image data={lineItem.image} width={96} height={96} />
            </div>
          )}
          <div>
            <p>{t(lineItem.title)}</p>
            <small>{t(lineItem.variantTitle)}</small>
          </div>
        </div>
      </td>
      <td>
        <Money data={lineItem.price} />
      </td>
      <td>{t(lineItem.quantity)}</td>
      <td>
        <Money data={lineItem.totalDiscount} />
      </td>
    </tr>
  );
}

/** @typedef {import('./+types/account.orders.$id').Route} Route */
/** @typedef {import('customer-accountapi.generated').OrderLineItemFullFragment} OrderLineItemFullFragment */
/** @typedef {import('customer-accountapi.generated').OrderQuery} OrderQuery */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
