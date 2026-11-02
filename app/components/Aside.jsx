import {useLocale} from '~/lib/i18n';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from 'react';
import {useId} from 'react';

/**
 * A side bar component with Overlay
 * @example
 * ```jsx
 * <Aside type="search" heading="SEARCH">
 *  <input type="search" />
 *  ...
 * </Aside>
 * ```
 * @param {{
 *   children?: React.ReactNode;
 *   type: AsideType;
 *   heading: React.ReactNode;
 * }}
 */
export function Aside({children, heading, type}) {
  const {t} = useLocale();
  const {type: activeType, close} = useAside();
  const expanded = type === activeType;
  const id = useId();
  const dialogRef = useRef(null);
  useEffect(() => {
    const abortController = new AbortController();
    const previousFocus = document.activeElement;
    if (expanded) {
      dialogRef.current?.querySelector('button[aria-label="Close"]')?.focus();
      document.addEventListener(
        'keydown',
        function handler(event) {
          if (event.key === 'Tab') {
            const elements = [
              ...dialogRef.current.querySelectorAll(
                'a[href], button:not(:disabled), input:not([type="hidden"]):not(:disabled), select:not(:disabled), summary, [tabindex="0"]',
              ),
            ].filter(
              (element) =>
                element.getClientRects().length && element.tabIndex !== -1,
            );
            const first = elements[0];
            const last = elements[elements.length - 1];
            if (event.shiftKey && document.activeElement === first) {
              event.preventDefault();
              last?.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault();
              first?.focus();
            }
          }
          if (event.key === 'Escape') {
            close();
          }
        },
        {
          signal: abortController.signal,
        },
      );
    }
    return () => {
      abortController.abort();
      if (expanded && previousFocus instanceof HTMLElement)
        previousFocus.focus();
    };
  }, [close, expanded]);
  return (
    <div
      ref={dialogRef}
      aria-modal
      className={`overlay overlay--${type} ${expanded ? 'expanded' : ''}`}
      role="dialog"
      aria-labelledby={id}
    >
      <button
        className="close-outside"
        onClick={close}
        aria-label={t('Close panel')}
        tabIndex={-1}
      />
      <aside>
        <header>
          <h3 id={id}>{t(heading)}</h3>
          <button
            className="close reset"
            onClick={close}
            aria-label={t('Close')}
          >
            &times;
          </button>
        </header>
        <main>{t(children)}</main>
      </aside>
    </div>
  );
}
const AsideContext = createContext(null);
Aside.Provider = function AsideProvider({children}) {
  const [type, setType] = useState('closed');
  const close = useCallback(() => setType('closed'), []);
  return (
    <AsideContext.Provider
      value={{
        type,
        open: setType,
        close,
      }}
    >
      {children}
    </AsideContext.Provider>
  );
};
export function useAside() {
  const aside = useContext(AsideContext);
  if (!aside) {
    throw new Error('useAside must be used within an AsideProvider');
  }
  return aside;
}

/** @typedef {'search' | 'cart' | 'mobile' | 'closed'} AsideType */
/**
 * @typedef {{
 *   type: AsideType;
 *   open: (mode: AsideType) => void;
 *   close: () => void;
 * }} AsideContextValue
 */

/** @typedef {import('react').ReactNode} ReactNode */
