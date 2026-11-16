# Seine Shop Dropshipping Dev

Independent, test-only Shopify application scaffolded with Shopify CLI 3.93.2 (`none` template). The template is an archived minimal scaffold; this project uses it for CLI registration/configuration and the maintained official `@shopify/shopify-api` 15.1.1 for server-side tools. It has no embedded app home or HTTP server yet.

## Scope and data

- Source: selected public Storefront catalog fields from `ps83if-c4.myshopify.com`.
- Target locked to `seine-shop-dropship-test.myshopify.com`.
- Create DRAFT only. No publication, inventory quantities, source edits, orders or fulfillment operations.
- App-owned product ID (`id` type/unique), variant source ID and product_mapping metaobject; all Storefront access NONE.
- Recover a lost response on explicit retry using the unique source ID. Existing products are reused, never updated. Conflicting mappings stop processing.
- Only the same-organization development client-credentials grant is implemented. Customer-shop OAuth and a website workspace remain future stages.

## Modules and maintenance

`src/` uses English kebab-case: `shopify-client.mjs` for official server SDK authentication; `catalog-source.mjs` for paginated public reads; `catalog-plan.mjs` for whitelisted payloads; `catalog-import.mjs` for recoverable draft/mapping writes; `catalog-verify.mjs` for read-only verification; `run-import.mjs` for explicit command selection.

Definitions belong in `shopify.app.toml`, installed via CLI development preview and verified before values are written. No external database is introduced. Source fields include public title, HTML description, options, SKU, price and Shopify CDN images only. Source private fields, tags and inventory quantities are excluded. Currency mismatch, truncated variants/images and duplicate options stop the import.

Dependencies, credentials, local sessions, logs and build output remain ignored and are retained until authorized cleanup. This module does not change the Hydrogen runtime. Keep source/config/lockfile under the parent repository, not a nested Git repository. Original empty scaffold Git metadata is retained in the root ignored tooling cache (see project state).

## Run from repository root

See the root [README](../../../README.md#test-store-dropshipping-draft-import) for environment names and commands. `--apply` writes one authorized development-store draft; `--verify` reads back content/prices/options/images/zero stock/draft state/private mappings and fails if changed. Default is read-only preview. Never put tokens in arguments or logs.

For the independent app's local dependencies, run `npm ci --prefix apps/dropshipping/seine-shop-dropshipping-dev`. Do not install globally or publish/deploy as part of an import. CLI development preview uses the existing authenticated developer account. Local loopback preview is sufficient for config testing; no public tunnel is required for this server tool.

## Official references

- [Shopify CLI app development](https://shopify.dev/docs/api/shopify-cli/app/app-dev)
- [Custom IDs](https://shopify.dev/docs/apps/build/metafields/working-with-custom-ids)
- [Client credentials grant](https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/client-credentials-grant)
- [Storefront API access](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/getting-started)
