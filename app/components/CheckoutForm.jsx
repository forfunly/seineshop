import {useEffect, useRef, useState} from 'react';
import {useLocale} from '~/lib/i18n';
import {getCheckoutAnalytics} from '~/lib/ga4-client';

/** Normal form fallback remains available without JS or a functioning Google tag. */
export function CheckoutForm({fetcher, children, intent = 'buy-now'}) {
  const {localize} = useLocale();
  const pending = useRef(false);
  const [reading, setReading] = useState(false);
  const action = localize('/checkout');
  const reset = fetcher.reset;
  useEffect(() => {
    const restore = (event) => {
      if (!event.persisted) return;
      // External redirects can leave a suspended fetcher in the back/forward cache.
      pending.current = false;
      setReading(false);
      reset();
    };
    window.addEventListener('pageshow', restore);
    return () => window.removeEventListener('pageshow', restore);
  }, [reset]);
  return <fetcher.Form method="post" action={action} onSubmit={async (event) => {
    event.preventDefault();
    if (pending.current || fetcher.state !== 'idle') return;
    pending.current = true;
    setReading(true);
    const values = new FormData(event.currentTarget);
    try {
      const context = await getCheckoutAnalytics();
      for (const [key, value] of Object.entries(context)) {
        if (typeof value === 'string') values.set(key, value);
      }
      void fetcher.submit(values, {method: 'post', action});
    } finally {
      pending.current = false;
      setReading(false);
    }
  }}>
    <input type="hidden" name="intent" value={intent}/>
    <fieldset disabled={reading || fetcher.state !== 'idle'} style={{border: 0, padding: 0, margin: 0, minWidth: 0}}>
      {children}
    </fieldset>
  </fetcher.Form>;
}
