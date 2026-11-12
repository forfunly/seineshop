# Order tracking — 2026-11-12

Status: deployed to Production on 2026-11-12 after explicit user approval; Git not pushed.

## Implementation

- Official documentation: https://www.17track.net/en/widget
- Hydrogen CSP reference: https://shopify.dev/docs/storefronts/headless/legacy/hydrogen/content-security-policy
- English `/order-tracking`, Japanese `/jp/order-tracking`, German `/de/order-tracking`; support/footer links, localized SEO and sitemap.
- Official `YQV5.trackSingle`, automatic carrier selection, language selection and inline results. Provider source is loaded on submission; no API key or fabricated tracking events.
- Single identifier validation (letters, digits, hyphen, up to 50 characters), accessible error/status messages, loader concurrency, timeout and retry; provider fallback link.
- Added exact script/frame origins to CSP. Frame allowlist preserves existing Shopify origins and works after client-side navigation.
- Tracking values remain in browser component/provider state, not storefront query strings, backend persistence or custom analytics events. Provider controls result content, branding and advertising.

## Verification

- 48 Node tests pass, including input rejection, encoded provider links and script failure/retry/concurrency.
- Lint: zero errors, two pre-existing script console warnings.
- Codegen and production build pass; source exposure audit passes. Toolkit validator invoked but does not type-validate Hydrogen/HTML components; build and browser checks provide actual verification.
- Browser: initial page, empty submission, official sample `RR123456789CN`, provider reports China Post / Not Found. Result iframe renders after client-side navigation from Support.
- 390px mobile viewport: no document horizontal overflow; input remains within card; result iframe and fallback readable. Desktop and Japanese headings/messages verified.
- Fixed existing missing iPhone Duo navigation translation entries surfaced by the full suite.
- Screenshot: local ignored `.cache/tooling/order-tracking-desktop.png`.

## Limits

No valid live shipment number was supplied, so a real shipment event timeline has not been verified. Actual status, carrier coverage, challenges and outages depend on 17TRACK. The free widget retains provider branding and can display advertisements. No credentials or store product data changed. Production publication was explicitly approved in the subsequent user turn.


## Production verification

- Published commit `17a5b3d`, deployment `01m775bhyss7hz1ftchcb4q7m3-d7e83d6aec4307f1a21e`.
- URL: https://www.seineshop.com/order-tracking
- Re-ran all 48 tests, lint, codegen/build, collection filter check and built source exposure audit before deployment; all passed (two existing lint warnings).
- English, Japanese and German pages: HTTP 200, UTF-8, self canonical, index. Their pages sitemaps each contain the tracking URL. Robots and llms text responses retain UTF-8.
- Official sample returns China Post / Not Found inside the production iframe. No real shipment status claimed.
- Browser checks: 390px document width equals scroll width; Japanese text renders correctly; footer navigation opens tracking page. Existing cart contents and checkout link render; no checkout submitted.
- Screenshot: `.cache/tooling/order-tracking-production.png`; HTTP checks: `.cache/tooling/order-tracking-live-checks.json` (both ignored local evidence).
