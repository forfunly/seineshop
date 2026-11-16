import {createHash} from 'node:crypto';

export const SOURCE_SHOP = 'ps83if-c4.myshopify.com';
export const TEST_SHOP = 'seine-shop-dropship-test.myshopify.com';
export const MAPPING_TYPE = '$app:product_mapping';
export class ImportError extends Error {
  constructor(code) {super(code); this.code = code;}
}

const fail = (code = 'invalid-catalog') => {throw new ImportError(code);};
const text = (value, max = 255) => typeof value === 'string' && value.trim() && value.length <= max;
const productId = (id) => /^gid:\/\/shopify\/Product\/\d+$/.test(id || '');
const variantId = (id) => /^gid:\/\/shopify\/ProductVariant\/\d+$/.test(id || '');
const sourceKey = (id) => `${SOURCE_SHOP}:${id}`;

function imageFile(image) {
  if (!image) return null;
  let url;
  try {url = new URL(image.url);} catch {fail('invalid-image');}
  if (url.protocol !== 'https:' || url.hostname !== 'cdn.shopify.com' || url.username || url.password || url.port)
    fail('invalid-image');
  return {originalSource: url.href, contentType: 'IMAGE', alt: typeof image.altText === 'string' ? image.altText.slice(0, 512) : ''};
}

/** Only explicitly selected public catalog fields become an import payload. */
export function createImportPlan(product, targetCurrency) {
  if (!productId(product?.id) || !text(product.title) || !/^[a-z0-9][a-z0-9-]{0,254}$/.test(product.handle || '') ||
    typeof product.descriptionHtml !== 'string' || product.descriptionHtml.length > 1000000)
    fail();
  const options = product.options;
  const variants = product.variants?.nodes;
  if (!Array.isArray(options) || !options.length || options.length > 3 || !Array.isArray(variants) || !variants.length || variants.length > 250 ||
    product.variants.pageInfo?.hasNextPage || product.images?.pageInfo?.hasNextPage) fail('incomplete-catalog');
  if (!/^[A-Z]{3}$/.test(targetCurrency || '')) fail('currency-mismatch');
  const optionNames = new Set();
  for (const option of options) {
    if (!text(option.name) || optionNames.has(option.name) || !Array.isArray(option.values) || !option.values.length ||
      option.values.some((value) => !text(value)) || new Set(option.values).size !== option.values.length) fail();
    optionNames.add(option.name);
  }
  const seenIds = new Set(), combinations = new Set(), files = new Map();
  for (const image of product.images?.nodes || []) {
    const file = imageFile(image);
    files.set(file.originalSource, file);
  }
  const rows = variants.map((variant) => {
    if (!variantId(variant.id) || seenIds.has(variant.id) || !Array.isArray(variant.selectedOptions) || variant.selectedOptions.length !== options.length ||
      !/^\d{1,12}(?:\.\d{1,4})?$/.test(variant.price?.amount || '') || Number(variant.price.amount) <= 0) fail();
    if (variant.price.currencyCode !== targetCurrency) fail('currency-mismatch');
    seenIds.add(variant.id);
    const values = new Map(variant.selectedOptions.map((option) => [option.name, option.value]));
    const optionValues = options.map((option) => {
      if (!option.values.includes(values.get(option.name))) fail();
      return {optionName: option.name, name: values.get(option.name)};
    });
    const combination = JSON.stringify(optionValues);
    if (combinations.has(combination)) fail('duplicate-options');
    combinations.add(combination);
    const file = imageFile(variant.image);
    if (file) files.set(file.originalSource, file);
    return {
      price: variant.price.amount, optionValues,
      inventoryPolicy: 'DENY', inventoryItem: {tracked: true, ...(typeof variant.sku === 'string' && variant.sku.length <= 255 ? {sku: variant.sku} : {})},
      metafields: [{namespace: '$app', key: 'source_id', type: 'single_line_text_field', value: sourceKey(variant.id)}],
      ...(file ? {file} : {}),
    };
  });
  if (files.size > 250) fail('too-many-images');
  const input = {
    title: product.title, handle: product.handle, descriptionHtml: product.descriptionHtml, status: 'DRAFT',
    productOptions: options.map((option) => ({name: option.name, values: option.values.map((name) => ({name}))})),
    variants: rows, ...(files.size ? {files: [...files.values()]} : {}),
    metafields: [{namespace: '$app', key: 'source_id', type: 'id', value: sourceKey(product.id)}],
  };
  const hash = createHash('sha256').update(JSON.stringify(input)).digest('hex');
  return {input, sourceProductId: product.id, currency: targetCurrency, hash,
    identifier: {customId: {namespace: '$app', key: 'source_id', value: sourceKey(product.id)}},
    mappingHandle: `product-${createHash('sha256').update(sourceKey(product.id)).digest('hex')}`,
    variantIds: variants.map(({id}) => id)};
}

export function readVariantMapping(plan, imported) {
  if (!productId(imported?.id) || imported.sourceId?.value !== plan.identifier.customId.value || imported.variants?.pageInfo?.hasNextPage)
    fail('mapping-mismatch');
  const nodes = imported.variants?.nodes;
  if (!Array.isArray(nodes) || nodes.length !== plan.variantIds.length) fail('mapping-mismatch');
  const expected = new Set(plan.variantIds.map(sourceKey));
  const targetIds = new Set();
  const mappings = nodes.map((node) => {
    if (!variantId(node.id) || targetIds.has(node.id) || !expected.delete(node.sourceId?.value)) fail('mapping-mismatch');
    targetIds.add(node.id);
    return {sourceVariantId: node.sourceId.value.slice(SOURCE_SHOP.length + 1), targetVariantId: node.id};
  });
  return mappings.sort((a, b) => a.sourceVariantId.localeCompare(b.sourceVariantId));
}
