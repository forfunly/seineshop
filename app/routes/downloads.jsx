import {useEffect, useState} from 'react';
import {data, Link, useFetcher, useLoaderData} from 'react-router';
import {useLocale} from '~/lib/i18n';
import {PRODUCT_HANDLE} from '~/lib/wishlist';
import {addDownload, removeDownload, useDownloadList} from '~/lib/download-list';

const privateHeaders = {'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, follow'};
export function headers() {return privateHeaders;}
export async function loader({context, request}) {
  const params = new URL(request.url).searchParams;
  const handle = params.get('handle');
  if (!handle) return data({downloadProduct: null, handle: ''}, {headers: privateHeaders});
  if (!PRODUCT_HANDLE.test(handle)) return data({downloadProduct: null, handle, unavailable: true}, {status: 400, headers: privateHeaders});
  try {
    const {product} = await context.storefront.query(DOWNLOAD_IMAGES_QUERY, {variables: {...context.storefront.i18n, handle, after: params.get('after')}});
    return data({downloadProduct: product, handle}, {headers: privateHeaders});
  } catch {
    return data({downloadProduct: null, handle, unavailable: true}, {headers: privateHeaders});
  }
}

export default function Downloads() {
  const {t, localize} = useLocale();
  const initial = useLoaderData();
  const handles = useDownloadList();
  const [selected, setSelected] = useState(initial.handle || '');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [complete, setComplete] = useState('');
  const fetcher = useFetcher();
  const active = selected || handles[0] || '';
  const endpoint = localize('/downloads');
  const load = fetcher.load;
  useEffect(() => {if (active) void load(`${endpoint}?${new URLSearchParams({handle: active})}`);}, [active, endpoint, load]);
  const fresh = fetcher.data?.handle === active;
  const product = fresh ? fetcher.data?.downloadProduct : null;
  async function download(image) {
    setBusy(image.url); setError(''); setComplete('');
    try {
      const url = new URL(image.url);
      if (url.origin !== 'https://cdn.shopify.com') throw new Error('Invalid image');
      const response = await fetch(url, {credentials: 'omit', referrerPolicy: 'no-referrer', signal: AbortSignal.timeout(20000)});
      if (!response.ok) throw new Error('Unavailable image');
      const blob = await response.blob();
      if (!/^image\//.test(blob.type)) throw new Error('Invalid image');
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      const extension = {'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif'}[blob.type] || 'jpg';
      anchor.href = objectUrl; anchor.download = `${product.handle}-${image.id.split('/').pop()}.${extension}`;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      setComplete(t('Image download started.'));
    } catch {setError(t('The image could not be downloaded. Please try again.'));}
    finally {setBusy('');}
  }
  return <div className="navigation-page">
    <header className="navigation-hero"><h1>{t('Images Download List')}</h1><p>{t('Saved on this device.')}</p></header>
    <form className="help-api-test" onSubmit={(event) => {event.preventDefault(); const handle = String(new FormData(event.currentTarget).get('handle') || '').trim(); if (PRODUCT_HANDLE.test(handle)) {setSelected(handle); setError('');}}}>
      <label>{t('Product handle')}<input name="handle" required pattern="[a-z0-9][a-z0-9\-]*" maxLength={255} /></label><button type="submit">{t('Find product images')}</button>
    </form>
    {handles.length ? <nav className="catalog-section-tabs download-saved-products" aria-label={t('Saved products')}>{handles.map((handle) => <button key={handle} type="button" aria-pressed={active === handle} onClick={() => setSelected(handle)}>{handle}</button>)}</nav> : !active && <div className="navigation-empty"><h2>{t('Your image download list is empty')}</h2><Link to={localize('/collections/best-sellers')}>{t('Browse collections')}</Link></div>}
    {active && !fresh && <p role="status">{t('Loading…')}</p>}
    {fresh && fetcher.data?.unavailable && <p role="alert">{t('Product images are temporarily unavailable.')}</p>}
    {fresh && !fetcher.data?.unavailable && !product && <p role="alert">{t('Product no longer available')}</p>}
    {product && <section><h2>{product.title}</h2>
      {!handles.includes(product.handle) && <button type="button" onClick={() => addDownload(product.handle)}>{t('Save to download list')}</button>}
      {handles.includes(product.handle) && <button type="button" onClick={() => {removeDownload(product.handle); setSelected('');}}>{t('Remove from download list')}</button>}
      {!product.images.nodes.length && <p>{t('No product images available.')}</p>}
      <div className="navigation-products">{product.images.nodes.map((image, index) => <article key={image.id}><img src={image.url} alt={image.altText || product.title} width="220" height="220" loading="lazy" style={{width: '100%', height: 'auto'}} /><button type="button" disabled={!!busy} onClick={() => download(image)}>{t(busy === image.url ? 'Loading…' : 'Download image')} {index + 1}</button></article>)}</div>
      {product.images.pageInfo.hasNextPage && <button type="button" disabled={fetcher.state !== 'idle'} onClick={() => void load(`${endpoint}?${new URLSearchParams({handle: active, after: product.images.pageInfo.endCursor})}`)}>{t('Next images')}</button>}
      <Link to={localize(`/products/${product.handle}`)}>{t('View full details')}</Link>
    </section>}
    {error && <p role="alert">{error}</p>}{complete && <p role="status">{complete}</p>}
  </div>;
}

const DOWNLOAD_IMAGES_QUERY = `#graphql
  query DownloadImages($handle: String!, $after: String, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      handle title
      images(first: 100, after: $after) { nodes { id url altText } pageInfo { hasNextPage endCursor } }
    }
  }
`;
