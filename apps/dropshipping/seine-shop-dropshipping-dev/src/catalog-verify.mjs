import {createImportPlan, readVariantMapping, ImportError, SOURCE_SHOP, MAPPING_TYPE} from './catalog-plan.mjs';
import {readPublicProduct} from './catalog-source.mjs';
import {TARGET_SETUP_QUERY, LOOKUP_QUERY, MAPPING_QUERY, validateSetup} from './catalog-import.mjs';

export const VERIFY_QUERY = `query DropshipVerifyDraft($id: ID!) {
  product(id: $id) {
    id title handle status descriptionHtml totalInventory publishedAt
    media(first: 250) { nodes { id status alt } pageInfo { hasNextPage } }
    variants(first: 250) {
      nodes { id sku price inventoryPolicy inventoryQuantity inventoryItem { tracked }
        selectedOptions { name value }
        media(first: 10) { nodes { id status alt } pageInfo { hasNextPage } }
        sourceId: metafield(namespace: "$app", key: "source_id") { value }
      }
      pageInfo { hasNextPage }
    }
    sourceId: metafield(namespace: "$app", key: "source_id") { value }
  }
}`;

/** Read-only audit of the initial draft. Merchant edits are reported, never overwritten. */
export async function verifyDraftImport({source, admin}, handle) {
  const setup = await admin(TARGET_SETUP_QUERY);
  validateSetup(setup);
  const product = await readPublicProduct(source, handle);
  const plan = createImportPlan(product, setup.shop.currencyCode);
  const {product: imported} = await admin(LOOKUP_QUERY, {identifier: plan.identifier});
  if (!imported) throw new ImportError('not-imported');
  const {product: target} = await admin(VERIFY_QUERY, {id: imported.id});
  const variants = readVariantMapping(plan, target);
  const {metaobjectByHandle: mapping} = await admin(MAPPING_QUERY, {handle: {type: MAPPING_TYPE, handle: plan.mappingHandle}});
  const fields = Object.fromEntries((mapping?.fields || []).map(({key, value}) => [key, value]));
  const mediaIds = new Set(target.media.nodes.map(({id}) => id));
  const failures = [];
  if (target.status !== 'DRAFT' || target.publishedAt !== null) failures.push('draft-status');
  if (target.title !== product.title || target.handle !== product.handle || target.descriptionHtml !== product.descriptionHtml) failures.push('content');
  if (target.totalInventory !== 0) failures.push('inventory');
  if (target.media.pageInfo.hasNextPage || target.media.nodes.length !== (plan.input.files?.length || 0) ||
    target.media.nodes.some(({status}) => status !== 'READY')) failures.push('media');
  for (const row of variants) {
    const original = product.variants.nodes.find(({id}) => id === row.sourceVariantId);
    const result = target.variants.nodes.find(({id}) => id === row.targetVariantId);
    if (result.sku !== original.sku || Number(result.price) !== Number(original.price.amount) ||
      original.selectedOptions.some(({name, value}) => !result.selectedOptions.some((option) => option.name === name && option.value === value))) failures.push('variant-data');
    if (!result.inventoryItem.tracked || result.inventoryPolicy !== 'DENY' || result.inventoryQuantity !== 0) failures.push('variant-inventory');
    if (result.media.pageInfo.hasNextPage || (original.image && !result.media.nodes.length) ||
      result.media.nodes.some(({id, status, alt}) => !mediaIds.has(id) || status !== 'READY' || alt !== (original.image?.altText || ''))) failures.push('variant-media');
  }
  if (fields.source_shop !== SOURCE_SHOP) failures.push('mapping-source');
  if (fields.target_product !== target.id || fields.source_product_id !== product.id || fields.variant_map !== JSON.stringify(variants) ||
    fields.currency !== plan.currency || fields.snapshot_hash !== plan.hash) failures.push('mapping');
  if (setup.productDefinition?.access?.storefront !== 'NONE' || setup.variantDefinition?.access?.storefront !== 'NONE' ||
    setup.mappingDefinition?.access?.storefront !== 'NONE') failures.push('private-access');
  return {verified: failures.length === 0, failures: [...new Set(failures)], sourceProductId: product.id,
    targetProductId: target.id, status: target.status, inventory: target.totalInventory, variants: variants.length,
    images: target.media.nodes.length, imageStatuses: [...new Set(target.media.nodes.map(({status}) => status))]};
}
