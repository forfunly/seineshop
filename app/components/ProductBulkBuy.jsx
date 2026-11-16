import {useEffect, useId, useRef, useState} from 'react';
import {useFetcher} from 'react-router';
import {CartForm, Image, Money} from '@shopify/hydrogen';
import {useLocale} from '~/lib/i18n';
import {useModalDialog} from '~/lib/use-modal-dialog';
import {BULK_QUANTITY_ERROR, MAX_CART_LINES, validBulkQuantity} from '~/lib/bulk-buy';
import {useAside} from './Aside';

export function ProductBulkBuy({handle, title, disabled}) {
  const {t, localize} = useLocale();
  const {open} = useAside();
  const cart = useFetcher();
  const headingId = useId();
  const {dialogRef, triggerRef, closeButtonRef, openDialog, closeDialog} = useModalDialog();
  const [active, setActive] = useState(false);
  const [variants, setVariants] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [pageInfo, setPageInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [outcome, setOutcome] = useState(null);
  const requestRef = useRef(null);
  const submitted = useRef(false);
  const busy = cart.state !== 'idle';

  async function loadPage(after = null) {
    if (requestRef.current) return;
    const controller = new AbortController();
    requestRef.current = controller;
    const timer = setTimeout(() => {
      controller.abort();
      if (requestRef.current === controller) setLoadError(true);
    }, 15000);
    setLoading(true);
    setLoadError(false);
    try {
      const params = new URLSearchParams({handle});
      if (after) params.set('after', after);
      const response = await fetch(`${localize('/api/product-variants')}?${params}`, {signal: controller.signal});
      if (!response.ok) throw new Error('unavailable');
      const {product} = await response.json();
      if (!Array.isArray(product?.variants?.nodes) || !product.variants.pageInfo ||
        (product.variants.pageInfo.hasNextPage && (!product.variants.pageInfo.endCursor || product.variants.pageInfo.endCursor === after))) throw new Error('invalid');
      if (controller.signal.aborted) return;
      setVariants((previous) => {
        const entries = new Map((after ? previous : []).map((variant) => [variant.id, variant]));
        for (const variant of product.variants.nodes) entries.set(variant.id, variant);
        return [...entries.values()];
      });
      setPageInfo(product.variants.pageInfo);
    } catch {
      if (!controller.signal.aborted) setLoadError(true);
    } finally {
      clearTimeout(timer);
      if (requestRef.current === controller) {
        requestRef.current = null;
        setLoading(false);
      }
    }
  }

  useEffect(() => () => requestRef.current?.abort(), []);

  useEffect(() => {
    if (!submitted.current || cart.state !== 'idle' || !cart.data) return;
    submitted.current = false;
    setOutcome(cart.data);
    if (cart.data.cart && !cart.data.errors?.length && !cart.data.warnings?.length) {
      closeDialog();
      requestAnimationFrame(() => open('cart'));
    }
  }, [cart.state, cart.data, closeDialog, open]);

  const close = () => {
    requestRef.current?.abort();
    requestRef.current = null;
    setLoading(false);
    setActive(false);
  };
  const viewCart = () => {
    closeDialog();
    requestAnimationFrame(() => open('cart'));
  };
  const selected = variants.filter((variant) => variant.availableForSale && Number(quantities[variant.id]) > 0);
  const invalid = variants.some((variant) => variant.availableForSale && !validBulkQuantity(quantities[variant.id] ?? '0'));
  const lines = selected.map((variant) => ({merchandiseId: variant.id, quantity: Number(quantities[variant.id])}));
  const totalQuantity = lines.reduce((sum, line) => sum + line.quantity, 0);
  const currency = variants[0]?.price.currencyCode;
  const sameCurrency = selected.every((variant) => variant.price.currencyCode === currency);
  const amount = selected.reduce((sum, variant) => sum + Number(variant.price.amount) * Number(quantities[variant.id]), 0);
  const mustCheckCart = Boolean(outcome?.cart || outcome?.uncertain);
  const canSubmit = lines.length > 0 && lines.length <= MAX_CART_LINES && !invalid && sameCurrency && !busy && !loading && !mustCheckCart;

  return <>
    <button type="button" ref={triggerRef} className="pdp-bulk-entry" disabled={disabled} onClick={() => {
      setVariants([]); setQuantities({}); setPageInfo(null); setOutcome(null); setActive(true);
      openDialog();
      void loadPage();
    }}>{t('Bulk Buy')} <span aria-hidden="true">↗</span></button>
    <dialog ref={dialogRef} className="pdp-bulk-dialog" aria-labelledby={headingId} onClose={close}>
      <div className="pdp-bulk-heading">
        <div><h2 id={headingId}>{t('Bulk Buy')}</h2><p>{t('Choose quantities for multiple options')}</p></div>
        <button type="button" ref={closeButtonRef} aria-label={t('Close')} onClick={closeDialog}>×</button>
      </div>
      {active && <>
        <p className="pdp-bulk-product">{title}</p>
        <p className="pdp-bulk-note">{t('Current unit prices apply. Shipping, taxes and any discounts are confirmed in your cart and at checkout.')}</p>
        <cart.Form method="post" action={localize('/cart')} onSubmit={(event) => {
          if (!canSubmit || submitted.current) {event.preventDefault(); return;}
          setOutcome(null);
          submitted.current = true;
        }}>
          <input type="hidden" name={CartForm.INPUT_NAME} value={JSON.stringify({action: CartForm.ACTIONS.LinesAdd, inputs: {lines}})}/>
          <fieldset disabled={busy || mustCheckCart} className="pdp-bulk-options">
            <legend className="sr-only">{t('Options and quantities')}</legend>
            {variants.map((variant) => <div className="pdp-bulk-row" key={variant.id}>
              <div className="pdp-bulk-variant">
                {variant.image && <Image data={variant.image} alt="" width={56} height={56} sizes="56px" style={{width: 56, height: 56}} loading="lazy"/>}
                <div><strong>{t(variant.title)}</strong>{variant.sku && <small>SKU: {variant.sku}</small>}{!variant.availableForSale && <small>{t('Sold out')}</small>}</div>
              </div>
              <div className="pdp-bulk-unit"><span>{t('Unit price')}</span><Money data={variant.price}/></div>
              <label><span>{t('Quantity')}</span><input aria-label={`${t('Quantity')} — ${t(variant.title)}${variant.sku ? ` (${variant.sku})` : ''}`} type="number" min="0" max="9999" step="1" inputMode="numeric" value={quantities[variant.id] ?? '0'} disabled={!variant.availableForSale} onChange={(event) => setQuantities((previous) => ({...previous, [variant.id]: event.target.value}))}/></label>
              <div className="pdp-bulk-subtotal"><span>{t('Subtotal')}</span><Money data={{...variant.price, amount: String(validBulkQuantity(quantities[variant.id] ?? '0') && variant.availableForSale ? Number(variant.price.amount) * Number(quantities[variant.id] || 0) : 0)}}/></div>
            </div>)}
          </fieldset>
          {loading && <p role="status">{t('Loading options…')}</p>}
          {loadError && <div role="alert"><p>{t('Options could not be loaded. Your quantities have been kept.')}</p><button className="pdp-bulk-secondary" type="button" disabled={loading || busy} onClick={() => loadPage(pageInfo?.endCursor)}>{t('Try again')}</button></div>}
          {!loading && !loadError && pageInfo?.hasNextPage && <button className="pdp-bulk-secondary" type="button" disabled={busy || mustCheckCart} onClick={() => loadPage(pageInfo.endCursor)}>{t('Load more options')}</button>}
          {!loading && !loadError && pageInfo && !variants.length && <p role="status">{t('No options available.')}</p>}
          {invalid && <p role="alert">{t(BULK_QUANTITY_ERROR)}</p>}
          {lines.length > MAX_CART_LINES && <p role="alert">{t('Choose up to 250 different options per purchase.')}</p>}
          {outcome?.errors?.length > 0 && <div role="alert">{[...new Set(outcome.errors.map((error) => error.message))].map((message) => <p key={message}>{t(message)}</p>)}</div>}
          {outcome?.warnings?.length > 0 && <div role="status">{[...new Set(outcome.warnings.map((warning) => warning.message))].map((message) => <p key={message}>{t(message)}</p>)}</div>}
          {mustCheckCart && <p role="status">{t('Review your cart before adding these items again. Shopify may have adjusted quantities or availability.')}</p>}
          <div className="pdp-bulk-footer">
            <div aria-live="polite"><span>{t('Total quantity')}: <strong>{totalQuantity}</strong></span><span>{t('Total at current unit price')}: <strong>{currency && !invalid && sameCurrency ? <Money data={{amount: String(amount), currencyCode: currency}}/> : '—'}</strong></span></div>
            <div className="pdp-bulk-actions"><button type="button" className="pdp-bulk-secondary" onClick={viewCart}>{t('View cart')}</button><button className="pdp-bulk-add" type="submit" disabled={!canSubmit}>{t(busy ? 'Adding…' : 'Add to cart')}</button></div>
          </div>
        </cart.Form>
      </>}
    </dialog>
  </>;
}
