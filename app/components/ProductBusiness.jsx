import {useState} from 'react';
import {Money} from '@shopify/hydrogen';
import {useLocale} from '~/lib/i18n';
import {useModalDialog} from '~/lib/use-modal-dialog';
import {QUANTITY_TIERS, SALES_EMAIL, inquiryMailto, validPurchaseQuantity} from '~/lib/wholesale';

export function SalesContact() {
  const {t} = useLocale();
  return <div role="complementary" className="pdp-sales-contact" aria-label={t('Your business contact')}>
    <span className="pdp-sales-avatar" aria-hidden="true">S</span><div><strong>{t('Talk to Steven')}</strong><p>{t('Bulk orders · OEM · ODM')}</p><a href={`mailto:${SALES_EMAIL}`}>{SALES_EMAIL}</a></div>
  </div>;
}

export function WholesaleTiers({quantity, setQuantity, price, busy}) {
  const {t} = useLocale();
  const active = [...QUANTITY_TIERS].reverse().find((n) => Number(quantity) >= n);
  return <section className="pdp-wholesale" aria-label={t('Quantity options')}>
    <div className="pdp-wholesale-heading"><strong>{t('Buy more for your business')}</strong><a href="#business-inquiry">{t('Request a quote')} ↗</a></div>
    <div className="pdp-quantity-tiers">{QUANTITY_TIERS.map((minimum)=><button key={minimum} type="button" disabled={busy} aria-pressed={active === minimum} onClick={()=>setQuantity(String(minimum))}>
      <span>{minimum}+ {t('pieces')}</span><strong>{minimum === 1 && price ? <Money data={price}/> : t('Request quote')}</strong>
    </button>)}</div>
    <p>{t('Wholesale pricing is quoted individually. Online orders use the current unit price until a separate quote is agreed.')}</p>
  </section>;
}

const steps = ['Share your requirements', 'Receive a quotation', 'Review a sample', 'Confirm your order', 'Production & quality review', 'Shipping & follow-up'];
export function BusinessInquiry({product, variant, quantity}) {
  const {t} = useLocale();
  const [type, setType] = useState('Wholesale');
  const [draft, setDraft] = useState('');
  const {dialogRef, triggerRef, closeButtonRef, openDialog, closeDialog} = useModalDialog({lightDismiss: true});
  return <section className="pdp-business" id="business-inquiry" aria-labelledby="business-heading">
    <div className="pdp-business-intro"><p className="pdp-eyebrow">SEINESHOP BUSINESS</p><h2 id="business-heading">{t('Built around your business.')}</h2><p>{t('Ask about volume pricing, branded packaging, logo customization or a new product concept.')}</p><SalesContact/></div>
    <div className="pdp-business-details">
      <div className="pdp-business-modes" aria-label={t('Inquiry type')}>{['Wholesale','OEM','ODM'].map((mode)=><button type="button" key={mode} aria-pressed={type===mode} onClick={()=>setType(mode)}>{t(mode)}</button>)}</div>
      <h3>{t(type === 'Wholesale' ? 'A quote for your next order.' : type === 'OEM' ? 'Your brand. A considered finish.' : 'From concept to a product brief.')}</h3>
      <p>{t(type === 'Wholesale' ? 'Tell us the quantity, variants and delivery country. Steven will confirm the available price and fulfillment details.' : type === 'OEM' ? 'Discuss logo placement, packaging and labeling for this product. Availability depends on the model and quantity.' : 'Share your design, features and target market. We will review feasibility and the development requirements.')}</p>
      <ol className="pdp-business-steps">{steps.map((step,index)=><li key={step}><span>{String(index+1).padStart(2,'0')}</span>{t(step)}</li>)}</ol>
      <p className="pdp-business-note">{t('Customization availability, minimum order quantity, sample costs and lead times are confirmed by quotation.')}</p>
      <button ref={triggerRef} type="button" className="pdp-inquiry-button" onClick={()=>{setDraft('');openDialog();}}>{t('Prepare an inquiry')} ↗</button>
    </div>
    <dialog ref={dialogRef} className="pdp-inquiry-dialog" aria-labelledby="inquiry-title">
      <div className="pdp-inquiry-content"><div className="pdp-inquiry-heading"><h2 id="inquiry-title">{t('Contact Steven')}</h2><button ref={closeButtonRef} type="button" aria-label={t('Close')} onClick={closeDialog}>×</button></div>
      <p>{t(product.title)}</p><p className="pdp-inquiry-sku">SKU: {variant?.sku || '—'} · {t(variant?.title)}</p>
      <form onChange={()=>setDraft('')} onSubmit={(event)=>{event.preventDefault(); const form = new FormData(event.currentTarget);setDraft(inquiryMailto({product,variant,quantity:form.get('quantity'),type:form.get('type'),company:form.get('company'),destination:form.get('destination'),requirements:form.get('requirements')}));}}>
        <label>{t('Inquiry type')}<select name="type" value={type} onChange={(event)=>setType(event.target.value)}>{['Wholesale','OEM','ODM'].map((mode)=><option key={mode}>{mode}</option>)}</select></label>
        <div className="pdp-inquiry-fields"><label>{t('Quantity')}<input name="quantity" type="number" min="1" max="1000000" step="1" required key={quantity} defaultValue={validPurchaseQuantity(quantity) ? quantity : '100'}/></label><label>{t('Company (optional)')}<input name="company" maxLength="120"/></label></div>
        <label>{t('Delivery country / target market')}<input name="destination" required maxLength="120"/></label>
        <label>{t('Your requirements')}<textarea name="requirements" rows="4" maxLength="1500" required placeholder={t('Quantity by variant, logo, packaging, specifications and preferred delivery date…')}/></label>
        <p className="pdp-business-note">{t('Prepare an email draft, then review and send it in your email app. This form does not submit an order or send an email automatically.')}</p>
        <button className="pdp-inquiry-button" type="submit">{t('Create email draft')}</button>
        {draft && <div className="pdp-inquiry-ready" role="status"><a href={draft}>{t('Open email draft')} ↗</a><p>{t('Send to')}: <a href={`mailto:${SALES_EMAIL}`}>{SALES_EMAIL}</a></p></div>}
      </form></div>
    </dialog>
  </section>;
}
