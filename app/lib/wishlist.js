import {useSyncExternalStore} from 'react';

const KEY = 'seine-best-seller-favorites';
const EVENT = 'seine:wishlist';
const EMPTY = '[]';
let temporary;
export const PRODUCT_HANDLE = /^[a-z0-9][a-z0-9-]{0,254}$/;
export function readHandles(serialized) {
  try {
    const value = JSON.parse(serialized || EMPTY);
    return Array.isArray(value) ? [...new Set(value.filter((handle) => typeof handle === 'string' && PRODUCT_HANDLE.test(handle)))].slice(0, 240) : [];
  } catch {
    return [];
  }
}
function snapshot() {
  try {return temporary ?? window.localStorage.getItem(KEY) ?? EMPTY;} catch {return temporary ?? EMPTY;}
}
function subscribe(onChange) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {window.removeEventListener(EVENT, onChange); window.removeEventListener('storage', onChange);};
}
export function useWishlist() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => EMPTY);
  return readHandles(raw);
}
export function toggleFavorite(handle) {
  if (typeof handle !== 'string' || !PRODUCT_HANDLE.test(handle)) return;
  const saved = readHandles(snapshot());
  const next = JSON.stringify(saved.includes(handle) ? saved.filter((item) => item !== handle) : [handle, ...saved].slice(0, 240));
  try {window.localStorage.setItem(KEY, next); temporary = undefined;} catch {temporary = next;}
  window.dispatchEvent(new Event(EVENT));
}
