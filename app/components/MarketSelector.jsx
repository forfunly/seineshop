import {useId, useRef, useState} from 'react';
import {useFetcher, useLocation, useRouteLoaderData} from 'react-router';
import {useLocale} from '~/lib/i18n';
import {LOCALES} from '~/lib/locale';

export function MarketSelector() {
  const {localization} = useRouteLoaderData('root');
  const {locale, t, localize} = useLocale();
  const location = useLocation();
  const dialog = useRef(null);
  const id = useId();
  const fetcher = useFetcher();
  const [country, setCountry] = useState(localization.country.isoCode);
  const selected = localization.availableCountries.find((item) => item.isoCode === country) || localization.country;
  const busy = fetcher.state !== 'idle';
  const flag = (code) => String.fromCodePoint(...[...code].map((c) => c.charCodeAt(0) + 127397));
  return <div className="market-selector">
    <button className="market-selector-trigger" type="button" aria-haspopup="dialog" aria-label={`${t('Shopping preferences')}: ${localization.country.name}, ${locale.label}, ${localization.country.currency.isoCode}`} onClick={() => {setCountry(localization.country.isoCode); dialog.current.showModal();}}>
      <span aria-hidden="true">{flag(localization.country.isoCode)}</span>
      <span>{locale.label}<strong>{localization.country.currency.isoCode}</strong></span><span aria-hidden="true">⌄</span>
    </button>
    {/* Native dialog supports Escape; this handler only adds backdrop dismissal. */}
    {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
    <dialog ref={dialog} className="market-selector-dialog" aria-labelledby={`${id}-market-selector-title`} onClick={(e) => {if (e.target === dialog.current && !busy) dialog.current.close();}}>
      <div className="market-selector-panel">
        <div className="market-selector-heading"><h2 id={`${id}-market-selector-title`}>{t('Shopping preferences')}</h2><button type="button" disabled={busy} aria-label={t('Close')} onClick={() => dialog.current.close()}>×</button></div>
        <fetcher.Form method="post" action={localize('/localization')}>
          <input type="hidden" name="returnTo" value={location.pathname + location.search + location.hash}/>
          <label htmlFor={`${id}-market-country`}>{t('Ship to')}</label>
          <select id={`${id}-market-country`} name="country" value={country} onChange={(e)=>setCountry(e.target.value)} disabled={busy}>
            {localization.availableCountries.map((item)=><option key={item.isoCode} value={item.isoCode}>{flag(item.isoCode)}  {item.name}</option>)}
          </select>
          <label htmlFor={`${id}-market-language`}>{t('Language')}</label>
          <select id={`${id}-market-language`} name="language" defaultValue={locale.code} disabled={busy}>{LOCALES.map((item)=><option key={item.code} value={item.code}>{item.label}</option>)}</select>
          <label htmlFor={`${id}-market-currency`}>{t('Currency')}</label>
          <select id={`${id}-market-currency`} name="currency" value={selected.currency.isoCode} onChange={()=>{}} aria-describedby={`${id}-market-currency-note`} disabled={busy}>
            <option value={selected.currency.isoCode}>{selected.currency.symbol} · {selected.currency.isoCode}</option>
          </select>
          <p id={`${id}-market-currency-note`}>{t('Currency follows your shipping country. Final shipping and taxes are calculated at checkout.')}</p>
          {fetcher.data?.error && <p role="alert">{t(fetcher.data.error)}</p>}
          <button className="market-selector-submit" type="submit" disabled={busy}>{t(busy ? 'Updating…' : 'Save preferences')}</button>
        </fetcher.Form>
      </div>
    </dialog>
  </div>;
}
