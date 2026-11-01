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

## Checks

```sh
node --test tests/*.test.mjs
npm run build
node scripts/audit-source-exposure.mjs --built
```

The source-exposure audit is a release gate for application sources and compiled assets. Never import operational scripts or private sourcing records into browser bundles. The full scaffold lint configuration can also be run with `npm run lint`.

## Deploy to Shopify Oxygen

Configure the matching store/environment using Shopify CLI and merchant-owned credentials. The production environment is mapped to the `main` branch. Pushing this repository alone does not configure automatic Oxygen deployment.

```sh
npx shopify hydrogen deploy --env-branch main --env-file .env.production
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

## Shopify configuration

- Prices and currency conversions come from Shopify Markets. Base currency is USD; country selection updates cart buyer identity before refreshing prices.
- Search uses Storefront predictive search and product filters configured in Search & Discovery.
- Public product specifications use `custom.technical_specifications` JSON. Private sourcing/procurement records must remain inaccessible to the Storefront API.
- Wholesale tiers currently request quotes; no automatic tier discount is promised. OEM/ODM inquiries prepare an email draft for `steven@seineshop.com`.
- Checkout is Shopify-hosted. Payment availability and shipping/taxes are determined at checkout.
- GA4 is configured globally with measurement ID `G-BKLZMJ9EP7`.

See [RELEASE-NOTES.md](RELEASE-NOTES.md) for the complete iteration summary and validation record.
