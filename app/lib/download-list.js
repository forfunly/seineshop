import {useSyncExternalStore} from 'react';
import {readHandles, PRODUCT_HANDLE} from './wishlist.js';

const KEY = 'seine-image-downloads';
const EVENT = 'seine:downloads';
let fallback;
function snapshot() {
  try {return fallback ?? localStorage.getItem(KEY) ?? '[]';} catch {return fallback ?? '[]';}
}
function subscribe(listener) {
  window.addEventListener(EVENT, listener);
  window.addEventListener('storage', listener);
  return () => {window.removeEventListener(EVENT, listener); window.removeEventListener('storage', listener);};
}
export function useDownloadList() {
  return readHandles(useSyncExternalStore(subscribe, snapshot, () => '[]'));
}
function save(handles) {
  const value = JSON.stringify(handles.slice(0, 240));
  try {localStorage.setItem(KEY, value); fallback = undefined;} catch {fallback = value;}
  window.dispatchEvent(new Event(EVENT));
}
export function addDownload(handle) {
  if (typeof handle === 'string' && PRODUCT_HANDLE.test(handle)) save([...new Set([handle, ...readHandles(snapshot())])]);
}
export function removeDownload(handle) {save(readHandles(snapshot()).filter((item) => item !== handle));}
