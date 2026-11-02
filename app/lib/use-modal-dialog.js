import {useEffect, useRef} from 'react';

const focusableSelector = [
  'a[href]',
  'button',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  '[tabindex]',
].join(',');

/** Keep keyboard focus within an open native modal and restore its trigger. */
export function useModalDialog({lightDismiss = false} = {}) {
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    const element = dialogRef.current;
    const restoreFocus = () => triggerRef.current?.focus({preventScroll: true});
    const wrapFocus = (event) => {
      if (event.key !== 'Tab') return;
      const controls = [...element.querySelectorAll(focusableSelector)].filter(
        (control) => control.tabIndex >= 0 &&
          !control.matches(':disabled') && !control.closest('[inert]') &&
          control.getClientRects().length > 0 &&
          getComputedStyle(control).visibility !== 'hidden',
      );
      const first = controls[0];
      const last = controls[controls.length - 1];
      const active = element.ownerDocument.activeElement;
      if (!first) {
        event.preventDefault();
        element.focus();
      } else if (event.shiftKey && (active === first || !controls.includes(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !controls.includes(active))) {
        event.preventDefault();
        first.focus();
      }
    };
    const dismissBackdrop = (event) => {
      if (event.target === element) element.close();
    };
    // Configure the native DOM property; React 18 predates closedBy support.
    const nativeDismiss = 'closedBy' in element;
    if (nativeDismiss) element.closedBy = lightDismiss ? 'any' : 'closerequest';
    else if (lightDismiss) element.addEventListener('click', dismissBackdrop);
    element.addEventListener('keydown', wrapFocus);
    element.addEventListener('close', restoreFocus);
    return () => {
      element.removeEventListener('keydown', wrapFocus);
      element.removeEventListener('close', restoreFocus);
      if (!nativeDismiss && lightDismiss) element.removeEventListener('click', dismissBackdrop);
    };
  }, [lightDismiss]);

  const openDialog = () => {
    if (!dialogRef.current.open) dialogRef.current.showModal();
    closeButtonRef.current?.focus({preventScroll: true});
  };
  const closeDialog = () => dialogRef.current?.close();

  return {dialogRef, triggerRef, closeButtonRef, openDialog, closeDialog};
}
