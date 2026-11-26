# iPhone 18 Pro collection preview · 2026-11-25

- Added dedicated storefront views for the parent collection, Cases, and Screen Protectors. The two child routes read the same Shopify collection, with category membership derived from product type and the public category attribute; no products are duplicated. Topic chips apply a filter on the child route. Video is omitted.
- The catalog uses Shopify storefront pricing, media, and public attributes. No source site price tiers, links, claims, or sales labels are published. The five sort controls use collection order, price, created date and Shopify best-selling order. The collection IDs and channel memberships were not changed.
- The sitemap includes each nonempty child view when the parent is published. Filtered, sorted, searched, and topic URLs are not submitted; ordinary numbered pages keep their own canonical URL. Local indexing remains disabled by configuration.
- Open items: visually compare desktop and mobile against the reference, review attribute and topic membership coverage against the source, and confirm cold-request performance before release. An incremental read-only snapshot reached page 16 of 28; page 17 returned HTTP 429, so no final count was calculated or submitted to Shopify.

- Follow-up: Scoped the fixed drawer styles to the drawer overlay. In the browser at 1440px, the filter panel was 222px on the left and the results area 980px wide with five columns; at 390px, results used two columns and the Filters button toggled the sidebar inline. The Apple menu displayed all eight headings and the three local series; the non-preview registry exposes only Duo and 18 Pro Max. No new route was introduced for the header.

## 2026-11-26：第 1754 组补充图库草稿验收

- Shopify 已新增 `PRODUCTVARIANT custom.supplemental_gallery`（`list.file_reference`，Storefront `PUBLIC_READ`），仅供展示 Shopify 托管商品图片。来源链接与逐 SKU 原始快照继续存于原私有字段。
- 第 1754 组草稿读回通过：26 个 SKU 的 USD 普通售价、逐 SKU 跟踪库存 100、规格、首图、250 张 READY 原生图、36 张 READY 补充图引用，以及 19 个来源私有字段。
- 前台在选中变体切换时读取对应补充图，并合入其原生图库。以草稿真实 API 读回数据逐 SKU 校验了 286 张图的归属和顺序；图库回归测试、codegen、构建及构建来源审计通过。草稿目前在公开 Storefront 不可见，因此未把数据级校验写成线上交互验收。
- 原 Excel 已更新。待正式前台具备补充图库读取能力并单独确认发布后，再发布商品与核对三个渠道、集合、桌面/手机和 sitemap；目前不计上架完成。旧 12 组及 227、230 缺图状态与上轮一致。

## 2026-11-26：按参考集合页重排筛选和工具栏

- 在已连接 Chrome 核对参考页的标题、260px 搜索框、每页数量下拉、相邻视图按钮及左侧分组控件。iPhone 18 Pro 模板采用同样的排布和交互，使用本站品牌色；筛选项增加行距、真实计数和清晰选中状态。父集合的两类可同时勾选，顶端分类仍链接至子集合。
- 浏览器本机验收：1680px 搜索与标题同排、商品五列，切换每页 40、勾选 Cases、切换列表均生效；390px 筛选可展开且商品两列，无横向溢出。未改商品、渠道或 URL；带筛选参数页面仍沿用 noindex 规则。

- Visual comparison follow-up: widened the desktop collection rail, used pill category links and an underlined sort bar, and reused the shared product cards with a plain white grid. Show the four reference tag groups in the same order with Seine Shop naming; tags without supporting shop data remain inactive. Actual Shopify counts, ordering and ordinary price remain unchanged. No source wholesale prices or Video were added.
- Color normalization: one imported group had six Chinese Shopify option labels. Translate known display labels in the English storefront and merge equivalent filter buckets; preserve the underlying option values and legacy filter links. Browser: 1680px five columns, 390px two columns, Color expanded showed no Chinese values, Blue click applied the expected filter. Collection, product gallery and sitemap tests (24), lint, build, and source exposure audit passed. The first card image URL also returned image/jpeg.
