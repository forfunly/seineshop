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

The unused starter `ProductImage` and `MockShopNotice` components and the notice's exclusive CSS were removed on 2026-11-17. Application routing uses `react-router` directly; `react-router-dom`, `eslint-plugin-jest`, and the direct `graphql-tag` declaration are no longer needed. GraphQL tooling still installs `graphql-tag` transitively. Dormant consent code and development catalog previews remain available.

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
- `apps/dropshipping/seine-shop-dropshipping-dev/`: independent, test-only Shopify application and server-side draft importer; not part of the storefront bundle.
- `app/styles/`: shared layout, green visual theme, mobile, cart, search and editorial styles.
- `app/locales/`: English-keyed Japanese/German translations; localized URLs use `/jp/` and `/de/`.
- `app/data/`: editorial/navigation content and sanitized development-preview catalog data.
- `public/images/`: product fallback artwork and payment icons.
- `tests/`: checkout, markets, locale, SEO, sitemap and wholesale behavior checks.
- `scripts/`: release audits and collection filter verification.

The product photo and business inquiry dialogs share `app/lib/use-modal-dialog.js`. It opens native modal dialogs, focuses the close button only when opened, wraps Tab/Shift+Tab within the dialog, and restores focus to the trigger on close. Business inquiries use native backdrop dismissal where supported, with a fallback for older browsers.

## Shopify configuration

- Customer accounts use Shopify's email-code login and Customer Account API. `/account/profile` shows the authenticated email and current marketing state, saves names with a verified readback, and offers explicit subscribe/unsubscribe actions. Login and profile updates do not opt a customer into marketing. Pending confirmation is shown separately; uncertain writes require a refresh before retrying. Profile and address submissions enforce the storefront origin, and account responses are private/no-store/noindex.
- Signed-in saved-cart checkout refreshes Shopify buyer identity from the server session and uses the resulting checkout URL; failed attachment prevents a silent guest checkout. Buy now uses Hydrogen's built-in session identity. Orders remain native Shopify checkout records, while B2B inquiries create separate draft orders. Real customer/profile/marketing and paid-order acceptance evidence is tracked in [customer account QA](docs/qa/2026-11-17-customer-account.md); code checks do not establish a completed payment.

- Prices and currency conversions come from Shopify Markets. Base currency is USD; country selection updates cart buyer identity before refreshing prices.
- Search uses Storefront predictive search and product filters configured in Search & Discovery. Selecting a category in the header limits text search to members of that Shopify collection.
- Header merchandise sections use the fixed collection handles in [`app/data/catalog-sections.js`](app/data/catalog-sections.js). If a section has no products, the URL still opens with an empty state and is excluded from the sitemap. To populate a section, publish a collection with the matching handle to the storefront sales channel and add eligible products. Ranking, certification and brand selections are curated in Shopify, not inferred from product titles.
- Public product specifications use `custom.technical_specifications` JSON. Private sourcing/procurement records must remain inaccessible to the Storefront API.
- Wholesale tiers currently request quotes; no automatic tier discount is promised. Wholesale/OEM/ODM requests use the Sectionly online inquiry form with an email fallback for `steven@seineshop.com`.
- The product option area includes **Bulk Buy** for selecting several variants in one cart action. `app/lib/product-variants.server.js` reads public, localized variant data in pages of 50 without Sectionly credentials; `app/lib/bulk-buy.js` validates at most 250 distinct lines and strips client pricing before Shopify. Stock warnings or an uncertain response direct the buyer to review the cart before retrying. Run `node --test tests/bulk-buy.test.mjs tests/checkout.test.mjs` for purchase validation checks.
- **Estimate shipping** below the wholesale purchase buttons estimates the current SKU/quantity using Shopify's configured fixed delivery rates. `app/lib/shipping-quote.server.js` creates a separate estimate cart, validates the returned quantity, and returns only delivery names/descriptions/costs. It never changes the shopper's saved cart or creates an order. `/api/shipping-quote` and localized equivalents use private/no-store/noindex responses and CSRF protection; addresses stay in POST bodies and component memory. The form lists supported Shopify markets and region selectors from `app/lib/shipping-regions.js`. No new credentials are required. Run `node --test tests/shipping-quote.test.mjs` for privacy, validation, stock and error handling. Estimates cover this item only; carrier-calculated rates and delivery-date guarantees are outside the current integration.
- Checkout is Shopify-hosted. Payment availability and shipping/taxes are determined at checkout.
- GA4 retains the existing shared-head initialization and measurement ID `G-BKLZMJ9EP7` for the current release candidate, as requested by the merchant.

## GA4 ecommerce — local candidate (2026-11-17)

The six-event plan is approved. Existing shared-head GA4 initialization remains on `G-BKLZMJ9EP7`; GA4 generates `session_start` automatically. `CommerceAnalytics`/`ProductCommerceView` send `view_item` and successful `add_to_cart` events under Shopify's current analytics permission. Server snapshots provide actual added quantities and Shopify prices, covering regular/sticky/sample and bulk additions. Incomplete carts over 250 lines or failed analytics reads do not invent events or block purchasing. Additions over 200 items are split into GA4-sized events.

`CheckoutForm` collects anonymous GA client/session IDs with a 250ms limit. Buy now and saved-cart checkout pass only validated identifiers in Shopify cart attributes, preserving other attributes and the shopper's saved-cart cookie. Declined tracking clears old analytics attributes on a successful update. No contacts, addresses, checkout tokens or payment details enter event payloads. External-checkout back navigation resets suspended fetchers; checkout stays disabled while cart updates are pending.

`scripts/ga4-checkout-pixel.js` is the exact custom-pixel source for Shopify **Settings → Customer events**, with literal subscriptions required by Shopify's event discovery. It maps `checkout_started` → `begin_checkout`, `payment_info_submitted` → `add_payment_info`, and `checkout_completed` → `purchase`. These events are owned by checkout, not storefront clicks. The existing **Seine Shop GA4 Checkout** draft (custom pixel `174522627`) is saved and **not connected**; its required permission is Analytics only. After separately approved activation, verify using Shopify Pixel Helper and the correct GA4 stream. Do not also enable a second Google integration that sends the same events to this measurement ID.

The pixel reuses fresh anonymous session context, skips forced session reuse after 30 minutes, and deduplicates purchases by Shopify order ID (up to 100 locally remembered events/90 days plus GA4 transaction dedup). Revenue uses discounted merchandise value; shipping and tax are separate. Shopify checkout completion does not prove settlement or fulfillment. Checkout events follow GA4's 200-item limit: orders above that size retain one transaction/full value and report the first 200 line items. Do not split one purchase into fake transactions. Browser tracking remains subject to consent, blockers, interrupted navigation and the thank-you page loading; this is not webhook-backed revenue reconciliation.

Run `node --test tests/ga4-commerce.test.mjs tests/ga4-checkout-pixel.test.mjs tests/checkout.test.mjs` for regressions. `node scripts/preview-ga4-pixel.mjs` starts an internal browser harness only at `http://127.0.0.1:3010/`: synthetic Shopify callbacks execute the original pixel; a local tag receiver replaces Google transport. It creates no orders, sends no Google hits, writes no files, and retains only in-memory event receipts. Stop it after QA; do not expose it publicly. See [the approved analytics plan](docs/plans/2026-11-03-analytics-consent-fix.md#ga4-六事件补齐2026-11-17已确认方案) and [current verification](docs/qa/2026-11-03-analytics-consent.md#ga4-六事件本地候选验收2026-11-17).

No production pixel activation, source push, production deployment, real payment or production GA4 revenue acceptance is included in this local candidate.

## Analytics consent

### Clarity and server delivery candidate (2026-11-17)

The merchant's Clarity project is **Seine Shop**, public installation ID `zey8gxj9j0`. `PUBLIC_CLARITY_ENABLED=true` enables the consent-controlled loader after approved configuration. It is off by default. Public storefront routes only, advertising storage denied, strict text masking from the initial HTML, global privacy control respected, explicit stop on refusal/private navigation. Unknown or sensitive query parameters prevent collection. The script is integrated directly into Hydrogen; installing it in the Shopify theme or an empty GTM container would not cover this headless storefront. Clarity dashboard/API tokens are not required for installation.

GA4 server delivery is also off by default. These are configuration names, not populated credentials; do not modify real environment files or create platform definitions without the merchant's specific approval:

- `GA4_SERVER_ENABLED=true` and server-only `GA4_API_SECRET` enable successful `add_to_cart` delivery through Measurement Protocol. Actual Shopify quantities/prices are reused. Valid anonymous client/session identity is required; otherwise the current browser sender remains responsible. A server-owned event is never also sent by the browser, including when delivery is uncertain.
- `GA4_SERVER_PURCHASE_ENABLED=true`, `GA4_WEBHOOK_SECRET`, and a dedicated own-organization app's `GA4_ADMIN_CLIENT_ID` / `GA4_ADMIN_CLIENT_SECRET` enable purchase processing. Client-credentials access tokens are cached in memory and refreshed before expiration. A separately managed `GA4_ADMIN_ACCESS_TOKEN` is supported when its renewal is managed externally. Keep these credentials on the server; do not reuse the test-store dropshipping app. Required access is `read_orders`, `write_orders` (order ledger) and `read_products` (variant references), subject to actual platform approval.
- Prepare the ORDER JSON definition `seine_analytics.ga4_purchase`, storefront access `NONE`, before enabling. Runtime refuses to create an implicit definition. Ledger records contain only anonymous analytics context, consent receipt, delivery status and time. CAS claims prevent concurrent sends. States `sending` / `uncertain` require reconciliation; no blind retries after an unknown Google response. GA4 `transaction_id` is the stable Shopify order ID. HTTP 2xx is acceptance, not verified ingestion.
- Register the `orders/paid` HTTPS notification at `https://www.seineshop.com/api/ga4-orders-paid` with the exact signing secret for that subscription. Raw-body HMAC, shop and topic must all match. The notification supplies only the order identifier; current prices/paid status are read through authenticated Admin 2026-04 queries validated with Shopify AI Toolkit. The storefront codegen targets the separate Storefront API schema; Admin operations remain plain strings validated against their own schema.
- Update the existing unconnected checkout pixel using `scripts/ga4-checkout-pixel.js`. Checkout attributes contain a time-limited server-signed anonymous proof when server purchase configuration is ready. At checkout completion the allowed pixel submits only order ID, proof and consent to `/api/ga4-checkout`. Server checks the proof against that actual order, then sends only once it is paid. Either the consent receipt or paid notification can arrive first. No final allowed receipt means no purchase send, even if a webhook arrives. Browsers that block the receipt can therefore still cause undercounting; this is not a consent bypass or a guarantee against blockers.

Amounts use presentment currency, allocated discounts and separate tax/shipping, including tax-inclusive orders. Test/cancelled/unpaid orders, deleted variants, incomplete line pages and unreconciled totals do not generate invented revenue. GA4 retains a transaction's full value and the first 200 item rows. Analytics failures never retry purchasing or block checkout. A failed cart-attribute update can lose attribution; an old proof can expire and suppress a purchase rather than inventing a new identity. Neither private API endpoint belongs in sitemap. No production activation or real GA4 ingestion is claimed by this candidate.

Run `node --test tests/ga4-server.test.mjs tests/clarity-consent.test.mjs tests/ga4-checkout-pixel.test.mjs tests/ga4-commerce.test.mjs` plus the normal release checks. See [the updated plan](docs/plans/2026-11-03-analytics-consent-fix.md) and [analytics QA](docs/qa/2026-11-03-analytics-consent.md) for configuration and integration gaps.

The consent-gated implementation is retained in source but is currently disconnected from the application: `ConsentAnalytics`, `CookiePreferences`, `app/lib/google-analytics-consent.js`, and their controlled tests are dormant. The root and footer do not import or render these components, and the new privacy banner is not enabled. The active release candidate preserves the previous GA4 behavior; it does not claim that GA4 now stops after refusal.

`node --test tests/analytics-consent.test.mjs` verifies only the dormant helper. Earlier browser evidence describes that earlier candidate, not the active release candidate. See [earlier consent QA](docs/qa/2026-11-03-analytics-consent.md) and [release history](docs/project-state.md) for the merchant's later decision and deployment boundaries. No environment variables or dependencies are added by this scope change.

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

Error responses and missing root SEO settings render a title and `noindex` without canonical, language alternates, sharing URLs or content schema. `node --test tests/site-seo-render.test.mjs` renders the actual head through React Router to cover root/child loader errors and healthy localized pages; its ignored bundle is retained in `.cache/`.

### 完整 SKU 参数与详情图库

发布前运行 `node scripts/audit-source-exposure.mjs --built`，检查前台源码、公开资源及构建产物中的来源品牌；检查忽略大小写，并覆盖空格、连字符、点、下划线和全角变体。公开品牌替换统一使用 Seineshop，真实货源链接仅保存在后台私有记录中。

`ProductGallery` 保留全部 Shopify 图片、按 SKU 文件名切换橱窗图，并单独展示详情说明图。商品路由连续读取图片分页；规格优先读取 `PRODUCTVARIANT custom.technical_specifications`（JSON、PUBLIC_READ），回退到商品字段。`PRODUCT custom.source_scene_images`（JSON、Storefront NONE）只保存原始来源与图片核查记录，不进入前台。来源商家的经销授权书仅保存在内部记录中。

- `captureDetailImages(tab, item)` 位于 `scripts/tvcmall-browser-capture.mjs`，由已授权的浏览器工具调用，等待真实图片 `src` 替换占位图后读取；不使用仍可能指向占位图的 `currentSrc`。
- `python3 scripts/prepare-variant-specifications.py --inventory <inventory.jsonl> --captures <products-directory> --output <metafields.jsonl>`：从逐 SKU 采集证据准备公开参数，不发起写入。
- `python3 scripts/prepare-detail-images.py --catalog <admin-catalog.jsonl> --groups <groups.json> --scenes <scene-images.jsonl> --output <existing-output-directory>`：准备新增媒体及私有来源元字段的 JSONL，校验来源、去重及媒体数量上限，不发起写入。输出目录沿用被忽略的 `.cache/catalog/`。

集合分类浏览从真实集合连续读取商品后筛选并分页，避免未配置商品类型筛选或搜索索引延迟造成漏项；关键词搜索使用限定集合标签的 Shopify 搜索。分页与图片分组选用 `node --test tests/product-gallery.test.mjs` 验证。

### Shipment tracking

`/page/order-tracking` (also `/jp/page/order-tracking` and `/de/page/order-tracking`) embeds the official 17TRACK single-number widget after customer submission. `app/lib/tracking.js` validates a single identifier, shares a lazy script load with a 15-second timeout/retry, and generates the external fallback URL. No API key is needed. Tracking numbers remain in component memory and the provider iframe, not storefront URL parameters or custom analytics events. The provider owns tracking data, availability, branding and any widget advertising; this is not a custom tracking API integration. The CSP permits only the official script and iframe origins in addition to existing Shopify origins, including when arriving by client navigation.

Official integration: https://www.17track.net/en/widget. Hydrogen CSP guidance: https://shopify.dev/docs/storefronts/headless/legacy/hydrogen/content-security-policy.

## Test-store dropshipping draft import

The CLI-scaffolded application in [apps/dropshipping/seine-shop-dropshipping-dev](apps/dropshipping/seine-shop-dropshipping-dev/README.md) reads explicitly selected public Storefront product fields and imports one DRAFT into the fixed development shop. Product/variant identifiers and mappings are app-owned, with Storefront access disabled. Repeated imports reuse verified IDs instead of overwriting merchant edits. No channel publication, inventory quantities or orders are written.

The root ignored environment requires the separately authorized `DROPSHIP_APP_CLIENT_ID`, `DROPSHIP_APP_CLIENT_SECRET`, `DROPSHIP_TOKEN_ENCRYPTION_KEY`, plus the existing `PUBLIC_STORE_DOMAIN` and server-only `PRIVATE_STOREFRONT_API_TOKEN`. The official server SDK requires the private Storefront token. The development client-credentials grant caches its temporary token in memory; the website workspace encrypts stored connection sessions with purpose-separated AES-GCM keys.

From the repository root, after installing the independent application's locked local dependencies and enabling its development preview/definitions:

```sh
node --env-file=.env apps/dropshipping/seine-shop-dropshipping-dev/src/run-import.mjs b-20a-3-in-1-foldable-wireless-charging-station
# Write one development-store draft only when explicitly authorized:
node --env-file=.env apps/dropshipping/seine-shop-dropshipping-dev/src/run-import.mjs b-20a-3-in-1-foldable-wireless-charging-station --apply
# Read back prices, options, images, zero stock, draft status and private mappings:
node --env-file=.env apps/dropshipping/seine-shop-dropshipping-dev/src/run-import.mjs b-20a-3-in-1-foldable-wireless-charging-station --verify
node --test tests/dropship-import.test.mjs
```

Default output is a read-only plan. Write/verify output contains only IDs, counts, status and stable error codes. `--verify` exits unsuccessfully for changed or incomplete data and never repairs it automatically. Website workspaces, independent-shop OAuth and order/fulfillment synchronization remain unfinished.

## Dropshipping workspace and development service

`/dropshipping` (also `/jp/dropshipping` and `/de/dropshipping`) is private/no-store/noindex and excluded from sitemaps. Enter from a product's Dropshipping mode or the customer account menu. The current product link is carried into the import form. A Seine Shop customer login is required: the server obtains the customer ID from the Customer Account API and ignores browser-supplied tenant IDs or credentials. Login returns are restricted to the workspace and retain the chosen language.

After separately authorizing the configuration, set `DROPSHIP_SERVICE_URL=http://127.0.0.1:3460` locally and start the independent Node service from the repository root:

```sh
node --env-file=.env apps/dropshipping/seine-shop-dropshipping-dev/src/service-server.mjs
node --test tests/dropship*.test.mjs
```

The service binds only to 127.0.0.1, checks its Host header, and accepts signed internal requests with tenant/body/method/path/time/nonce binding. Two app-owned SHOP JSON definitions (`connection_vault`, `order_ledger`) must be present with Storefront NONE. They hold encrypted connections and recoverable task states, updated with Shopify compareDigest CAS. This bounded test registry allows 20 connections and 50 tasks/100 KB per field; capacity or conflicting state stops writes. Nothing is automatically deleted. Explicit retries recheck the unique source ID and reuse existing drafts.

The development connection is limited to the designated test shop. Official OAuth begin/callback and expiring-offline-token refresh code are present, but external customer authorization requires separately approved app distribution, registered HTTPS callbacks, hosting and configuration. It is disabled while these are absent. Local Customer Account authentication requires the official Hydrogen development flow; a temporary public test link requires explicit approval under the project rules. Shopify admin/CLI login does not authenticate a storefront customer.

After explicit approval for a temporary preview, `npm run dev -- --customer-account-push --port 3007` starts the official HTTPS development flow and registers temporary Customer Account callbacks. Stop it when verification ends and verify callback cleanup. `app/lib/development-request.server.js` restores HTTPS metadata only for official preview hosts in development, before session and same-origin validation. Only Vite development builds allow that `https://*.tryhydrogen.dev` preview to use the loopback HTTP bridge; production keeps rejecting both development exceptions. The workspace displays its development-only, unpublished-draft restriction before sign-in as well.

`order-plan.mjs` validates server-read paid order snapshots, stable variant mappings, outstanding quantities and separate supplier payment before warehouse eligibility. Its query and functions are prepared and tested, but not wired to the live service. No order/fulfillment scopes or operations are enabled. Order synchronization, actual procurement, fulfillment/tracking writeback, private inquiry attachments and automatic tier pricing remain unfinished. This code has not been released to production.

## Product reviews and business inquiries

Product pages use Customerssay for published reviews and Sectionly B2B for online quotation requests. The compact rating link sits below the title; the complete review section follows the detail images, with an explicit write-review button and a keyboard-accessible star picker. The primary quote button sits beside the unit price, above quantity tiers. Quote buttons share a dialog that carries the selected variant and quantity, supports additional variants, and reads the app's current MOQ and custom fields. Service type and detailed requirements precede two-column desktop contact fields (single-column on mobile). Name, email, phone/WhatsApp, company and requirements are required. Phone/WhatsApp is checked on both the client and server and stored in the inquiry custom fields; sample link and destination remain optional and are retained in the inquiry note. The app's published Headless API and form script do not document or implement attachment upload; the form provides email instructions for attachments, rather than an upload control that cannot save files.

The server-only implementation is `app/lib/business-tools.server.js`, exposed through `/api/product-reviews` and `/api/business-inquiry` (including localized routes). Configure `CUSTOMERSSAY_SECRET_KEY` and `SECTIONLY_B2B_PRIVATE_KEY` only in an authorized, ignored local environment or separately approved hosting secrets. Never put either key in a public variable. Missing or expired configuration disables online submission and offers the existing email contact. Choose the explicitly authorized expiry for sustained development and provision production credentials separately. Current authorization and expiry are recorded in the internal project state.

Reviews are rendered on the server, with real aggregate ratings merged into the existing Product schema. Empty reviews, unavailable service and missing configuration remain distinct. Photo uploads allow up to six JPG/PNG/WebP/GIF files of 2 MB each; videos and trusted customer identity verification are outside this integration. Public review payloads exclude customer IDs, email addresses and reactions. Signed, expiring image references use a same-origin proxy restricted to app/public-storage hosts; new media hosts must be verified before adding them to the allowlist.

Inquiries validate product/variant ownership and configured fields on the server. An ambiguous retry retains its original payload and idempotency key while the form stays open; reloading or leaving the page does not preserve the draft. Inquiry acceptance is not order confirmation. This implementation preserves retail purchasing; it does not activate B2B price hiding, account pricing or checkout restrictions. Minimal internal QA submissions and unpaid draft readbacks follow the repository's autonomous-testing rules: document their scope, keep test reviews unpublished and avoid real-customer notifications, payment or fulfillment. Credential, permission, production and other restricted changes still require approval.

Run `node --test tests/business-tools.test.mjs` for API contract, validation, CSRF, media ownership and retry checks. Local preview and remaining live checks are documented in [the integration QA](docs/qa/2026-11-13-reviews-b2b-integration.md).

### Product purchase modes — local work in progress

The product summary has Wholesale, Dropshipping and Customization selectors. Wholesale keeps the existing purchase flow; customization shows its steps, the shared inquiry and a one-item sample cart action. Dropshipping currently provides only an inquiry draft and does **not** implement store connection, listing or order synchronization. This is an incomplete local draft, not the requested full system. See the [full flow scope and approval gate](docs/plans/2026-11-13-reviews-b2b-integration.md#三模式完整流程方案). No new credentials, schema, dependencies or production settings were created for this draft.
