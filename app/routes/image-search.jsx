import {useEffect, useState} from 'react';
import {Link, data, useLoaderData, useLocation, useFetcher} from 'react-router';
import {useLocale} from '~/lib/i18n';
import {ImageSearchUpload} from '~/components/ImageSearchUpload';
import {CollectionCardsProvider, CollectionProductCard} from '~/components/BestSellerQuickView';
import {consumeSearchImage, describeImage, visualDistance} from '~/lib/visual-search';
import {categories} from '~/data/navigation';

const noindex = {'X-Robots-Tag': 'noindex, follow'};
export function headers() {return noindex;}
export async function loader({context, request}) {
  const handle = new URL(request.url).searchParams.get('category');
  const category = categories.find((item) => item.handle === handle);
  try {
    const after = new URL(request.url).searchParams.get('after');
    const variables = {...context.storefront.i18n, after};
    const result = category
      ? await context.storefront.query(IMAGE_CATEGORY_QUERY, {variables: {...variables, handle: category.handle}})
      : await context.storefront.query(IMAGE_CATALOG_QUERY, {variables});
    const connection = result.collection?.products || result.products;
    return data({category: category?.title, batchCursor: after || '', pageInfo: connection?.pageInfo, items: (connection?.nodes || []).filter((item) => item.thumbnail?.url)}, {headers: noindex});
  } catch {
    return data({items: [], error: true, category: category?.title}, {headers: noindex});
  }
}

export default function ImageSearch() {
  const {t, localize} = useLocale();
  const initial = useLoaderData();
  const location = useLocation();
  const [file, setFile] = useState(null);
  const [uploadId, setUploadId] = useState(0);
  const fetcher = useFetcher({key: `image-candidates:${location.key}:${uploadId}`});
  const batch = fetcher.data && !fetcher.data.error ? fetcher.data : initial;
  const {items, category, error} = batch;
  const [ranked, setRanked] = useState([]);
  const [checkedTotal, setCheckedTotal] = useState(0);
  const [scannedCursor, setScannedCursor] = useState(null);
  const chooseFile = (file) => {setUploadId((id) => id + 1); setRanked([]); setCheckedTotal(0); setScannedCursor(null); setFile(file);};
  const [result, setResult] = useState(null);
  useEffect(() => {const uploaded = consumeSearchImage(); if (uploaded) {setRanked([]); setCheckedTotal(0); setScannedCursor(null); setFile(uploaded);}}, [location.key]);
  useEffect(() => {
    if (!file || error) return;
    const controller = new AbortController();
    const run = async () => {
      setResult(null);
      try {
        const sample = await describeImage(file);
        let checked = 0;
        const candidates = items.map((item) => ({item, distance: Infinity}));
        for (let offset = 0; offset < items.length && !controller.signal.aborted; offset += 8) {
          await Promise.all(candidates.slice(offset, offset + 8).map(async (candidate) => {
            const {item} = candidate;
            try {
              const imageUrl = new URL(item.thumbnail.url);
              if (imageUrl.origin !== 'https://cdn.shopify.com') return;
              const response = await fetch(imageUrl, {credentials: 'omit', referrerPolicy: 'no-referrer', signal: AbortSignal.any([controller.signal, AbortSignal.timeout(8000)])});
              if (!response.ok) return;
              const distance = visualDistance(sample, await describeImage(await response.blob()));
              checked++;
              candidate.distance = distance;
            } catch { /* A failed CDN image does not spoil the other candidates. */ }
          }));
        }
        if (!controller.signal.aborted) {
          setRanked((previous) => [...previous.filter(({item}) => !items.some((candidate) => candidate.id === item.id)), ...candidates.filter(({distance}) => distance < 0.095)].sort((a, b) => a.distance - b.distance));
          setCheckedTotal((previous) => previous + checked);
          setScannedCursor(batch.batchCursor || '');
          setResult({checked});
        }
      } catch {
        if (!controller.signal.aborted) setResult({error: true});
      }
    };
    void run();
    return () => controller.abort();
  }, [file, items, error, batch.batchCursor]);
  return <div className="navigation-page">
    <header className="navigation-hero"><h1>{t('Search by Image')}</h1><p>{t('Compare your photo with product photos. Matches are based on visual similarity.')}</p>{category && <p>{t(category)}</p>}</header>
    <ImageSearchUpload onFile={chooseFile} />
    {error && <p role="alert">{t('Product images are temporarily unavailable.')}</p>}
    {file && !error && !result && <p role="status">{t('Comparing product images…')}</p>}
    {result?.error && <p role="alert">{t('This image could not be read. Try another file.')}</p>}
    {result && !result.error && !ranked.length && <div className="navigation-empty"><h2>{t(checkedTotal || !items.length ? 'No similar images found' : 'Product images are temporarily unavailable.')}</h2><Link to={localize('/search')}>{t('Search for Products')}</Link></div>}
    {file && result && !result.error && <p role="status">{t('Product photos compared')}: {checkedTotal}</p>}
    {!!ranked.length && <CollectionCardsProvider><div className="navigation-products">{ranked.slice(0, 24).map(({item}) => <CollectionProductCard key={item.id} product={item} />)}</div></CollectionCardsProvider>}
    {file && batch.pageInfo?.hasNextPage && <button type="button" className="navigation-button" disabled={fetcher.state !== 'idle' || scannedCursor !== (batch.batchCursor || '')}
      onClick={() => {
        const params = new URLSearchParams(location.search);
        params.set('after', batch.pageInfo.endCursor);
        void fetcher.load(`${localize('/image-search')}?${params}`);
      }}>{t(fetcher.state !== 'idle' ? 'Loading…' : 'Search more product photos')}</button>}
    {fetcher.data?.error && <p role="alert">{t('Product images are temporarily unavailable.')}</p>}
  </div>;
}

const IMAGE_ITEM = `#graphql
  fragment ImageSearchItem on Product {
    id handle title availableForSale vendor productType
    thumbnail: featuredImage { url(transform: {maxWidth: 96, maxHeight: 96}) }
    featuredImage { id altText url width height }
    priceRange { minVariantPrice { amount currencyCode } maxVariantPrice { amount currencyCode } }
  }
`;
const IMAGE_CATALOG_QUERY = `#graphql
  ${IMAGE_ITEM}
  query ImageCatalog($after: String, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    products(first: 60, after: $after, sortKey: UPDATED_AT, reverse: true) { pageInfo { hasNextPage endCursor } nodes { ...ImageSearchItem } }
  }
`;
const IMAGE_CATEGORY_QUERY = `#graphql
  ${IMAGE_ITEM}
  query ImageCategory($handle: String!, $after: String, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    collection(handle: $handle) { products(first: 60, after: $after) { pageInfo { hasNextPage endCursor } nodes { ...ImageSearchItem } } }
  }
`;
