/** Keep every image available, while matching imported SKU galleries by filename. */
export function productGallery(images = [], selectedImage, sku = '') {
  const all = [...new Map([selectedImage, ...images].filter(Boolean).map((image) => [image.url, image])).values()];
  const escaped = sku.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = escaped ? new RegExp(`(?:^|/)(?:800x800_|seineshop-)?${escaped}-\\d+(?:[_.]|$)`, 'i') : null;
  const coverPattern = escaped ? new RegExp(`(?:^|/)(?:400x400_|800x800_|seineshop-)?${escaped}\\.[a-z]+$`, 'i') : null;
  const matching = pattern ? all.filter((image) => {
    const pathname = new URL(image.url).pathname;
    return pattern.test(pathname) || coverPattern.test(pathname);
  }) : [];
  const detailPhotos = all.filter((image) => image.altText?.startsWith('Product detail — '));
  const detailPattern = escaped ? new RegExp(`1000x1000_${escaped}-\\d+(?:[_.]|$)`, 'i') : null;
  const details = detailPhotos.filter((image) => !/1000x1000_\d+[a-z]-\d+/i.test(image.url) || detailPattern?.test(image.url));
  return {all, details, selected: matching.length ? [...new Map([selectedImage, ...matching].filter(Boolean).map((image) => [image.url, image])).values()] : all};
}

export function galleryStep(index, direction, count, wrap = false) {
  if (count < 2) return 0;
  const next = index + direction;
  return wrap ? (next + count) % count : Math.min(count - 1, Math.max(0, next));
}

export function gallerySwipe(dx, dy) {
  return Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy) * 1.3 ? (dx < 0 ? 1 : -1) : 0;
}
