/** Keep every image available, while matching imported SKU galleries by filename. */
export function productGallery(images = [], selectedImage, sku = '') {
  const all = [...new Map([selectedImage, ...images].filter(Boolean).map((image) => [image.url, image])).values()];
  const escaped = sku.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = escaped ? new RegExp(`(?:^|/)(?:800x800_|seineshop-)?${escaped}-\\d+(?:[_.]|$)`, 'i') : null;
  const matching = pattern ? all.filter((image) => pattern.test(new URL(image.url).pathname)) : [];
  const detailPhotos = all.filter((image) => image.altText?.startsWith('Product detail — '));
  const detailPattern = escaped ? new RegExp(`1000x1000_${escaped}-\\d+(?:[_.]|$)`, 'i') : null;
  const details = detailPhotos.filter((image) => !/1000x1000_\d+[a-z]-\d+/i.test(image.url) || detailPattern?.test(image.url));
  return {all, details, selected: matching.length ? [...new Map([selectedImage, ...matching].filter(Boolean).map((image) => [image.url, image])).values()] : all};
}
