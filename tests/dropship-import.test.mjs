import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createImportPlan, readVariantMapping, SOURCE_SHOP, TEST_SHOP} from '../apps/dropshipping/seine-shop-dropshipping-dev/src/catalog-plan.mjs';
import {importDraftProduct, TARGET_SETUP_QUERY, LOOKUP_QUERY, IMPORT_MUTATION, MAPPING_MUTATION, MAPPING_QUERY} from '../apps/dropshipping/seine-shop-dropshipping-dev/src/catalog-import.mjs';
import {readPublicProduct} from '../apps/dropshipping/seine-shop-dropshipping-dev/src/catalog-source.mjs';
import {verifyDraftImport, VERIFY_QUERY} from '../apps/dropshipping/seine-shop-dropshipping-dev/src/catalog-verify.mjs';

const image = {url: 'https://cdn.shopify.com/s/files/1/test/black.jpg?v=1', altText: 'Black'};
const variant = (id, color) => ({id: `gid://shopify/ProductVariant/${id}`, sku: 'same-sku',
  selectedOptions: [{name: 'Color', value: color}], price: {amount: '19.00', currencyCode: 'USD'}, image,
  inventoryQuantity: 9999, privateCost: 'private-data'});
const product = () => ({id: 'gid://shopify/Product/12', title: 'Test charger', handle: 'test-charger', descriptionHtml: '<p>Public description.</p>',
  options: [{name: 'Color', values: ['Black', 'White']}],
  images: {nodes: [image], pageInfo: {hasNextPage: false}},
  variants: {nodes: [variant(21, 'Black'), variant(22, 'White')], pageInfo: {hasNextPage: false}},
  metafields: [{namespace: 'private', value: 'private-data'}], sourceSnapshot: 'private-data', tags: ['private-data']});
function setup() {
  return {shop: {myshopifyDomain: TEST_SHOP, currencyCode: 'USD'},
    productDefinition: {type: {name: 'id'}, access: {storefront: 'NONE'}, capabilities: {uniqueValues: {enabled: true}}},
    variantDefinition: {type: {name: 'single_line_text_field'}, access: {storefront: 'NONE'}},
    mappingDefinition: {type: 'app--test--product_mapping', access: {storefront: 'NONE'}}};
}
function imported(p = product()) {
  return {id: 'gid://shopify/Product/98', status: 'DRAFT', sourceId: {value: `${SOURCE_SHOP}:${p.id}`},
    variants: {nodes: [...p.variants.nodes].reverse().map((v, i) => ({id: `gid://shopify/ProductVariant/${88 + i}`, sourceId: {value: `${SOURCE_SHOP}:${v.id}`}})), pageInfo: {hasNextPage: false}}};
}
const sourceProduct = () => {const p = product(); p.options = p.options.map((option) => ({name: option.name, optionValues: option.values.map((name) => ({name}))})); return p;};
function store({existing = null, existingMapping = null, loseCreate = false, failMapping = false} = {}) {
  const writes = [];
  const reads = [];
  let target = existing, mapping = existingMapping;
  return {
    writes, reads,
    source: async () => ({product: sourceProduct()}),
    admin: async (query, variables) => {
      reads.push(query);
      if (query === TARGET_SETUP_QUERY) return setup();
      if (query === LOOKUP_QUERY) return {product: target};
      if (query === IMPORT_MUTATION) {
        writes.push({query, variables});
        assert.equal(variables.input.status, 'DRAFT');
        assert.equal(variables.identifier, undefined);
        assert.doesNotMatch(query, /identifier:/);
        target = imported();
        if (loseCreate) {loseCreate = false; throw new Error('private transport failure');}
        return {productSet: {product: {id: target.id}, userErrors: []}};
      }
      if (query === MAPPING_QUERY) return {metaobjectByHandle: mapping};
      if (query === MAPPING_MUTATION) {
        writes.push({query, variables});
        if (failMapping) {failMapping = false; return {metaobjectUpsert: {metaobject: null, userErrors: [{code: 'FAILED'}]}};}
        mapping = {id: 'gid://shopify/Metaobject/9', fields: variables.metaobject.fields};
        return {metaobjectUpsert: {metaobject: {id: mapping.id}, userErrors: []}};
      }
      assert.fail('Unexpected operation');
    },
  };
}

test('draft plan picks only public fields and keeps matching by source IDs, even for equal SKUs', () => {
  const plan = createImportPlan(product(), 'USD');
  assert.equal(plan.input.status, 'DRAFT');
  assert.equal(plan.input.files.length, 1);
  assert.equal(plan.variantIds.length, 2);
  for (const row of plan.input.variants) {
    assert.equal(row.inventoryItem.tracked, true);
    assert.equal(row.inventoryPolicy, 'DENY');
    assert.equal(row.inventoryQuantities, undefined);
    assert.equal(row.inventoryItem.sku, 'same-sku');
  }
  assert.doesNotMatch(JSON.stringify(plan), /private-data|sourceSnapshot|inventoryQuantity|publication/);
  assert.deepEqual(readVariantMapping(plan, imported()).map((r) => r.sourceVariantId), plan.variantIds);
});

test('incomplete pages, price conversion, duplicate variants/options and unsafe image hosts fail before any write', () => {
  for (const mutate of [
    (p) => {p.variants.pageInfo.hasNextPage = true;},
    (p) => {p.images.pageInfo.hasNextPage = true;},
    (p) => {p.variants.nodes[1].id = p.variants.nodes[0].id;},
    (p) => {p.variants.nodes[1].selectedOptions[0].value = 'Black';},
    (p) => {p.variants.nodes[0].price.amount = '-1';},
    (p) => {p.variants.nodes[0].price.currencyCode = 'JPY';},
    (p) => {p.images.nodes = [{url: 'https://cdn.shopify.com.evil.test/file.jpg'}];},
    (p) => {p.variants.nodes[0].image = {url: 'http://cdn.shopify.com/file.jpg'};},
  ]) {
    const p = product(); mutate(p);
    assert.throws(() => createImportPlan(p, 'USD'));
  }
  assert.throws(() => createImportPlan(product(), 'EUR'), /currency-mismatch/);
});

test('read-only preview never mutates target; production shop and public mapping definitions are refused', async () => {
  const ctx = store();
  const preview = await importDraftProduct(ctx, 'test-charger');
  assert.equal(preview.status, 'ready');
  assert.equal(ctx.writes.length, 0);
  for (const mutate of [
    (s) => {s.shop.myshopifyDomain = SOURCE_SHOP;},
    (s) => {s.mappingDefinition.access.storefront = 'PUBLIC_READ';},
    (s) => {s.productDefinition.capabilities.uniqueValues.enabled = false;},
    (s) => {s.productDefinition.type.name = 'single_line_text_field';},
  ]) {
    await assert.rejects(importDraftProduct({source: () => assert.fail('Must refuse before source query'),
      admin: async () => {const s = setup(); mutate(s); return s;}}, 'test-charger', {apply: true}));
  }
});

test('successful draft import reads back mapping; a repeat does not update product or overwrite merchant changes', async () => {
  const ctx = store();
  const first = await importDraftProduct(ctx, 'test-charger', {apply: true});
  assert.equal(first.status, 'created');
  assert.equal(ctx.writes.length, 2);
  const second = await importDraftProduct(ctx, 'test-charger', {apply: true});
  assert.equal(second.status, 'reused');
  assert.equal(ctx.writes.length, 2);
  assert.equal(ctx.writes[1].variables.handle.type, '$app:product_mapping');
  assert.equal(ctx.writes[1].variables.metaobject.fields.find((field) => field.key === 'variant_map').value,
    JSON.stringify(readVariantMapping(createImportPlan(product(), 'USD'), imported())));
});

test('a lost create response is recovered on explicit retry with no second product write', async () => {
  const ctx = store({loseCreate: true});
  await assert.rejects(importDraftProduct(ctx, 'test-charger', {apply: true}), /import-uncertain/);
  assert.equal(ctx.writes.length, 1);
  const result = await importDraftProduct(ctx, 'test-charger', {apply: true});
  assert.equal(result.status, 'recovered');
  assert.equal(ctx.writes.filter((call) => call.query === IMPORT_MUTATION).length, 1);
});

test('failed mapping save is recoverable, and conflicting or truncated mappings are never overwritten', async () => {
  const ctx = store({failMapping: true});
  await assert.rejects(importDraftProduct(ctx, 'test-charger', {apply: true}), /mapping-pending/);
  assert.equal((await importDraftProduct(ctx, 'test-charger', {apply: true})).status, 'recovered');
  assert.equal(ctx.writes.filter((call) => call.query === IMPORT_MUTATION).length, 1);
  const conflict = store({existing: imported(), existingMapping: {id: 'meta', fields: [{key: 'target_product', value: 'other-product'}]}});
  await assert.rejects(importDraftProduct(conflict, 'test-charger', {apply: true}), /mapping-mismatch/);
  assert.equal(conflict.writes.length, 0);
  const p = imported(); p.variants.nodes[0].sourceId.value = 'wrong';
  assert.throws(() => readVariantMapping(createImportPlan(product(), 'USD'), p), /mapping-mismatch/);
});

test('source image pagination preserves all pages and detects a repeated cursor', async () => {
  let calls = 0;
  const result = await readPublicProduct(async (_query, vars) => {
    const p = sourceProduct(); calls++;
    p.images = {nodes: [{url: `${image.url}&page=${calls}`}], pageInfo: {hasNextPage: calls === 1, endCursor: 'next'}};
    if (calls === 2) assert.equal(vars.after, 'next');
    return {product: p};
  }, 'test-charger');
  assert.equal(result.images.nodes.length, 2);
  await assert.rejects(readPublicProduct(async () => {
    const p = sourceProduct(); p.images.pageInfo = {hasNextPage: true, endCursor: 'repeat'};
    return {product: p};
  }, 'test-charger'), /incomplete-catalog/);
  calls = 0;
  await assert.rejects(readPublicProduct(async () => {
    const p = sourceProduct(); calls++;
    p.updatedAt = calls === 1 ? '2026-11-15T00:00:00Z' : '2026-11-16T00:00:00Z';
    p.images.pageInfo = {hasNextPage: calls === 1, endCursor: 'next'};
    return {product: p};
  }, 'test-charger'), /catalog-changed/);
});

test('read-only verification detects pending images and merchant changes without altering the imported draft', async () => {
  const ctx = store();
  await importDraftProduct(ctx, 'test-charger', {apply: true});
  const target = {...imported(), title: product().title, handle: product().handle,
    descriptionHtml: product().descriptionHtml, totalInventory: 0, publishedAt: null,
    media: {nodes: [{id: 'media-1', status: 'READY', alt: 'Black'}], pageInfo: {hasNextPage: false}}};
  target.variants.nodes = target.variants.nodes.map((v) => {
    const original = product().variants.nodes.find((p) => v.sourceId.value.endsWith(p.id));
    return {...v, sku: original.sku, price: original.price.amount, selectedOptions: original.selectedOptions,
      inventoryPolicy: 'DENY', inventoryQuantity: 0, inventoryItem: {tracked: true},
      media: {nodes: [{id: 'media-1', status: 'READY', alt: 'Black'}], pageInfo: {hasNextPage: false}}};
  });
  const audit = {...ctx, admin: (query, variables) => query === VERIFY_QUERY ? {product: target} : ctx.admin(query, variables)};
  assert.equal((await verifyDraftImport(audit, 'test-charger')).verified, true);
  target.media.nodes[0].status = 'PROCESSING';
  assert.deepEqual((await verifyDraftImport(audit, 'test-charger')).failures, ['media']);
  target.media.nodes[0].status = 'READY';
  target.status = 'ACTIVE';
  target.variants.nodes[0].price = '25.00';
  target.variants.nodes[0].inventoryQuantity = 10;
  assert.deepEqual((await verifyDraftImport(audit, 'test-charger')).failures, ['draft-status', 'variant-data', 'variant-inventory']);
  assert.equal(ctx.writes.length, 2);
});
