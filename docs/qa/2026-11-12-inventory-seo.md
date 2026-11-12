# iPhone Duo 库存与 SEO 验收

## 本次授权和实际写入

用户要求本批每个 SKU 库存设为 100，并符合 Google SEO 与 AI 爬虫读取要求。范围为 iPhone Duo 集合，非全店其他商品。

- 908 商品 / 3,643 SKU 均启用库存跟踪；唯一线上履约地点的 available 均为 100，总计 364,300。
- 使用已授权的 `write_products` 与官方 ProductSet 库存字段，完整保留商品全部现有选项/变体 ID；没有扩展凭据权限、删除变体或改变其他商品。
- 先验证 21 SKU，再处理 907 商品；全部 mutation 无 userErrors。全量独立读回数量及变体 ID 一致，库存差异为 0；最终独立读回确认 3,643 个 SKU 售价及变体 ID 未变。
- 集合 SEO 标题已写入 `iPhone Duo Cases & Screen Protectors`，描述说明真实品类、材质/颜色/规格和普通价/批量询价关系。保留原 handle。
- 该库存数来自用户设定，不能视为供应商库存验证；原采购记录仍保持 supplier inventory 未验证。

## 本地代码候选

- `app/components/SiteSeo.jsx`、`app/lib/seo.js`：集合使用 CollectionPage + 当前页 ItemList；商品补 BreadcrumbList，内容与可见页面一致。
- `app/entry.server.jsx`：HTML 明确声明 UTF-8。
- `app/lib/site-guide.js`、`app/routes/[llms.txt].jsx`：可选公开站点说明，链接到集合、产品索引、支持、政策及 sitemap，不含来源/采购信息。
- `app/routes.js`、`app/lib/locale.js`：llms.txt 作为稳定根资源，不加语言前缀。
- `tests/seo.test.mjs`、`tests/site-guide.test.mjs`：覆盖集合分页及本地化链接、可选说明资源、预览 noindex。
- README 补充用途与检查方式；本记录和 project-state 保存真实完成状态。

没有修改 `.env`、认证、付款/结账、GA4 逻辑或店铺密码。尚未 push、尚未部署代码；线上 llms.txt 仍为 404，新增结构化信息与 HTML charset 需发布后才生效。

## 检查结果

- 42 项 Node 测试通过；lint 0 errors，2 项既有 no-console warnings。
- `npm run build`（含 codegen）通过；存在既有 envFile/React Router future 提示和可选 bundle analysis 缺失提示，应用产物生成成功。
- 集合筛选检查与 `audit-source-exposure.mjs --built` 通过。
- 本地浏览器显示集合、产品及分页；初始 HTML 有主标题、正文、40 个商品链接。第二页内容不同，canonical 保留 cursor/direction 自指。
- 本地 HTML 为 `text/html; charset=utf-8`，llms.txt 为 `text/plain; charset=utf-8`；本机环境保持 noindex。
- 生产初始 HTML 已可索引、canonical 正确、有产品内容与可抓取分页链接；Googlebot / OAI-SearchBot 请求均返回实际内容。
- 读取 31 个英文产品/集合 sitemap 分片，覆盖全部 908 商品 URL + 集合 URL，缺失 0。
- 代表集合/商品 HTML 与本地构建未发现来源域名或私有采购字段。
- 元数据更新后生产第一页仍可能短暂命中既有缓存，第二页及本地已显示新标题；Shopify API 已确认数据更新。

本轮不宣称已收录、获得排名、富媒体结果或 AI 引用。没有 Search Console 收录结果、外部 Rich Results Test 或真实用户 Core Web Vitals 数据；它们不以本地检查替代。

## 依据与证据

官方依据：[Google AI 搜索要求](https://developers.google.com/search/docs/appearance/ai-features)、[Google 电商分页](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading)、[Shopify ProductSet](https://shopify.dev/docs/api/admin-graphql/2026-10/mutations/productSet)。Google AI 搜索沿用基本 SEO 要求，llms.txt 是额外公开说明，不是必要条件或保证收录的手段。

被忽略目录 `.cache/catalog/iphone-duo-2026-11-12/` 保存库存前后读回、写入结果、`inventory-audit-summary.json`、`seo-http-audit.json`、集合元数据结果和前台截图。

Git：上轮采集成果已保存为本地提交 313ce64；已合并远程 a07e30e 的规则更新。推送候选将包含上轮采集工具/记录和本轮 SEO 改动，目标 origin/main。仓库要求每一次 push 单独批准；Production 部署也需针对本次候选确认。
