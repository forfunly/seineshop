import {prepareProductDetails} from '~/lib/product-details';
import {BusinessInquiry, SalesContact} from '~/components/ProductBusiness';
import {useState} from 'react';
import {ProductStickyBar} from '~/components/ProductStickyBar';
import {ProductBuyingGuide} from '~/components/ProductBuyingGuide';
import {useLocale} from '~/lib/i18n';
import {Link, useLoaderData} from 'react-router';
import {
  getSelectedProductOptions,
  Analytics,
  useOptimisticVariant,
  getProductOptions,
  getAdjacentAndFirstAvailableVariants,
  useSelectedOptionInUrlParam,
} from '@shopify/hydrogen';
import {ProductSpecifications} from '~/components/ProductSpecifications';
import {ProductPrice} from '~/components/ProductPrice';
import {ProductGallery} from '~/components/ProductGallery';
import {ProductForm} from '~/components/ProductForm';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';

/**
 * @type {Route.MetaFunction}
 */
export const meta = ({data}) => {
  return [
    {
      title: `SeineShop | ${data?.product.title ?? ''}`,
    },
    {
      rel: 'canonical',
      href: `/products/${data?.product.handle}`,
    },
  ];
};

/**
 * @param {Route.LoaderArgs} args
 */
export async function loader(args) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);
  return {
    ...deferredData,
    ...criticalData,
  };
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 * @param {Route.LoaderArgs}
 */
async function loadCriticalData({context, params, request}) {
  const {handle} = params;
  const {storefront} = context;
  if (!handle) {
    throw new Error('Expected product handle to be defined');
  }
  const [{product}] = await Promise.all([
    storefront.query(PRODUCT_QUERY, {
      variables: {
        handle,
        selectedOptions: getSelectedProductOptions(request),
      },
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);
  if (!product?.id) {
    throw new Response(null, {
      status: 404,
    });
  }

  // The API handle might be localized, so redirect to the localized handle
  redirectIfHandleIsLocalized(request, {
    handle,
    data: product,
  });
  return {
    product,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 * @param {Route.LoaderArgs}
 */
function loadDeferredData({context, params}) {
  // Put any API calls that is not critical to be available on first page render
  // For example: product reviews, product recommendations, social feeds.

  return {};
}
export default function Product() {
  const {t, localize} = useLocale();
  /** @type {LoaderReturnData} */
  const {product} = useLoaderData();
  const [quantity, setQuantity] = useState('1');
  const hasBuyingGuide = product.handle === 'b-20a-3-in-1-foldable-wireless-charging-station';

  // Optimistically selects a variant with given available variant information
  const selectedVariant = useOptimisticVariant(
    product.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );

  // Sets the search param to the selected variant without navigation
  // only when no search params are set in the url
  useSelectedOptionInUrlParam(selectedVariant?.selectedOptions || []);

  // Get the product options array
  const productOptions = getProductOptions({
    ...product,
    selectedOrFirstAvailableVariant: selectedVariant,
  });
  const {title, descriptionHtml} = product;
  const details = prepareProductDetails(descriptionHtml);
  return (
    <div className="pdp-page">
      <nav className="pdp-breadcrumbs" aria-label={t('Breadcrumb')}>
        <Link to={localize('/')}>{t('Home')}</Link><span aria-hidden="true">/</span>
        <Link to={localize('/collections/all')}>{t('Shop')}</Link><span aria-hidden="true">/</span><span>{t(title)}</span>
      </nav>
      <div className="pdp-layout">
        <div className="pdp-visual-column"><ProductGallery key={selectedVariant?.id} images={product.images.nodes} selectedImage={selectedVariant?.image} title={t(title)} /><SalesContact/></div>
        <div className="pdp-summary">
          <p className="pdp-eyebrow">SEINESHOP / {t('Everyday essentials')}</p>
          <h1>{t(title)}</h1>
          <ProductPrice price={selectedVariant?.price} compareAtPrice={selectedVariant?.compareAtPrice} />
          <p className={`pdp-availability ${selectedVariant?.availableForSale ? 'is-available' : ''}`}>
            <span aria-hidden="true">●</span> {t(selectedVariant?.availableForSale ? 'Available to order' : 'Sold out')}
          </p>
          {hasBuyingGuide && <>
            <p className="pdp-intro">{t('One compact home for your daily charging routine. Fold it down, take it along, and keep your essentials together.')}</p>
            <div className="pdp-highlights">
              <span><b>3-in-1</b>{t('Phone · earbuds · watch')}</span>
              <span><b>15W</b>{t('Max. phone output')}</span>
              <span><b>USB-C</b>{t('Foldable design')}</span>
            </div>
            <p className="pdp-compatibility">{t('For Qi-compatible phones, wireless-charging earbuds and compatible Samsung Galaxy Watches. Check your device before ordering. Power adapter not included.')}</p>
          </>}
          <div id="product-purchase">
            <ProductForm key={product.id} productOptions={productOptions} selectedVariant={selectedVariant} quantity={quantity} setQuantity={setQuantity} />
          </div>
          <div className="pdp-payment-methods" role="group" aria-label={t('Payment options')}>
            {[['shop-pay', 'Shop Pay'], ['visa', 'Visa'], ['mastercard', 'Mastercard'], ['paypal', 'PayPal']].map(([key, name]) => (
              <span className={`pdp-payment-logo pdp-payment-logo--${key}`} key={key}>
                <img src={`/images/payments/${key}.svg`} alt={name} width="60" height="38" loading="lazy" />
              </span>
            ))}
          </div>
          <p className="pdp-payment-availability">{t('Available payment options are shown at checkout for your location and device.')}</p>
          <div className="pdp-service-links">
            <Link to={localize('/support#orders')}>{t('Orders & delivery')} ↗</Link>
            <Link to={localize('/support#returns')}>{t('Returns & refunds')} ↗</Link>
            <Link to={localize('/support#compatibility')}>{t('Product compatibility')} ↗</Link>
          </div>
          {selectedVariant?.sku && <p className="pdp-sku">SKU: {selectedVariant.sku}</p>}
        </div>
      </div>
      <div className="pdp-service-strip">
        <div><span aria-hidden="true">↗</span><div><strong>{t('Secure checkout')}</strong><p>{t('Pay through Shopify')}</p></div></div>
        <div><span aria-hidden="true">□</span><div><strong>{t('Delivery options')}</strong><p>{t('See rates before you pay')}</p></div></div>
        <div><span aria-hidden="true">↺</span><div><strong>{t('Returns & refunds')}</strong><Link to={localize('/policies')}>{t('View store policies')}</Link></div></div>
        <div><span aria-hidden="true">?</span><div><strong>{t('Here to help')}</strong><a href="mailto:steven@seineshop.com">steven@seineshop.com</a></div></div>
      </div>
      <nav className="pdp-section-nav" aria-label={t('Explore this product')}>
        {hasBuyingGuide && <><a href="#product-features">{t('Features')}</a><a href="#product-compatibility">{t('Compatibility')}</a></>}
        <a href="#business-inquiry">{t('Wholesale & customization')}</a>
        <a href="#product-specs">{t('Details & specifications')}</a>
        {hasBuyingGuide && <a href="#product-faq">{t('Questions & answers')}</a>}
      </nav>
      <BusinessInquiry key={product.id} product={product} variant={selectedVariant} quantity={quantity}/>
      {hasBuyingGuide && <ProductBuyingGuide />}
      <section className="pdp-details" id="product-specs" aria-label={t('Product details')}>
        <div><p className="pdp-eyebrow">{t('A closer look')}</p><h2>{t('Description')}</h2>
          <div className="pdp-description" dangerouslySetInnerHTML={{__html: details.description}} />
        </div>
        <ProductSpecifications metafield={product.technicalSpecifications} extraRows={details.rows} />
      </section>
      <ProductStickyBar title={title} variant={selectedVariant} quantity={quantity} />
      <Analytics.ProductView
        data={{
          products: [
            {
              id: product.id,
              title: product.title,
              price: selectedVariant?.price.amount || '0',
              vendor: product.vendor,
              variantId: selectedVariant?.id || '',
              variantTitle: selectedVariant?.title || '',
              quantity: 1,
            },
          ],
        }}
      />
    </div>
  );
}
const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    availableForSale
    compareAtPrice {
      amount
      currencyCode
    }
    id
    image {
      __typename
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
    selectedOptions {
      name
      value
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
  }
`;
const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    descriptionHtml
    images(first: 20) {
      nodes { id url altText width height }
    }
    technicalSpecifications: metafield(namespace: "custom", key: "technical_specifications") {
      value
    }
    description
    encodedVariantExistence
    encodedVariantAvailability
    options {
      name
      optionValues {
        name
        firstSelectableVariant {
          ...ProductVariant
        }
        swatch {
          color
          image {
            previewImage {
              url
            }
          }
        }
      }
    }
    selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
      ...ProductVariant
    }
    adjacentVariants (selectedOptions: $selectedOptions) {
      ...ProductVariant
    }
    seo {
      description
      title
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
`;
const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
    }
  }
  ${PRODUCT_FRAGMENT}
`;

/** @typedef {import('./+types/products.$handle').Route} Route */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
