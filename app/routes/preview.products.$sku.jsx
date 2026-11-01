import {useLocale} from '~/lib/i18n';
import {Link, useLoaderData} from 'react-router';
import {previewEnabled, previewProduct} from '~/lib/catalog.server';
export function loader({context, request, params}) {
  if (!previewEnabled(context, request))
    throw new Response('Not found', {
      status: 404,
    });
  const item = previewProduct(params.sku);
  if (!item)
    throw new Response('Not found', {
      status: 404,
    });
  return {
    preview: true,
    item,
    product: {
      title: item.title,
      description:
        'Preview of a product being prepared for the SeineShop collection. Confirm exact compatibility and package contents before ordering.',
    },
  };
}
export default function PreviewProduct() {
  const {t, localize} = useLocale();
  const {item} = useLoaderData();
  return (
    <main className="seine-detail">
      <Link
        to={localize(
          `/collections/${item.collectionHandle || 'iphone-18-pro-max'}`,
        )}
      >
        ← {item.collectionTitle || 'iPhone 18 Pro Max accessories'}
      </Link>
      <div className="detail-grid">
        <img src={item.image} alt={t(item.title)} width="800" height="800" />
        <div>
          <p className="eyebrow">
            {t('COMING SOON /')}
            {t(item.type)}
          </p>
          <h1>{t(item.title)}</h1>
          <p>
            ${t(item.price)}
            {t('USD')}
          </p>
          <p>
            {t(
              'This item is being prepared for our collection. Exact compatibility, availability and delivery details will be confirmed before ordering opens.',
            )}
          </p>
          <p>
            {t('SKU:')}
            {t(item.id)}
          </p>
          <Link
            className="seine-button"
            to={localize(
              `/collections/${item.collectionHandle || 'iphone-18-pro-max'}`,
            )}
          >
            {t('Explore the collection')}
          </Link>
        </div>
      </div>
    </main>
  );
}
