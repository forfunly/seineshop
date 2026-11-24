import {useEffect, useRef} from 'react';
import {useLocale} from '~/lib/i18n';
import {CartForm} from '@shopify/hydrogen';
import {CartAnalyticsInput} from './CommerceAnalytics';

/**
 * @param {{
 *   analytics?: unknown;
 *   children: React.ReactNode;
 *   disabled?: boolean;
 *   lines: Array<OptimisticCartLineInput>;
 *   onClick?: () => void;
 *   onSuccess?: () => void;
 * }}
 */
export function AddToCartButton({
  analytics,
  children,
  disabled,
  lines,
  onClick,
  onSuccess,
}) {
  const {t, localize} = useLocale();
  return (
    <CartForm
      route={localize('/cart')}
      inputs={{
        lines,
      }}
      action={CartForm.ACTIONS.LinesAdd}
    >
      {(fetcher) => (
        <>
          {onSuccess && (
            <CartAddCompletion fetcher={fetcher} onSuccess={onSuccess} />
          )}
          <CartAnalyticsInput />
          <input
            name="analytics"
            type="hidden"
            value={JSON.stringify(analytics)}
          />
          <button
            type="submit"
            onClick={onClick}
            disabled={Boolean(disabled) || fetcher.state !== 'idle'}
          >
            {t(fetcher.state !== 'idle' ? 'Adding…' : children)}
          </button>
          {fetcher.data?.errors?.length > 0 && (
            <p role="alert">
              {fetcher.data.errors.map((error) => error.message).join(' ')}
            </p>
          )}
          {fetcher.data?.warnings?.length > 0 && (
            <p role="status">
              {fetcher.data.warnings
                .map((warning) => warning.message)
                .join(' ')}
            </p>
          )}
        </>
      )}
    </CartForm>
  );
}

function CartAddCompletion({fetcher, onSuccess}) {
  const previous = useRef(null);
  useEffect(() => {
    if (
      fetcher.state !== 'idle' ||
      !fetcher.data ||
      fetcher.data === previous.current
    )
      return;
    previous.current = fetcher.data;
    if (
      fetcher.data.cart &&
      !fetcher.data.errors?.length &&
      !fetcher.data.uncertain
    )
      onSuccess();
  }, [fetcher.state, fetcher.data, onSuccess]);
  return null;
}

/** @typedef {import('react-router').FetcherWithComponents} FetcherWithComponents */
/** @typedef {import('@shopify/hydrogen').OptimisticCartLineInput} OptimisticCartLineInput */
