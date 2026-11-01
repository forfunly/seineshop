import {useLocale} from '~/lib/i18n';
import {CartForm, Money} from '@shopify/hydrogen';
import {useEffect, useId, useRef, useState} from 'react';
import {useFetcher} from 'react-router';

/**
 * @param {CartSummaryProps}
 */
export function CartSummary({cart, layout}) {
  const {t} = useLocale();
  const className =
    layout === 'page' ? 'cart-summary-page' : 'cart-summary-aside';
  const summaryId = useId();
  const discountsHeadingId = useId();
  const discountCodeInputId = useId();
  const giftCardHeadingId = useId();
  const giftCardInputId = useId();
  return (
    <div aria-labelledby={summaryId} className={className}>
      <h4 id={summaryId}>{t('Order summary')}</h4>
      <dl role="group" className="cart-subtotal">
        <dt>{t('Subtotal')}</dt>
        <dd>
          {t(
            cart?.cost?.subtotalAmount?.amount ? (
              <Money data={cart?.cost?.subtotalAmount} />
            ) : (
              '-'
            ),
          )}
        </dd>
      </dl>
      <details className="cart-code-panel"><summary>{t('Discount code')}</summary>
      <CartDiscounts
        discountCodes={cart?.discountCodes}
        discountsHeadingId={discountsHeadingId}
        discountCodeInputId={discountCodeInputId}
      />
      </details>
      <details className="cart-code-panel"><summary>{t('Gift card')}</summary>
      <CartGiftCard
        giftCardCodes={cart?.appliedGiftCards}
        giftCardHeadingId={giftCardHeadingId}
        giftCardInputId={giftCardInputId}
      />
      </details>
      <p className="cart-tax-note">{t('Shipping and taxes calculated at checkout.')}</p>
      <CartCheckoutActions checkoutUrl={cart?.checkoutUrl} />
    </div>
  );
}

/**
 * @param {{checkoutUrl?: string}}
 */
function CartCheckoutActions({checkoutUrl}) {
  const {locale, t} = useLocale();
  if (!checkoutUrl) return null;
  const localizedCheckoutUrl = new URL(checkoutUrl);
  localizedCheckoutUrl.searchParams.set('locale', locale.code);
  return (
    <div>
      <a
        className="cart-checkout"
        href={localizedCheckoutUrl.href}
        target="_self"
      >
        <p>{t('Continue to Checkout \u2192')}</p>
      </a>
      <p className="cart-checkout-note">{t('Secure checkout by Shopify')}</p>
    </div>
  );
}

/**
 * @param {{
 *   discountCodes?: CartApiQueryFragment['discountCodes'];
 *   discountsHeadingId: string;
 *   discountCodeInputId: string;
 * }}
 */
function CartDiscounts({
  discountCodes,
  discountsHeadingId,
  discountCodeInputId,
}) {
  const {t} = useLocale();
  const codes =
    discountCodes
      ?.filter((discount) => discount.applicable)
      ?.map(({code}) => code) || [];
  return (
    <section aria-label={t('Discounts')}>
      {/* Have existing discount, display it with a remove option */}
      <dl hidden={!codes.length}>
        <div>
          <dt id={discountsHeadingId}>{t('Discounts')}</dt>
          <UpdateDiscountForm>
            <div
              className="cart-discount"
              role="group"
              aria-labelledby={discountsHeadingId}
            >
              <code>{codes?.join(', ')}</code>
              &nbsp;
              <button type="submit" aria-label={t('Remove discount')}>
                {t('Remove')}
              </button>
            </div>
          </UpdateDiscountForm>
        </div>
      </dl>

      {discountCodes?.some((discount) => !discount.applicable) && <p role="status" className="cart-code-error">{t('This discount code is not available for your cart.')}</p>}
      {/* Show an input to apply a discount */}
      <UpdateDiscountForm discountCodes={codes}>
        <div className="cart-code-input">
          <label htmlFor={discountCodeInputId} className="sr-only">
            {t('Discount code')}
          </label>
          <input
            id={discountCodeInputId}
            type="text"
            name="discountCode"
            placeholder={t('Discount code')}
          />
          <button type="submit" aria-label={t('Apply discount code')}>
            {t('Apply')}
          </button>
        </div>
      </UpdateDiscountForm>
    </section>
  );
}

/**
 * @param {{
 *   discountCodes?: string[];
 *   children: React.ReactNode;
 * }}
 */
function UpdateDiscountForm({discountCodes = [], children}) {
  const {t, localize} = useLocale();
  return (
    <CartForm
      route={localize('/cart')}
      action={localize(CartForm.ACTIONS.DiscountCodesUpdate)}
      inputs={{
        discountCodes: discountCodes || [],
      }}
    >
      {t(children)}
    </CartForm>
  );
}

/**
 * @param {{
 *   giftCardCodes: CartApiQueryFragment['appliedGiftCards'] | undefined;
 *   giftCardHeadingId: string;
 *   giftCardInputId: string;
 * }}
 */
function CartGiftCard({giftCardCodes, giftCardHeadingId, giftCardInputId}) {
  const {t} = useLocale();
  const giftCardCodeInput = useRef(null);
  const removeButtonRefs = useRef(new Map());
  const previousCardIdsRef = useRef([]);
  const giftCardAddFetcher = useFetcher({
    key: 'gift-card-add',
  });
  const [removedCardIndex, setRemovedCardIndex] = useState(null);
  useEffect(() => {
    if (giftCardAddFetcher.data) {
      if (giftCardCodeInput.current !== null) {
        giftCardCodeInput.current.value = '';
      }
    }
  }, [giftCardAddFetcher.data]);
  useEffect(() => {
    const currentCardIds = giftCardCodes?.map((card) => card.id) || [];
    if (removedCardIndex !== null && giftCardCodes) {
      const focusTargetIndex = Math.min(
        removedCardIndex,
        giftCardCodes.length - 1,
      );
      const focusTargetCard = giftCardCodes[focusTargetIndex];
      const focusButton = focusTargetCard
        ? removeButtonRefs.current.get(focusTargetCard.id)
        : null;
      if (focusButton) {
        focusButton.focus();
      } else if (giftCardCodeInput.current) {
        giftCardCodeInput.current.focus();
      }
      setRemovedCardIndex(null);
    }
    previousCardIdsRef.current = currentCardIds;
  }, [giftCardCodes, removedCardIndex]);
  const handleRemoveClick = (cardId) => {
    const index = previousCardIdsRef.current.indexOf(cardId);
    if (index !== -1) {
      setRemovedCardIndex(index);
    }
  };
  return (
    <section aria-label={t('Gift cards')}>
      {giftCardCodes && giftCardCodes.length > 0 && (
        <dl>
          <dt id={giftCardHeadingId}>{t('Applied Gift Card(s)')}</dt>
          {giftCardCodes.map((giftCard) => (
            <dd key={giftCard.id} className="cart-discount">
              <RemoveGiftCardForm
                giftCardId={giftCard.id}
                lastCharacters={giftCard.lastCharacters}
                onRemoveClick={() => handleRemoveClick(giftCard.id)}
                buttonRef={(el) => {
                  if (el) {
                    removeButtonRefs.current.set(giftCard.id, el);
                  } else {
                    removeButtonRefs.current.delete(giftCard.id);
                  }
                }}
              >
                <code>***{t(giftCard.lastCharacters)}</code>
                &nbsp;
                <Money data={giftCard.amountUsed} />
              </RemoveGiftCardForm>
            </dd>
          ))}
        </dl>
      )}

      <AddGiftCardForm fetcherKey="gift-card-add">
        <div className="cart-code-input">
          <label htmlFor={giftCardInputId} className="sr-only">
            {t('Gift card code')}
          </label>
          <input
            id={giftCardInputId}
            type="text"
            name="giftCardCode"
            placeholder={t('Gift card code')}
            ref={giftCardCodeInput}
          />
          <button
            type="submit"
            disabled={giftCardAddFetcher.state !== 'idle'}
            aria-label={t('Apply gift card code')}
          >
            {t('Apply')}
          </button>
        </div>
      </AddGiftCardForm>
    </section>
  );
}

/**
 * @param {{
 *   fetcherKey?: string;
 *   children: React.ReactNode;
 * }}
 */
function AddGiftCardForm({fetcherKey, children}) {
  const {t, localize} = useLocale();
  return (
    <CartForm
      fetcherKey={fetcherKey}
      route={localize('/cart')}
      action={localize(CartForm.ACTIONS.GiftCardCodesAdd)}
    >
      {t(children)}
    </CartForm>
  );
}

/**
 * @param {{
 *   giftCardId: string;
 *   lastCharacters: string;
 *   children: React.ReactNode;
 *   onRemoveClick?: () => void;
 *   buttonRef?: (el: HTMLButtonElement | null) => void;
 * }}
 */
function RemoveGiftCardForm({
  giftCardId,
  lastCharacters,
  children,
  onRemoveClick,
  buttonRef,
}) {
  const {t, localize} = useLocale();
  return (
    <CartForm
      route={localize('/cart')}
      action={localize(CartForm.ACTIONS.GiftCardCodesRemove)}
      inputs={{
        giftCardCodes: [giftCardId],
      }}
    >
      {t(children)}
      &nbsp;
      <button
        type="submit"
        aria-label={t(`Remove gift card ending in ${lastCharacters}`)}
        onClick={onRemoveClick}
        ref={buttonRef}
      >
        {t('Remove')}
      </button>
    </CartForm>
  );
}

/**
 * @typedef {{
 *   cart: OptimisticCart<CartApiQueryFragment | null>;
 *   layout: CartLayout;
 * }} CartSummaryProps
 */

/** @typedef {import('storefrontapi.generated').CartApiQueryFragment} CartApiQueryFragment */
/** @typedef {import('~/components/CartMain').CartLayout} CartLayout */
/** @typedef {import('@shopify/hydrogen').OptimisticCart} OptimisticCart */
