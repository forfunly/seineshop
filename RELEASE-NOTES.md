# 集合页共用商品卡与动效（2026-11-25，本地候选）

- 所有正式集合页及 `/collections/all` 共用同一商品卡、网格、设备本地收藏和 Quick View；沿用原收藏存储，保留各页筛选、排序与分页。首页、搜索和不可下单的离线预览保持不变。
- 桌面爱心和 Quick View 图标滑入并淡入，过渡 300 ms，Quick View 晚 100 ms；浮层不挤动商品网格。键盘聚焦立即显示，触屏无需悬停，系统减少动态效果时不播放滑动。外观继续使用 Seine Shop 主题。
- 本机验收覆盖 Best Sellers、iPhone Duo、iPhone 18 Pro Max 和 All Products 的英、日、德页面；浏览器验证动效、触屏、减少动态效果、键盘焦点、规格预览与隔离访客加购。未进入结账或创建订单。154 项测试、lint（2 条既有警告）、codegen、构建、筛选检查和来源暴露审计通过。

# Best Sellers 集合页排版对齐（2026-11-24，本地候选）

- 仅 `/collections/best-sellers` 及其语言版本使用紧凑双栏目录布局：左侧分类按对标顺序排列并读取 Shopify 实际筛选值和计数；右侧同排标题、结果内搜索、每页数量与视图切换，下一排为排序。支持分类即时多选及长筛选项展开。
- 商品卡新增设备本地收藏与独立 Quick View。预览按需读取商品图、SKU、备货信息、可售规格和数量规则；沿用现有购物车和托管结账流程。不添加未接通的促销、视频或批发价筛选，也不显示虚构阶梯价。
- 悬停修正：爱心与预览图标纵排；桌面卡片下方浮层覆盖下一行而不挤动网格，包含数量、购物车图标、可复制 SKU 和规格缩略图。普通单价保持黑色；不展示未接通的批发价。悬停补丁已核验本机 SSR、真实预览数据接口及工程检查；专用浏览器调试端口无响应，新浮层的浏览器加购与截图复验待补。
- 视觉对齐 Seine Shop：左栏、搜索、排序、视图切换、悬停控件和 Quick View 使用本站绿色主题、圆角、表单及焦点样式；保留双栏布局与悬停交互，不改商品、价格或购物车逻辑。
- 上一版的本机桌面与 390px 验收：分类双选、价升序和翻页、弹窗与 Escape 焦点归还、隔离访客购物车数量及规格读回。未进入完整结账或创建订单。英、日、德集合返回 200，正式 sitemap 及三个现有集合分片包含原规范地址；新增预览资源不加入 sitemap。
- 视觉调整后重跑：154 项 Node 测试、lint（0 错误 / 2 个既有警告）、codegen、生产构建、集合筛选检查和构建来源暴露审计通过；本机集合返回 200，正式 sitemap 及英、日、德集合分片仍包含原规范地址。专用 Chrome 调试端口仍无响应，桌面悬停、键盘焦点、触屏和弹窗的视觉复验待补。本轮未修改正式商品、配置或部署。

# 商品图库交互对齐（2026-11-18，本地候选）

- 桌面悬停左侧缩略图即横滑切换主图，移除独立 Zoom 按钮；桌面鼠标移入主图时显示取景框，右侧同步预览局部大图；点击主图可打开大图预览，支持翻图、缩放、左右旋转与复位。手机图库支持横划与计数。保留 Shopify SKU 图源、原封面及键盘操作；未更改商品数据或上线。

# 错误页SEO修复与正式账户补验（2026-11-18，本地修复待发布）

- 移除错误页或根SEO配置缺失时的本机canonical回退；仅保留标题和noindex，不生成分享URL、语言替代链接或内容结构化数据。正常页面SEO保持原有配置。148项测试及本机实际404页面复验通过，此项尚未推送或上线。
- 正式站现有登录态下姓名修改/恢复、退订/再订阅及Shopify后台读回通过，地址及空订单读取正常，非法订单404；日德390px账户页无横向溢出。当前正式会话购物车为空，不将此前临时预览购物车视为当前正式会话状态。测试地址未删除，付款订单仍待授权的测试方案。

# 客户账户资料与邮件偏好（2026-11-18，Oxygen Production）

- 提交 `7ecfcd5` 已发布到正式域名，后台Production为Ready/Current，Deployment ID6155709；公开页面、账户未登录保护、UTF-8及代表sitemap复验通过。正式登录后的操作证据仍以此前临时预览为准，付款订单尚未验收。

- 账户页读取真实邮箱与邮件营销状态，新增独立订阅/退订，支持待确认状态；修改姓名后从 Shopify 读回，不将登录或保存资料视为营销同意。单字姓名及清空可选姓名可保存，业务错误或结果不确定不会显示成功。
- 账户页及数据响应 private/no-store/noindex；资料与地址提交验证同源，订单详情区分错误地址/不存在与接口故障。结账前重试已登录客户的购物车身份关联，失败时保留购物车并提示重试。
- 未新增数据库、凭据或依赖，未修改支付配置；真实登录后姓名保存/恢复、地址保存、订阅/退订及后台读回通过；托管结账识别同一客户通过，未付款或进行正式订单验收。详见[客户账户 QA](docs/qa/2026-11-17-customer-account.md)。

# Oxygen Production analytics release — 2026-11-17

- Commit `0452ef4` is deployed to the existing Shopify Oxygen Production storefront at www.seineshop.com. Clarity project `zey8gxj9j0` is enabled only in Production, with consent gating, private-route exclusion and text masking. Live tag/SDK requests returned 200 and collection requests 204; refusal, refresh persistence, regrant and cart exclusion were checked. Dashboard recordings/heatmaps are still awaiting processing.
- GA4 browser product-view/cart events are included. Server delivery remains disabled pending access to the original GA4 resource; the checkout pixel remains unconnected. One isolated production cart addition verified USD19/one item and one add_to_cart event, without checkout/payment/order creation. Optional Bing cookie synchronization remains blocked by CSP; the Clarity collection endpoint succeeds.
- [Production evidence and remaining limits](docs/qa/2026-11-03-analytics-consent.md#clarity-oxygen-production-发布验收2026-11-17).

# Historical local analytics candidate — 2026-11-17

- Extended the candidate with a consent-controlled Clarity loader and a merchant-owned project (`zey8gxj9j0`). Private routes, global privacy control, initial text masking and stop/regrant handling are covered. Production remains disabled.
- Prepared GA4 Measurement Protocol cart delivery and a paid-order pipeline with signed final checkout consent, HMAC-verified notifications, authoritative presentment money and a private order CAS ledger. Browser/server event ownership is exclusive. Configuration, ledger definition/permissions, updated backend pixel, production connection and real GA4 ingestion remain separate pending work; no credentials or live order definitions were created.

- Added GA4 product-view and successful cart-addition events, using Shopify permission, actual quantities/prices, and replay deduplication. Regular/sticky/sample/bulk entry points share the same action receipt. GA4 continues to generate session starts automatically.
- Added anonymous session handoff for saved-cart checkout and Buy now, bounded tag reads, preserved business attributes/cart cookies, and recovery after returning from external checkout. Checkout is disabled during pending cart updates.
- Prepared the checkout-only custom pixel for begin checkout, payment-info submission and purchase, with literal Shopify subscriptions, discounted merchandise value, separate tax/shipping and order-ID deduplication. **Seine Shop GA4 Checkout** is saved as an unconnected draft; production activation and deployment remain pending separate approval.
- Added focused mapping/consent/error/deduplication tests and an isolated local browser receiver that sends no Google purchase hits. See [analytics verification](docs/qa/2026-11-03-analytics-consent.md#ga4-六事件本地候选验收2026-11-17). Real Shopify test payment and production GA4 purchase receipt remain unverified.

# Local cleanup — 2026-11-17

- Removed unused starter `ProductImage` and `MockShopNotice` components and the notice's exclusive CSS. Removed unused direct declarations for `graphql-tag`, `react-router-dom`, and `eslint-plugin-jest`; GraphQL tooling retains its transitive `graphql-tag` dependency. Existing package versions and platform-specific lockfile metadata are preserved.
- No public route, visible page content, indexing rule or sitemap entry changed. Dormant consent code, preview catalog data, historical screenshots and local caches are retained. Local changes only; no production deployment.
- Verified 99 tests, lint (zero errors/two existing warnings), codegen, production build, collection filters, source-exposure audit and an offline dry-run clean install. Existing tool deprecation/future-option and bundle-analyzer warnings remain. No browser or production verification was performed for this unused-code cleanup.

# Local candidate — 2026-11-13

- 2026-11-16 live QA correction: inquiry submissions include the product title read from Shopify on the server, as required by Sectionly. Browser-supplied titles and prices remain untrusted. Internal QA may run with minimal unpublished/unpaid test records under the repository rules; push and production release still require separate approval.

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
