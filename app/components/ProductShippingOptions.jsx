import {useEffect, useId, useRef, useState} from 'react';
import {Money} from '@shopify/hydrogen';
import {useLocale} from '~/lib/i18n';
import {useModalDialog} from '~/lib/use-modal-dialog';
import {SHIPPING_REGIONS} from '~/lib/shipping-regions';

const EMPTY_ADDRESS = {countryCode: '', provinceCode: '', city: '', zip: '', address1: ''};

export function ProductShippingOptions({variant, quantity, disabled}) {
  const {t, localize} = useLocale();
  const id = useId();
  const {dialogRef, triggerRef, closeButtonRef, openDialog, closeDialog} = useModalDialog({lightDismiss: true});
  const controller = useRef(null);
  const [config, setConfig] = useState(null);
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [quote, setQuote] = useState(null);
  const endpoint = localize('/api/shipping-quote');

  useEffect(() => {
    const element = dialogRef.current;
    const cancel = () => {controller.current?.abort(); setBusy(false);};
    element.addEventListener('close', cancel);
    return () => {element.removeEventListener('close', cancel); controller.current?.abort();};
  }, [dialogRef]);

  useEffect(() => {controller.current?.abort(); setQuote(null); setError(null); setBusy(false);}, [variant?.id, quantity]);
  useEffect(() => {controller.current?.abort(); setConfig(null); setAddress(EMPTY_ADDRESS); setQuote(null); setError(null); setBusy(false);}, [endpoint]);

  async function readQuote(input) {
    controller.current?.abort();
    const active = new AbortController();
    controller.current = active;
    setBusy(true); setError(null); setQuote(null);
    const timer = setTimeout(() => active.abort('timeout'), 20000);
    try {
      const response = await fetch(endpoint, {
        method: input ? 'POST' : 'GET', credentials: 'same-origin', signal: active.signal,
        ...(input ? {headers: {'Content-Type': 'application/json', 'X-Seine-CSRF': config.csrf}, body: JSON.stringify(input)} : {}),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.code || 'unavailable');
      if (active.signal.aborted) return;
      if (input) setQuote(data);
      else {
        setConfig(data);
        setAddress((value) => ({...value, countryCode: value.countryCode || data.country}));
      }
    } catch (failure) {
      if (!active.signal.aborted || active.signal.reason === 'timeout') setError(failure instanceof Error && failure.message === 'stock' ? 'stock' : 'unavailable');
    } finally {
      clearTimeout(timer);
      if (controller.current === active) setBusy(false);
    }
  }

  const change = (name, value) => {
    controller.current?.abort(); setBusy(false); setQuote(null); setError(null);
    setAddress((previous) => ({...previous, [name]: value, ...(name === 'countryCode' ? {provinceCode: '', zip: '', city: ''} : {})}));
  };
  const fields = [['city', 'City', 100], ['zip', 'Postal code', 32], ['address1', 'Street address', 255]];
  const regions = SHIPPING_REGIONS[address.countryCode];
  return <section className="pdp-shipping" aria-label={t('Shipping estimate')}>
    <div className="pdp-shipping-entry"><span>{t('Shipping estimate')}</span><button ref={triggerRef} type="button" disabled={disabled} onClick={() => {setQuote(null); openDialog(); if (!config && !busy) void readQuote(null);}}>{t('Estimate shipping')} <span aria-hidden="true">↗</span></button></div>
    <p>{t('Check delivery options for this item and quantity.')}</p>
    <dialog ref={dialogRef} className="pdp-inquiry-dialog pdp-shipping-dialog" aria-labelledby={`${id}-title`}>
      <div className="pdp-inquiry-content">
        <div className="pdp-inquiry-heading"><h2 id={`${id}-title`}>{t('Shipping estimate')}</h2><button ref={closeButtonRef} type="button" aria-label={t('Close')} onClick={closeDialog}>×</button></div>
        <p className="pdp-shipping-summary">{t(variant?.title)} · {quantity} {t('pieces')}</p>
        <p>{t('Estimate for this item only. Other cart items, taxes and checkout adjustments are not included. Final delivery options and charges are confirmed at checkout.')}</p>
        {config && <form className="pdp-shipping-form" onSubmit={(event) => {event.preventDefault(); void readQuote({...address, merchandiseId: variant.id, quantity: Number(quantity)});}}>
          <div><label htmlFor={`${id}-country`}>{t('Country / region')} <span aria-hidden="true">*</span></label><select id={`${id}-country`} required value={address.countryCode} onChange={(event) => change('countryCode', event.target.value)}>{config.countries.map(({isoCode, name}) => <option key={isoCode} value={isoCode}>{name}</option>)}</select></div>
          {regions && <div><label htmlFor={`${id}-province`}>{t('State / province')} <span aria-hidden="true">*</span></label><select id={`${id}-province`} required value={address.provinceCode} onChange={(event) => change('provinceCode', event.target.value)}><option value="">{t('Select a state / province')}</option>{regions.map(({code, name}) => <option key={code} value={code}>{name}</option>)}</select></div>}
          {fields.map(([name, label, max]) => <div className={name === 'address1' ? 'pdp-shipping-wide' : undefined} key={name}>
            <label htmlFor={`${id}-${name}`}>{t(label)} <span aria-hidden="true">*</span></label>
            <input id={`${id}-${name}`} value={address[name]} maxLength={Number(max)} required autoComplete="off" onChange={(event) => change(name, event.target.value)}/>
          </div>)}
          <button className="pdp-inquiry-button pdp-shipping-wide" type="submit" disabled={busy}>{t(busy ? 'Calculating…' : 'Calculate shipping')}</button>
        </form>}
        {!config && busy && <p role="status">{t('Loading…')}</p>}
        {error && <div role="alert" className="pdp-purchase-error"><p>{t(error === 'stock' ? 'The available quantity changed. Check the product quantity before requesting shipping again.' : 'Shipping estimates are temporarily unavailable. Try again or check delivery at checkout.')}</p>{!config && <button type="button" onClick={() => void readQuote(null)} disabled={busy}>{t('Try again')}</button>}</div>}
        {quote && <div className="pdp-shipping-results" role="status">
          {quote.status === 'no-rates' ? <p>{t('No shipping options were returned for this address and quantity. Check your address or contact us before ordering.')}</p> : quote.status === 'not-required' ? <p>{t('This item does not require shipping.')}</p> : <>
            <h3>{t('Available delivery options')}</h3>
            {quote.groups.map((group, index) => <div key={group.id} className="pdp-shipping-group">{quote.groups.length > 1 && <h4>{t('Shipment')} {index + 1}</h4>}<ul>{group.options.map((option) => <li key={option.id}><div><strong>{option.title || t('Shipping')}</strong>{option.description && <p>{option.description}</p>}</div><Money data={option.cost}/></li>)}</ul></div>)}
          </>}
        </div>}
      </div>
    </dialog>
  </section>;
}
