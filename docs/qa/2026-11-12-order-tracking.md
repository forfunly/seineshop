# Order tracking — 2026-11-12

Status: local implementation only, not deployed or pushed.

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

No valid live shipment number was supplied, so a real shipment event timeline has not been verified. Actual status, carrier coverage, challenges and outages depend on 17TRACK. The free widget retains provider branding and can display advertisements. Production publication remains subject to explicit user approval under root AGENTS.md; no credentials, store data or live deployment changed.
