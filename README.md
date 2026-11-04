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

## Internal project progress

Run `node scripts/serve-project-progress.mjs`, then open http://127.0.0.1:4174/ to view the interactive roadmap. Stop the server with Ctrl+C. It uses Node.js built-ins, binds to loopback only, and requires no credentials or additional dependencies. HTML and the explicitly allowed Markdown evidence are served with UTF-8; other project files are not exposed.

The page source, styles, tasks and activity entries are in `docs/project-progress.html`. Keep its task facts and dates aligned with `docs/project-progress.md` and the linked QA records when project status changes. This is a manually maintained internal snapshot; viewing or filtering it does not modify Shopify, push Git commits or deploy the storefront. It is outside `app/` and `public/` and is not part of the customer site or sitemap. See [web validation](docs/qa/2026-11-03-project-progress-web.md).

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
