export const MAX_PURCHASE_QUANTITY = 9999;
export const QUANTITY_TIERS = [1, 10, 50, 100];
export const SALES_EMAIL = 'steven@seineshop.com';
export const validPurchaseQuantity = (quantity) => Number.isInteger(Number(quantity)) && Number(quantity) >= 1 && Number(quantity) <= MAX_PURCHASE_QUANTITY;
export function inquiryMailto({product, variant, quantity, type, company = '', destination = '', requirements = ''}) {
  const subject = `${type} inquiry — ${product.title}`.replace(/[\r\n]/g, ' ');
  const body = [
    'Hello Steven,', '', `Request: ${type}`, `Product: ${product.title}`,
    `Product URL: https://www.seineshop.com/products/${encodeURIComponent(product.handle)}`,
    `Variant: ${variant?.title || ''}`, `SKU: ${variant?.sku || ''}`,
    `Quantity: ${quantity}`, `Company: ${company}`, `Destination / target market: ${destination}`,
    '', 'Requirements:', requirements, '', 'Please confirm pricing, MOQ, sample options and lead time.',
  ].join('\n');
  return `mailto:${SALES_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
