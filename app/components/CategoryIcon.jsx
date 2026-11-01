/** Consistent category pictograms; decorative beside the visible category name. */
export function CategoryIcon({category}) {
  const phone = <><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M10 5h4M11 19h2"/></>;
  const icons = {
    'cell-phone-accessories': phone,
    'samsung-accessories': <><path d="m3 5 8-2 2 17-8 2L3 5Zm10-1 8 2-2 16-6-2"/><path d="m7 7 1 5"/></>,
    'apple-accessories': <><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M10 5h4M11 19h2"/></>,
    'xiaomi-accessories': <><rect x="6" y="2" width="12" height="20" rx="2"/><circle cx="9" cy="6" r=".75"/><circle cx="9" cy="9" r=".75"/></>,
    'motorola-accessories': <><rect x="6" y="2" width="12" height="20" rx="2"/><circle cx="12" cy="7" r="2"/></>,
    'oppo-oneplus-accessories': <><rect x="6" y="2" width="12" height="20" rx="2"/><rect x="8" y="5" width="5" height="5" rx="1"/></>,
    'huawei-accessories': <><rect x="6" y="2" width="12" height="20" rx="2"/><circle cx="12" cy="8" r="3"/></>,
    'cell-phone-cases': <><rect x="5" y="2" width="14" height="20" rx="3"/><rect x="8" y="5" width="5" height="6" rx="1"/><path d="M16 14v4"/></>,
    'photo-video': <><path d="M3 7h4l2-3h6l2 3h4v14H3V7Z"/><circle cx="12" cy="13" r="4"/><path d="M18 10h.01"/></>,
    'smartwatch-accessories': <><rect x="6" y="6" width="12" height="12" rx="3"/><path d="m8 6 1-4h6l1 4M8 18l1 4h6l1-4M12 9v3l2 1M20 10v3"/></>,
    'cell-phone-parts': <><rect x="5" y="2" width="14" height="20" rx="2"/><rect x="9" y="8" width="6" height="6" rx="1"/><path d="M10 6v2m4-2v2m-4 6v2m4-2v2M7 10h2m6 0h2M7 12h2m6 0h2"/></>,
    'consumer-electronics': <><path d="M4 14v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="12" width="4" height="9" rx="2"/><rect x="17" y="12" width="4" height="9" rx="2"/></>,
    'home-garden': <><path d="m2 11 10-9 10 9M5 9v13h14V9M10 22v-8h4v8"/></>,
    'sports-outdoors': <><path d="M2 8h3v8H2zM5 5h4v14H5zM9 10h6v4H9zM15 5h4v14h-4zM19 8h3v8h-3z"/></>,
    'computer-networking': <><rect x="4" y="3" width="16" height="13" rx="1"/><path d="m4 16-2 5h20l-2-5M9 19h6"/></>,
    'car-accessories': <><path d="m4 10 2-6h12l2 6M3 10h18v9H3zM5 19v3m14-3v3M6 14h2m8 0h2M2 8h2m16 0h2"/></>,
  };
  return <svg className="category-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{icons[category] || phone}</svg>;
}
