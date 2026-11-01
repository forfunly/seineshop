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
