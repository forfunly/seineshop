import {useRef, useState} from 'react';
import {Link, useLoaderData, useRevalidator, useSearchParams} from 'react-router';
import {useLocale} from '~/lib/i18n';
import {validProductHandle, dropshipProductHandle} from '~/lib/dropshipping';
export {dropshippingLoader as loader} from '~/lib/dropshipping.server';
export function headers() {return {'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow'};}

const errorMessages = {
  unauthorized: 'Sign in again to continue.',
  forbidden: 'Refresh this page and try again.',
  limited: 'Too many requests. Please wait a minute and try again.',
  'shop-already-connected': 'This store is already linked to another account.',
  'shop-not-enabled': 'This store is not enabled for this development preview.',
  'connection-not-found': 'Choose an active store connection.',
  'reconnect-required': 'Reconnect your store before continuing.',
  'in-progress': 'This import is still processing. Refresh its status before retrying.',
  uncertain: 'The import result is not confirmed. Refresh first; retrying checks for an existing draft.',
  'import-uncertain': 'The import result is not confirmed. Refresh first; retrying checks for an existing draft.',
  'storage-full': 'The development workspace has reached its capacity. Please contact support.',
};

export default function DropshippingWorkspace() {
  const {authenticated, csrf, workspace, code} = useLoaderData();
  const {t, localize} = useLocale();
  const [params] = useSearchParams();
  const product = params.get('product');
  const [productLink, setProductLink] = useState(validProductHandle(product) ? `https://www.seineshop.com/products/${product}` : '');
  const handle = dropshipProductHandle(productLink);
  const [selected, setSelected] = useState('');
  const [products, setProducts] = useState(null);
  const [notice, setNotice] = useState(null);
  const [pending, setPending] = useState(false);
  const locked = useRef(false);
  const revalidator = useRevalidator();
  const connections = workspace?.connections || [];
  const active = connections.filter((connection) => connection.status === 'active');
  const connectionId = active.some(({id}) => id === selected) ? selected : active[0]?.id || '';
  const ready = authenticated && !!workspace && !pending;
  const returnTo = `${localize('/dropshipping')}${validProductHandle(product) ? `?product=${product}` : ''}`;

  async function act(action, extra = {}) {
    if (locked.current) return;
    locked.current = true;setPending(true);setNotice(null);
    try {
      const response = await fetch(localize('/api/dropshipping'), {
        method: 'POST', headers: {'Content-Type': 'application/json', 'X-Seine-CSRF': csrf},
        body: JSON.stringify({action, connectionId, ...extra}),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        setNotice({error: true, text: errorMessages[result.code] || 'This action is unavailable. Your input has been kept.'});
      } else if (action === 'products') setProducts(result);
      else if (action === 'connect') {
        // The service issues a configured HTTPS authorization URL, never a browser-supplied redirect.
        const url = new URL(result.url);
        if (url.protocol !== 'https:') throw new Error();
        window.location.assign(url.href);
      } else {
        setProducts(null);
        setNotice({error: false, text: action === 'import' ? 'Draft import checked. See the task status below.' : 'Store connection updated.'});
        revalidator.revalidate();
      }
    } catch {
      setNotice({error: true, text: action === 'import' ? errorMessages.uncertain : 'This action is unavailable. Your input has been kept.'});
    } finally {locked.current = false;setPending(false);}
  }

  return <div className="dropship-workspace">
    <header className="dropship-heading">
      <p className="eyebrow">Seine Shop</p>
      <h1>{t('Dropshipping workspace')}</h1>
      <p>{t('Manage your store connection and product imports with Seine Shop.')}</p>
      <nav aria-label={t('Workspace sections')}>
        <a href="#store-connection">{t('Store connection')}</a>
        <a href="#product-imports">{t('Product imports')}</a>
        <a href="#dropship-orders">{t('Dropshipping orders')}</a>
      </nav>
    </header>
    {!authenticated && <section className="dropship-signin">
      <div><h2>{t('Sign in to your Seine Shop account')}</h2><p>{t('Your connections and import history are private to your account.')}</p></div>
      <Link className="dropship-primary" to={`${localize('/account/login')}?returnTo=${encodeURIComponent(returnTo)}`}>{t('Sign in to continue')} →</Link>
    </section>}
    {code && <p className="dropship-notice" role="alert">{t(errorMessages[code] || 'The workspace service is not ready. Please try again later.')}</p>}
    <div role="status" aria-live="polite">{pending ? <p className="dropship-notice">{t('Processing…')}</p> : notice && <p className="dropship-notice" data-error={notice.error}>{t(notice.text)}</p>}</div>
    <section className="dropship-panel" id="store-connection" aria-busy={pending}>
      <div className="dropship-section-heading"><span aria-hidden="true">01</span><div><h2>{t('Store connection')}</h2><p>{t('Connect a Shopify store before importing products.')}</p></div></div>
      {workspace && <p className="dropship-note">{t('Development preview: only the designated test store is enabled. Products remain unpublished drafts.')}</p>}
      {connections.map((connection) => <div className="dropship-connection" key={connection.id}>
        <div><strong>{connection.shop}</strong><p>{t(connection.status === 'active' ? 'Connected' : 'Disconnected')} · {t(connection.kind === 'development' ? 'Development connection' : 'Shopify authorization')}</p></div>
        {connection.status === 'active' && <button type="button" disabled={!ready} onClick={() => act('disconnect', {connectionId: connection.id})}>{t('Disconnect')}</button>}
      </div>)}
      {ready && !active.length && <button className="dropship-primary" type="button" onClick={() => act(workspace.oauthAvailable ? 'connect' : 'connect-development', {shop: workspace.developmentShop})}>{t(workspace.oauthAvailable ? 'Connect Shopify store' : 'Connect development store')} →</button>}
      {!workspace && <p className="dropship-note">{t(authenticated ? 'The workspace service is not ready. Please try again later.' : 'Sign in to view your store connections.')}</p>}
      <p className="dropship-note">{t('Disconnecting stops workspace access. App removal and access revocation are managed in Shopify.')}</p>
    </section>
    <section className="dropship-panel" id="product-imports" aria-busy={pending}>
      <div className="dropship-section-heading"><span aria-hidden="true">02</span><div><h2>{t('Product imports')}</h2><p>{t('Import a product as a draft, then review it in your Shopify admin.')}</p></div></div>
      <form className="dropship-import-form" onSubmit={(event) => {event.preventDefault();void act('import', {handle});}}>
        <label>{t('Destination store')}<select value={connectionId} disabled={!ready || !active.length} onChange={(event) => {setSelected(event.target.value);setProducts(null);}} required>
          {!active.length && <option value="">{t('Connect a store first')}</option>}
          {active.map(({id, shop}) => <option key={id} value={id}>{shop}</option>)}
        </select></label>
        <label>{t('Seine Shop product link')}<input type="url" value={productLink} onChange={(event) => setProductLink(event.target.value)} required maxLength={2048} placeholder="https://www.seineshop.com/products/…" disabled={pending} aria-describedby="dropship-handle-help"/></label>
        <p id="dropship-handle-help" className="dropship-note">{t('Paste the product page link from Seine Shop.')}</p>
        <div className="dropship-buttons"><button className="dropship-primary" disabled={!ready || !connectionId || !validProductHandle(handle)} type="submit">{t('Import as draft')} →</button>
          <button type="button" disabled={!ready || !connectionId} onClick={() => act('products')}>{t('View imported products')}</button></div>
      </form>
      <p className="dropship-note">{t('Imports copy product details, variants and prices. Stock is set to zero. Repeated imports reuse the existing draft.')}</p>
      {products && <div className="dropship-product-list">{products.products.length ? products.products.map((item) => <p key={item.id}>{item.title || `${t('Shopify product')} ${item.targetProductId.split('/').at(-1)}`} · {item.variants} {t('variants')} · {item.currency}</p>) : <p>{t('No imported products found.')}</p>}{products.hasMore && <p>{t('Showing the first 50 imported products.')}</p>}</div>}
      {!!workspace?.tasks?.length && <div className="dropship-task-list"><h3>{t('Import history')}</h3>{workspace.tasks.map((task) => <div key={task.id}><strong>{task.result?.title || task.handle}</strong><p>{t(task.status === 'completed' ? 'Completed' : task.status === 'running' ? 'Processing…' : 'Needs review')} · {task.shop}</p>{task.status === 'needs-review' && <button type="button" disabled={!ready || !active.some((c) => c.shop === task.shop)} onClick={() => act('import', {handle: task.handle, connectionId: active.find((c) => c.shop === task.shop)?.id})}>{t('Check and retry')}</button>}</div>)}</div>}
      <button type="button" className="dropship-refresh" disabled={pending || revalidator.state !== 'idle'} onClick={() => revalidator.revalidate()}>{t('Refresh status')}</button>
    </section>
    <section className="dropship-panel" id="dropship-orders">
      <div className="dropship-section-heading"><span aria-hidden="true">03</span><div><h2>{t('Dropshipping orders')}</h2><p>{t('Order synchronization is not yet available.')}</p></div></div>
      <p>{t('Customer payments in your store and purchases from Seine Shop are separate. Our warehouse ships only after the purchase is paid and confirmed.')}</p>
      <Link to={localize('/support')}>{t('Contact support')} →</Link>
    </section>
  </div>;
}
