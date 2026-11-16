# Local candidate — 2026-11-13

- 2026-11-16 local follow-up: real customer login, test-store connection, reuse of the existing B20A draft, mapped-product listing and persisted history were verified through an approved official HTTPS preview. TLS metadata is restored before session/same-origin checks only for the official development proxy, and the signed loopback bridge remains development-only. The test-store restriction is visible before sign-in. External customer-shop OAuth and actual order/fulfillment operations remain unavailable; no production deployment.

- 2026-11-16 local workspace addition: product Dropshipping mode and the customer account menu link to a localized private workspace. Customer identity, restricted login returns, signed loopback requests, encrypted test-store connections, CAS task storage, draft import history and recovery are implemented. Two private SHOP definitions and the local service address are configured; a signed read-only check returned successfully. Actual customer-login/import end-to-end verification remains pending. Order eligibility is tested in code; actual procurement/fulfillment, external shop OAuth, tier pricing and private attachments remain unavailable. No push or production deployment.

- 2026-11-16 test-store addition: independent Shopify development app and recoverable draft importer. One real B20A draft with two variants/two READY images was imported and verified in the free test shop; repeats reuse the same ID. Private mappings use app-owned fields/metaobjects; no source-product changes, channel publication, stock quantities or orders. This server tool does not yet provide website customer-shop connections or order/fulfillment synchronization.
- 2026-11-16 local addition: **Estimate shipping** below wholesale purchasing, address/region selection and Shopify fixed-rate estimates for the chosen SKU/quantity. The entry was renamed from More Shipping Options to describe its actual action, with Japanese/German translations. Estimates use separate carts, preserve the shopper's cart, clear on input changes and expose no cart/address identifiers. Real USD 12/18 rates and the configured free-shipping threshold were read back; no order or notification was created.
- 2026-11-16 local addition: Bulk Buy beside product options, localized paginated variants, independent quantities/subtotals and one multi-line Shopify cart action. Server validation rejects duplicate/invalid lines and strips client prices; uncertain writes are not automatically retried. The full three-mode plan is approved; automatic tier prices, private inquiry attachments and the merchant dropshipping service remain in development.
- Work in progress: three product purchase modes, customization steps and a one-item standard sample cart action. Bulk buying and fixed-rate shipping estimates are implemented locally. Actual tier pricing, file attachments and a separate dropshipping management system remain incomplete. Current dropshipping inquiry is an interim local draft, not a completed integration. See the [full flow plan](docs/plans/2026-11-13-reviews-b2b-integration.md#三模式完整流程方案).

- Quote entry moved beside the unit price with a visible outlined button; quantity tiers follow the price. Inquiry layout now uses a product summary, service selector, required requirements, paired contact fields with required email and phone/WhatsApp, optional sample link/destination, and persistent cancel/submit actions. Attachments use email because the app's public Headless contract provides no upload endpoint.
- Reviews retain the details navigation/image-section placement, with a compact count heading, clear write button and native radio star selection. See [updated layout QA](docs/qa/2026-11-13-business-layout.md).
- Customerssay product rating link below the title, published reviews after detail images, rating filters/pagination, and a review form with optional photos. Real zero-review and unavailable states are distinct; Product schema includes only actual published ratings.
- Sectionly B2B online quote dialog shared by the first-screen, Wholesale, OEM and ODM buttons. Carries current SKU and quantity, supports additional variants, reads current MOQ/fields, checks ownership, and preserves an immutable request on retry.
- English, Japanese and German UI, mobile layout and modal keyboard navigation. Server credentials, CSRF and private submission data stay out of public product HTML.
- Local read-only app integration verified. Real review/photo submissions, inquiries/draft orders/notifications, production credentials, push and deployment remain unverified or unauthorized. See [QA](docs/qa/2026-11-13-reviews-b2b-integration.md).

# SeineShop update — 2026-11-01

This release replaces the starter storefront with the current SeineShop headless shopping experience. All existing application source and assets are included; credentials, dependencies, compiled output, deployment logs and private procurement archives are excluded.

## Storefront and navigation

- Fresh green visual system, responsive header and footer, category mega menu with consistent icons.
- Uppercase initial in the header wordmark and original shopping-bag favicon with an uppercase S.
- Shared header/footer country, language and currency selector, flags, responsive modal and unique accessible field IDs.
- English, Japanese and German storefront routes. Market currency uses Shopify data; no manual frontend exchange rates.

## Products and catalog

- Image gallery, variant selection, quantity controls, current-price totals, Shopify buy-now flow, payment marks and sticky purchase bar.
- Shared wholesale quantity tiers, quote requests, OEM/ODM requirements and Steven contact entry points.
- Product descriptions split into readable paragraphs; imported definition-list attributes merged into grouped specification tables, retaining fallback rich content.
- Best-seller collection and configurable filtering/sorting, grid/list modes and pagination connected to Shopify catalog data.

## Search and shopping cart

- Global predictive search with debounce, images/prices, query suggestions, keyboard interaction and localized URLs.
- Search result filtering and sorting through native Storefront capabilities and Search & Discovery configuration.
- Redesigned 520px desktop cart drawer and full-width mobile layout, product cards, compact quantity controls, remove links and clear subtotal/checkout actions.
- Discount and gift-card inputs in collapsible panels; invalid discount feedback and a useful empty-cart state. No invented free-shipping thresholds or promotions.

## Editorial and SEO

- Reusable editorial template with article navigation, comparison sections, product cards, structured article metadata and related links.
- Shared title/description output, commerce-focused homepage and category metadata, readable product snippets and localized homepage text.
- Canonical/hreflang links, social metadata, JSON-LD and noindex rules for utility/filter views.
- Standard XML sitemap index/shards without XSLT dependency, plus a separate human-readable sitemap management view.
- Explicit index homepage route prevents injected framework default metadata; localized homepage aliases remain available.
- Global GA4 measurement ID updated to G-BKLZMJ9EP7.

## Validation and boundaries

- Production builds, source-exposure audits, checkout/market/SEO/sitemap tests and targeted lint checks are part of release verification.
- Browser checks covered desktop/mobile product tables and cart, quantity/amount changes, empty cart, invalid discount feedback, and checkout link generation. No payment was submitted.
- Live verification checked homepage, Japanese homepage, collection, product, cart and search metadata, including utility noindex behavior.
- Packaging verification found a missing Best Sellers menu translation; Japanese/German entries were added without changing pricing or checkout behavior.
- Some Shopify Toolkit isolated validations report pre-existing JavaScript/JSDoc and DOM iterable typing limitations. These are distinct from the passing application build and targeted lint checks.
- This repository contains code, not a backup of Shopify products/orders/settings. Shopify configuration and actual inventory/fulfillment remain external.

## Published — order tracking (2026-11-12)

- Added localized `/order-tracking` with official 17TRACK results, validation, delayed loading, retry and external fallback.
- Added support/footer entry points, page metadata and sitemap discovery.
- Verified 48 tests, lint, code generation, production build and source exposure audit. Local browser checks cover desktop/mobile, Japanese and provider Not Found response using its public sample number. Published to Production as `17a5b3d` after explicit approval; live tracking, localized metadata, sitemap and cart display verified. No Git push.

- Tracking URL updated to `/page/order-tracking` with localized 301 redirects from prior routes; links, canonical metadata and sitemap synchronized and verified in production (2026-11-12).
