import {useId} from 'react';
import {useLocale} from '~/lib/i18n';
import {PURCHASE_MODES} from '~/lib/wholesale';
import {AddToCartButton} from './AddToCartButton';
import {useAside} from './Aside';

export function ProductPurchaseModes({mode, onChange, disabled}) {
  const {t} = useLocale();
  const name = useId();
  return <fieldset className="pdp-purchase-modes" disabled={disabled}>
    <legend className="sr-only">{t('Purchase mode')}</legend>
    {PURCHASE_MODES.map((value) => <label key={value}>
      <input className="sr-only" type="radio" name={name} value={value} checked={mode === value} onChange={() => onChange(value)} aria-controls="product-purchase"/>
      <span>{t(value)}</span>
    </label>)}
  </fieldset>;
}

const customizationSteps = ['Share your requirements', 'Receive a quotation', 'Review a sample', 'Confirm your order', 'Production & quality review', 'Shipping', 'After-sales support'];

export function ProductModeRequest({mode, onRequest, variant, busy}) {
  const {t} = useLocale();
  const {open} = useAside();
  const custom = mode === 'Customization';
  return <section className="pdp-mode-details" aria-label={t(mode)}>
    <h2>{t(custom ? '7 steps to your custom product' : 'Dropshipping for your business')}</h2>
    {custom ? <>
      <ol className="pdp-customization-steps">{customizationSteps.map((step, index) => <li key={step}><span aria-hidden="true">{index + 1}</span>{t(step)}</li>)}</ol>
      <p>{t('Discuss logo placement, packaging and labeling for this product. Availability depends on the model and quantity.')}</p>
      <p className="pdp-mode-note">{t('Customization availability, minimum order quantity, sample costs and lead times are confirmed by quotation.')}</p>
    </> : <>
      <p>{t('Tell us about your store, destination countries and expected order volume. We will review product availability, shipping and fulfillment requirements with you.')}</p>
      <p className="pdp-mode-note">{t('Request a consultation before placing a dropshipping order. Product and order synchronization with your Shopify store is not currently available.')}</p>
    </>}
    <div className="pdp-mode-actions">
      <button type="button" className="pdp-inquiry-button" disabled={busy} onClick={(event) => onRequest(mode, event.currentTarget)}>{t(custom ? 'Create a custom request' : 'Request dropshipping')} <span aria-hidden="true">↗</span></button>
      {custom && <AddToCartButton disabled={busy || !variant?.availableForSale} onClick={() => open('cart')} lines={variant ? [{merchandiseId: variant.id, quantity: 1, selectedVariant: variant}] : []}>{t(variant?.availableForSale ? 'Buy sample' : 'Sold out')}</AddToCartButton>}
    </div>
    {custom && <p className="pdp-mode-note">{t('Buy sample adds one standard item to your cart. Customized samples and their costs must be agreed by quotation.')}</p>}
  </section>;
}
