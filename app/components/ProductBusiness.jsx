import {useEffect, useState} from 'react';
import {Money} from '@shopify/hydrogen';
import {useFetchers, useNavigation} from 'react-router';
import {ProductInquiryForm} from './ProductInquiryForm';
import {useLocale} from '~/lib/i18n';
import {useModalDialog} from '~/lib/use-modal-dialog';
import {QUANTITY_TIERS, SALES_EMAIL} from '~/lib/wholesale';

export function SalesContact() {
  const {t} = useLocale();
  return <div role="complementary" className="pdp-sales-contact" aria-label={t('Your business contact')}>
    <span className="pdp-sales-avatar" aria-hidden="true">S</span><div><strong>{t('Talk to Steven')}</strong><p>{t('Bulk orders · OEM · ODM')}</p><a href={`mailto:${SALES_EMAIL}`}>{SALES_EMAIL}</a></div>
  </div>;
}

export function WholesaleTiers({quantity, setQuantity, price}) {
  const {t} = useLocale();
  const navigation = useNavigation();
  const fetchers = useFetchers();
  const busy = navigation.state !== 'idle' || fetchers.some((fetcher) => fetcher.state !== 'idle');
  const active = [...QUANTITY_TIERS].reverse().find((n) => Number(quantity) >= n);
  return <section className="pdp-wholesale" aria-label={t('Quantity options')}>
    <div className="pdp-quantity-tiers">{QUANTITY_TIERS.map((minimum)=><button key={minimum} type="button" disabled={busy} aria-pressed={active === minimum} onClick={()=>setQuantity(String(minimum))}>
      <span>{minimum}+ {t('pieces')}</span><strong>{minimum === 1 && price ? <Money data={price}/> : t('Request quote')}</strong>
    </button>)}</div>
    <p>{t('Wholesale pricing is quoted individually. Online orders use the current unit price until a separate quote is agreed.')}</p>
  </section>;
}

const steps = ['Share your requirements', 'Receive a quotation', 'Review a sample', 'Confirm your order', 'Production & quality review', 'Shipping & follow-up'];
export function BusinessInquiry({product, variant, quantity, request, onRequest}) {
  const {t} = useLocale();
  const [type, setType] = useState('Wholesale');
  const {dialogRef, triggerRef, closeButtonRef, openDialog, closeDialog} = useModalDialog({lightDismiss: true});
  useEffect(() => {
    if (!request) return;
    if (['Wholesale', 'OEM', 'ODM'].includes(request.type)) setType(request.type);
    triggerRef.current = request.trigger;
    openDialog();
  }, [request, openDialog, triggerRef]);
  return <section className="pdp-business" id="business-inquiry" aria-labelledby="business-heading">
    <div className="pdp-business-intro"><p className="pdp-eyebrow">SEINE SHOP BUSINESS</p><h2 id="business-heading">{t('Built around your business.')}</h2><p>{t('Ask about volume pricing, branded packaging, logo customization or a new product concept.')}</p><SalesContact/></div>
    <div className="pdp-business-details">
      <div className="pdp-business-modes" aria-label={t('Inquiry type')}>{['Wholesale','OEM','ODM'].map((mode)=><button type="button" key={mode} aria-pressed={type===mode} onClick={()=>setType(mode)}>{t(mode)}</button>)}</div>
      <h3>{t(type === 'Wholesale' ? 'A quote for your next order.' : type === 'OEM' ? 'Your brand. A considered finish.' : 'From concept to a product brief.')}</h3>
      <p>{t(type === 'Wholesale' ? 'Tell us the quantity, variants and delivery country. Steven will confirm the available price and fulfillment details.' : type === 'OEM' ? 'Discuss logo placement, packaging and labeling for this product. Availability depends on the model and quantity.' : 'Share your design, features and target market. We will review feasibility and the development requirements.')}</p>
      <ol className="pdp-business-steps">{steps.map((step,index)=><li key={step}><span>{String(index+1).padStart(2,'0')}</span>{t(step)}</li>)}</ol>
      <p className="pdp-business-note">{t('Customization availability, minimum order quantity, sample costs and lead times are confirmed by quotation.')}</p>
      <button ref={triggerRef} type="button" className="pdp-inquiry-button" onClick={(event)=>onRequest(type, event.currentTarget)}>{t('Request a quote')} ↗</button>
    </div>
    <dialog ref={dialogRef} className="pdp-inquiry-dialog" aria-labelledby="inquiry-title">
      <div className="pdp-inquiry-content"><div className="pdp-inquiry-heading"><h2 id="inquiry-title">{t('Request a quote')}</h2><button ref={closeButtonRef} type="button" aria-label={t('Close')} onClick={closeDialog}>×</button></div>
      <div className="inquiry-product-summary">
        {(variant?.image || product.images?.nodes?.[0]) && <img src={(variant?.image || product.images.nodes[0]).url} alt="" width="72" height="72"/>}
        <div><p>{t(product.title)}</p><p className="pdp-inquiry-sku">SKU: {variant?.sku || '—'} · {t(variant?.title)}</p>{variant?.price && <p>{t('Current unit price')}: <strong><Money as="span" data={variant.price}/></strong></p>}</div>
      </div>
      <ProductInquiryForm product={product} variant={variant} quantity={quantity} type={request?.type || type} openRequest={request} onCancel={closeDialog}/></div>
    </dialog>
  </section>;
}
