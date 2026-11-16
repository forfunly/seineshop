import {createImportPlan, readVariantMapping, ImportError, SOURCE_SHOP, TEST_SHOP, MAPPING_TYPE} from './catalog-plan.mjs';
import {readPublicProduct} from './catalog-source.mjs';

const IMPORTED_PRODUCT = `id status sourceId: metafield(namespace: "$app", key: "source_id") { value }
  variants(first: 250) { nodes { id sourceId: metafield(namespace: "$app", key: "source_id") { value } } pageInfo { hasNextPage } }`;

export const TARGET_SETUP_QUERY = `query DropshipTargetSetup {
  shop { myshopifyDomain currencyCode }
  productDefinition: metafieldDefinition(identifier: {namespace: "$app", key: "source_id", ownerType: PRODUCT}) {
    type { name } access { storefront } capabilities { uniqueValues { enabled } }
  }
  variantDefinition: metafieldDefinition(identifier: {namespace: "$app", key: "source_id", ownerType: PRODUCTVARIANT}) { type { name } access { storefront } }
  mappingDefinition: metaobjectDefinitionByType(type: "$app:product_mapping") { type access { storefront } }
}`;
export const LOOKUP_QUERY = `query DropshipImportedProduct($identifier: ProductIdentifierInput!) {
  product: productByIdentifier(identifier: $identifier) { ${IMPORTED_PRODUCT} }
}`;
export const IMPORT_MUTATION = `mutation DropshipDraftImport($input: ProductSetInput!) {
  productSet(input: $input, synchronous: true) {
    product { id }
    userErrors { code field }
  }
}`;
export const MAPPING_MUTATION = `mutation DropshipSaveMapping($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
  metaobjectUpsert(handle: $handle, metaobject: $metaobject) { metaobject { id } userErrors { code field } }
}`;
export const MAPPING_QUERY = `query DropshipMappingReadback($handle: MetaobjectHandleInput!) {
  metaobjectByHandle(handle: $handle) { id fields { key value } }
}`;

export function validateSetup(setup) {
  if (setup.shop?.myshopifyDomain !== TEST_SHOP) throw new ImportError('wrong-target');
  const {productDefinition: product, variantDefinition: variant, mappingDefinition: mapping} = setup;
  if (product?.type?.name !== 'id' || !product.capabilities?.uniqueValues?.enabled ||
    variant?.type?.name !== 'single_line_text_field' || !mapping?.type ||
    [product, variant, mapping].some((definition) => definition.access?.storefront !== 'NONE'))
    throw new ImportError('definitions-not-ready');
}

/** Default is read-only; apply must be explicit. No product update or publication operation exists here. */
export async function importDraftProduct({source, admin}, handle, {apply = false} = {}) {
  const setup = await admin(TARGET_SETUP_QUERY);
  validateSetup(setup);
  const product = await readPublicProduct(source, handle);
  const plan = createImportPlan(product, setup.shop.currencyCode);
  const mappingHandle = {type: MAPPING_TYPE, handle: plan.mappingHandle};
  let {product: imported} = await admin(LOOKUP_QUERY, {identifier: plan.identifier});
  if (!apply) return {status: imported ? 'already-imported' : 'ready', sourceShop: SOURCE_SHOP, targetShop: TEST_SHOP,
    sourceProductId: product.id, title: product.title, currency: plan.currency, variants: plan.variantIds.length,
    images: plan.input.files?.length || 0, targetStatus: 'DRAFT', snapshotHash: plan.hash};
  const reused = Boolean(imported);
  if (!imported) {
    let data;
    // Create-only: omitting identifier prevents productSet from replacing an existing product's variant list.
    // The unique source_id rejects concurrent duplicate creates; a manual retry looks up the existing product.
    try {data = await admin(IMPORT_MUTATION, {input: plan.input});}
    catch {throw new ImportError('import-uncertain');}
    if (data.productSet?.userErrors?.length) throw new ImportError('import-rejected');
    if (!data.productSet?.product?.id) throw new ImportError('import-uncertain');
    ({product: imported} = await admin(LOOKUP_QUERY, {identifier: plan.identifier}));
  }
  const variants = readVariantMapping(plan, imported);
  const previous = await admin(MAPPING_QUERY, {handle: mappingHandle});
  const previousFields = Object.fromEntries((previous.metaobjectByHandle?.fields || []).map(({key, value}) => [key, value]));
  // Reuse and verify an existing record; never overwrite another association or mislabel a later catalog snapshot as imported.
  if (previous.metaobjectByHandle) {
    if (previousFields.source_shop !== SOURCE_SHOP || previousFields.source_product_id !== product.id ||
      previousFields.target_product !== imported.id || previousFields.variant_map !== JSON.stringify(variants))
      throw new ImportError('mapping-mismatch');
    return {status: 'reused', title: product.title, sourceProductId: product.id, targetProductId: imported.id, variants: variants.length};
  }
  const fields = {source_shop: SOURCE_SHOP, source_product_id: product.id, target_product: imported.id,
    variant_map: JSON.stringify(variants), currency: plan.currency, snapshot_hash: reused ? 'recovered-unverified-snapshot' : plan.hash};
  const saved = await admin(MAPPING_MUTATION, {handle: mappingHandle,
    metaobject: {fields: Object.entries(fields).map(([key, value]) => ({key, value}))}});
  if (!saved.metaobjectUpsert?.metaobject?.id || saved.metaobjectUpsert.userErrors?.length) throw new ImportError('mapping-pending');
  const check = await admin(MAPPING_QUERY, {handle: mappingHandle});
  const readback = Object.fromEntries((check.metaobjectByHandle?.fields || []).map(({key, value}) => [key, value]));
  if (Object.entries(fields).some(([key, value]) => readback[key] !== value)) throw new ImportError('mapping-pending');
  return {status: reused ? 'recovered' : 'created', title: product.title, sourceProductId: product.id, targetProductId: imported.id, variants: variants.length};
}
