import {useEffect, useState} from 'react';
import {Link, data, useFetcher} from 'react-router';
import {CollectionCardsProvider, CollectionProductCard} from '~/components/BestSellerQuickView';
import {readHandles, toggleFavorite, useWishlist} from '~/lib/wishlist';
import {useLocale} from '~/lib/i18n';

const headersPrivate = {'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, follow'};
export function headers() {return headersPrivate;}
export async function loader({request, context}) {
  const value = new URL(request.url).searchParams.get('items');
  const handles = readHandles(JSON.stringify(value?.slice(0, 6400).split(',') || [])).slice(0, 24);
  if (!handles.length) return data({items: [], handles: ''}, {headers: headersPrivate});
  try {
    const items = [];
    for (let index = 0; index < handles.length; index += 6) {
      const batch = await Promise.all(handles.slice(index, index + 6).map(async (handle) => {
        const {product} = await context.storefront.query(WISHLIST_QUERY, {
          variables: {...context.storefront.i18n, handle},
        });
        return product;
      }));
      items.push(...batch.filter(Boolean));
    }
    return data({items, handles: handles.join(',')}, {headers: headersPrivate});
  } catch {
    return data({items: [], handles: handles.join(','), error: true}, {headers: headersPrivate});
  }
}
export default function Wishlist() {
  const {t, localize} = useLocale();
  const saved = useWishlist();
  const [page, setPage] = useState(0);
  const [retryKey, setRetryKey] = useState(0);
  const fetcher = useFetcher();
  const load = fetcher.load;
  const currentPage = Math.min(page, Math.max(0, Math.ceil(saved.length / 24) - 1));
  const keys = saved.slice(currentPage * 24, (currentPage + 1) * 24);
  const serialized = keys.join(',');
  const endpoint = localize('/wishlist');
  useEffect(() => {
    if (serialized) void load(`${endpoint}?items=${encodeURIComponent(serialized)}`);
  }, [serialized, endpoint, load, retryKey]);
  const fresh = fetcher.data?.handles === serialized;
  const products = new Map((fetcher.data?.items || []).map((item) => [item.handle, item]));
  return <div className="navigation-page">
    <header className="navigation-hero"><h1>{t('Wishlist')}</h1><p>{t('Saved on this device.')}</p></header>
    {!keys.length ? <div className="navigation-empty"><h2>{t('Your wishlist is empty')}</h2><Link to={localize('/collections')}>{t('Browse collections')}</Link></div>
      : !fresh ? <p role="status">{t('Loading…')}</p>
        : fetcher.data?.error ? <p role="alert">{t('Something went wrong.')} <button type="button" onClick={() => setRetryKey((key) => key + 1)}>{t('Try again')}</button></p>
          : <CollectionCardsProvider><div className="navigation-products">
            {keys.map((key) => products.has(key) ? <CollectionProductCard key={key} product={products.get(key)} />
              : <article key={key} className="navigation-empty"><p>{t('Product no longer available')}</p><button type="button" onClick={() => toggleFavorite(key)}>{t('Remove')}</button></article>)}
          </div></CollectionCardsProvider>}
    {currentPage > 0 && <button type="button" onClick={() => setPage(currentPage - 1)}>{t('Previous')}</button>}
    {(currentPage + 1) * 24 < saved.length && <button type="button" onClick={() => setPage(currentPage + 1)}>{t('Next')}</button>}
  </div>;
}

const WISHLIST_QUERY = `#graphql
  query WishlistProduct($handle: String!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      id handle title availableForSale vendor productType
      featuredImage { id altText url width height }
      priceRange { minVariantPrice { amount currencyCode } maxVariantPrice { amount currencyCode } }
    }
  }
`;
