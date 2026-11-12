# SeineShop — Shopify Headless Storefront

Production storefront: https://www.seineshop.com

A React Router / Shopify Hydrogen storefront hosted on Oxygen. This repository contains the complete application source, public assets, dependency lockfile, generated Storefront types, release checks and tests. Product, inventory, pricing, market and checkout data are managed in Shopify, not embedded database exports.

## Run locally

Requirements: Node.js 24, npm, access to the SeineShop Shopify storefront.

```sh
npm ci
cp .env.example .env
# Populate .env with your store's configuration and a random SESSION_SECRET.
npm run dev
```

Open http://localhost:3000. Keep indexing disabled locally. Real environment files and deployment credentials are intentionally excluded from Git.

## Shared project rules

Clone this repository into a local directory of your choice. Paths in the project rules are relative to the repository root and do not depend on an operating system, username or external memory file.

Start with [AGENTS.md](AGENTS.md), then read the task-specific files it lists in [docs/rules/](docs/rules/). Read the latest summary in [docs/project-state.md](docs/project-state.md) when taking over work or handling platform connections; historical records are not current authorization. Linked documents must be explicitly read as directed; a link does not automatically load their contents. Keep credentials in authorized, Git-ignored local configuration.

## Checks

```sh
npm run lint
node --test tests/*.test.mjs
npm run codegen
npm run build
node scripts/check-collection-filters.mjs
node scripts/audit-source-exposure.mjs --built
```

The source-exposure audit is a release gate for application sources and compiled assets. Never import operational scripts or private sourcing records into browser bundles. The full scaffold lint configuration can also be run with `npm run lint`.

## Deploy to Shopify Oxygen

Configure the matching store/environment using Shopify CLI and merchant-owned credentials. The production environment is mapped to the `main` branch. Pushing this repository alone does not configure automatic Oxygen deployment.

```sh
node_modules/.bin/shopify.cmd hydrogen deploy --env production --no-json-output
```

The production environment requires the variables listed in `.env.example`; set `PUBLIC_SITE_URL=https://www.seineshop.com`, `PUBLIC_INDEXABLE=true`, `PUBLIC_JOURNAL_INDEXABLE=true`, and `PUBLIC_CATALOG_PREVIEW=false` only for the intended production environment. Verify the public domain after publishing; propagation can lag deployment completion.

## Project map

- `app/components/`: shared storefront, cart, product, search, blog and localization UI.
- `app/routes/`: page routes, cart actions, checkout, localization, sitemap and robots endpoints.
- `app/lib/`: Shopify context, market/cart logic, SEO, catalog filters and data helpers.
- `app/styles/`: shared layout, green visual theme, mobile, cart, search and editorial styles.
- `app/locales/`: English-keyed Japanese/German translations; localized URLs use `/jp/` and `/de/`.
- `app/data/`: editorial/navigation content and sanitized development-preview catalog data.
- `public/images/`: product fallback artwork and payment icons.
- `tests/`: checkout, markets, locale, SEO, sitemap and wholesale behavior checks.
- `scripts/`: release audits and collection filter verification.

The product photo and business inquiry dialogs share `app/lib/use-modal-dialog.js`. It opens native modal dialogs, focuses the close button only when opened, wraps Tab/Shift+Tab within the dialog, and restores focus to the trigger on close. Business inquiries use native backdrop dismissal where supported, with a fallback for older browsers.

## Shopify configuration

- Prices and currency conversions come from Shopify Markets. Base currency is USD; country selection updates cart buyer identity before refreshing prices.
- Search uses Storefront predictive search and product filters configured in Search & Discovery.
- Public product specifications use `custom.technical_specifications` JSON. Private sourcing/procurement records must remain inaccessible to the Storefront API.
- Wholesale tiers currently request quotes; no automatic tier discount is promised. OEM/ODM inquiries prepare an email draft for `steven@seineshop.com`.
- Checkout is Shopify-hosted. Payment availability and shipping/taxes are determined at checkout.
- GA4 retains the existing shared-head initialization and measurement ID `G-BKLZMJ9EP7` for the current release candidate, as requested by the merchant.

## Analytics consent

The consent-gated implementation is retained in source but is currently disconnected from the application: `ConsentAnalytics`, `CookiePreferences`, `app/lib/google-analytics-consent.js`, and their controlled tests are dormant. The root and footer do not import or render these components, and the new privacy banner is not enabled. The active release candidate preserves the previous GA4 behavior; it does not claim that GA4 now stops after refusal.

`node --test tests/analytics-consent.test.mjs` verifies only the dormant helper. Earlier browser evidence describes that earlier candidate, not the active release candidate. See [earlier consent QA](docs/qa/2026-11-03-analytics-consent.md) and [revised release scope](docs/plans/2026-11-03-oxygen-production-release.md) for the merchant's later decision and deployment boundaries. No environment variables or dependencies are added by this scope change.

See [RELEASE-NOTES.md](RELEASE-NOTES.md) for the complete iteration summary and validation record.

## Browser catalog import tools

These local tools prepare and audit authorized Shopify catalog imports; they do not send API mutations. Browser capture uses the active browser tool session and rendered DOM only. No TVCMALL API key is needed.

- `scripts/tvcmall-browser-capture.mjs`: capture a listing product and its visible SKU options with `captureGroup(tab, root, listingItem, index)`. Save successful group records to `groups.json`; raw records go to `products/<SKU>.json`. A group is complete only when every displayed option has a verified SKU record.
- `scripts/prepare-tvcmall-import.py`: prepare ProductSet JSONL from complete groups. Requires `groups.json`, `products/`, `shopify-existing-1.json`; also reads the baseline `shopify-all-skus.jsonl`, completed `imported-products.json`, and reviewed `handle-qualifiers.json` when present. Existing SKUs/handles are excluded. Outputs `<name>.jsonl` and `<name>-review.json`; inspect rejections before authorized writes.
- `scripts/audit-tvcmall-import.py`: compare a fresh Shopify `final-catalog-audit.jsonl` readback with captures. Checks complete SKU membership, uniqueness, ordinary prices, private source URLs/tier prices, ready variant images and three configured publication channels. When `snapshot-audit.jsonl` exists, also reconstructs private snapshot parts and compares every raw SKU record. Outputs `final-audit-summary.json`, exits nonzero on differences. The audit query shape is documented in the task QA record.

```sh
python3 scripts/prepare-tvcmall-import.py --root .cache/catalog/iphone-duo-2026-11-11 --output next-batch
python3 scripts/audit-tvcmall-import.py --root .cache/catalog/iphone-duo-2026-11-11
node --test tests/tvcmall-import.test.mjs
```

This batch uses the user's explicit ×1 ordinary USD price instruction. Wholesale intervals, MOQ, source URLs and complete raw parameter records remain private. Large snapshots are split below 120,000 UTF-8 bytes into `custom.source_snapshot_part_01` onward, with a manifest in `custom.source_snapshot`; define every part as Product/json with Storefront NONE before writing. Never truncate source records to fit a field. Reconcile successful API results before preparing another batch, retain existing handles, and verify images/prices before publication. Generated data and credentials remain ignored under `.cache/` and existing local CLI configuration.

## Public crawler discovery

`/llms.txt` is an optional plain-text guide to public shopping, support and sitemap URLs. It is not a Google requirement, an inventory feed, or a guarantee of AI inclusion. Its loader uses the same production-origin gate as SEO resources and returns UTF-8 with noindex on previews. Do not publish repository AGENTS.md, source snapshots, procurement data or credentials in this resource.

Collection JSON-LD describes the products rendered on the current page, with localized links and a self-canonical pagination URL. Product breadcrumbs match the visible navigation. Validate these with `node --test tests/seo.test.mjs tests/site-guide.test.mjs`, then build and inspect the actual HTML, sitemap and crawler responses before deployment.
