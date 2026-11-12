# 项目连接状态与授权记录

## Order tracking 本地开发完成（2026-11-12）

新增 `/order-tracking`，以及日语、德语版本，使用 17TRACK 官方单号查询组件，按提交加载，无需 API key。已加入页脚、客服页、SEO 标题描述及 sitemap。输入校验、15 秒脚本失败重试、服务延迟提示和外部备用查询已实现。单号不放入本站地址或自定义分析事件，不存储到本站后端。

48 项测试通过；lint 0 错误、2 项既有警告，codegen/build 和构建来源暴露检查通过。浏览器验证了空输入、官方示例号返回 Not Found、客户端导航后查询、日语文案和 390px 手机布局。无真实有效物流单号，未声称已验证真实包裹时间线。官方免费组件保留 17TRACK 标识及可能的广告。此次未部署、未推送；发布须按根规范确认。详见 [验收记录](qa/2026-11-12-order-tracking.md)。

## 来源品牌检查完成（2026-11-12）

用户补充要求采集内容及页面功能代码不得包含来源品牌，替换名为 Seineshop；已同步根规范与商品规范。全量读取本批 908 商品、3,643 SKU，共 38,622 条公开字段/媒体记录，来源品牌匹配为 0；app、public、服务入口及客户端/服务端构建产物检查通过。另读取正式网站 3 个代表页面/文本资源与 70 个 JS/CSS 文件，共 73 项，全部成功且匹配为 0。

发布检查已增强为识别大小写、空格、点、下划线、连字符及全角写法。lint 0 错误、2 项既有警告。此次只更新内部规则与检查脚本，没有需要替换的公开内容，无需重新部署；未推送 GitHub。后台私有来源链接、采集证据和供应商专属授权图片记录继续保留，用于用户此前要求的货源对比。本次检查范围为文本、图片 URL/alt 与代码，不包含对全部图片像素的 OCR。核查结果保存在被忽略的 `.cache/catalog/iphone-duo-2026-11-12/public-brand-audit-summary.json` 和 `live-brand-audit.json`。

## 详情图库、集合页与 SEO 已发布（2026-11-12）

908 商品的详情图区域已补采，203 商品追加 2,099 张场景图且全部 READY；3,643 SKU 的独立公开参数全量核对一致。原图、普通售价及每 SKU 库存 100 保留，全部来源图片记录存后台私有元字段。商品分类和材质筛选数据已补齐。详情页完整图库、SKU 缩略图及参数切换、集合页分类/排序/分页、手机布局和导航入口已在本地完成，45 测试及构建等检查通过，见 [验收记录](qa/2026-11-12-product-details-collection.md)。

本轮用户明确要求“上架一个商品集合页”，授权该页面及商品详情展示发布；既有集合和商品继续使用，不创建重复集合。已将 b444fcd 部署至 Production，发布标识为 `01m770yqrmdk52peqtkxqqxdzp-d7e83d6aec4307f1a21e`。正式集合页、SKU 图片切换、完整图库和图片弹窗已通过浏览器复验。909 个 sitemap URL 无缺失，Googlebot/OAI-SearchBot 能读取商品内容，HTML/robots.txt/llms.txt 的 UTF-8 编码通过。尚未执行本批 git push，推送仍须按根规范单独取得批准。此前 Shopify 后台浏览器登录过期，但分类浏览已使用集合数据实现，不再依赖该登录来配置筛选。

## 历史：库存已更新，SEO 代码当时待发布（2026-11-12）

用户要求 iPhone Duo 全部 SKU 库存设为 100。已对 908 商品 / 3,643 SKU 启用库存跟踪，并在唯一线上履约地点设定可售 100，总计 364,300；全量读回通过。此记录取代下方上架时“不跟踪库存”的历史状态，不代表供应商现货确认。集合 SEO 标题与描述已更新到 Shopify。

SEO 候选已补 CollectionPage/ItemList、商品面包屑、UTF-8 HTML 和可选 llms.txt；42 项测试、lint、构建、筛选与来源暴露审计通过。生产 sitemap 覆盖本批全部 909 URL，Googlebot/OAI-SearchBot 可读取。新增代码尚未推送或部署，线上仍使用原结构化模板、llms.txt 尚未上线。详见 [本轮验收与发布范围](qa/2026-11-12-inventory-seo.md)。


## iPhone Duo 商品上架完成（2026-11-12 11:49 北京时间）

已通过当前浏览器完整采集原始 906 组及次日新增 2 组，共 908 组 / 3,643 个 SKU。Shopify 新增 895 组 / 3,611 SKU，更新既有 13 组（现 32 SKU，补入 19 个颜色变体）；全部 ACTIVE，并发布到 Online Store、Headless、Hydrogen。新建自动集合 `iphone-duo`，API 读回 908 组，前台集合和 21 款式商品切换已验证。

普通售价逐 SKU 等于采集时来源主报价（USD ×1），批发阶梯价仅存后台。`custom.source_urls` 保存原链接，`custom.source_snapshot` 保存完整参数，较大记录由 `custom.source_snapshot_part_01` 至 `_03` 分段并索引；`custom.sourcing_record` 保存逐 SKU 原价、阶梯价、MOQ 和来源映射。上述字段及采集时间/状态均为 Storefront NONE。全量读回 SKU、价格、来源、阶梯价、变体主图及三个渠道校验零差异。

图库补传已完成，唯有同一商品的 2 张来源图片持续返回 HTTP 404；其原始 URL 和原因保存在私有快照中，其他图片与各变体主图可用。来源库存未验证，不虚构供货库存；既有库存未改动，新商品采用不跟踪库存。前台图库组件现有显示数量上限未改动，完整采集图库保存在 Shopify 和私有记录。

证据位于被忽略的 `.cache/catalog/iphone-duo-2026-11-11/`，详细记录见 [验收](qa/2026-11-12-iphone-duo-import.md)和[计划](plans/2026-11-11-iphone-duo-import.md)。本轮未推送 Git、未部署前台代码、未安装折扣应用、未改变店铺密码或执行完整结账。

最近更新：2026-11-11 17:08（北京时间，UTC+08:00，连接核验记录时间）。本文件保存当前连接/授权摘要和带日期的历史；处理店铺、凭据或发布时仍须核对实际状态。长期规则见根 AGENTS.md 和 docs/rules/，进度及下一步见[进度记录](project-progress.md)。

## 本机连接核验（2026-11-11 17:08 北京时间）

本机项目 `/Users/rivengao/Desktop/seine/seineshop` 已通过 Shopify CLI 关联 `ps83if-c4.myshopify.com` 的 SeineShop（storefront `1000183956`）。`hydrogen env list` 读回 Production（production / main / https://www.seineshop.com）和 Preview（preview）；`.shopify/project.json` 已确认被 Git 忽略。本次未拉取 `.env`、未接通管理 API、未推送或部署。生产实际提交未核验；既有发布任务仍保留 T13，历史 13/15 数量不作为本机重新验收结果。下一步按具体开发需求准备本机运行环境。

以下发布摘要为历史记录，不代表本次生产核验。

## 当前发布摘要（2026-11-04 15:28）

- 用户已明确授权本次除 GA4 外的既有修复推送 main 并部署 Production；不是后续 push 或环境变更的持续授权。
- 本轮候选恢复原 GA4，本地命令及代表交互复验通过；本批尚未推送或部署。精确当前生产与回滚部署待后台读取，安全验证已请用户本人完成。
- 详情及命令见[本轮发布准备](plans/2026-11-03-oxygen-production-release.md)。下方是上轮规则整理时摘要，授权和发布状态以本节及后续实测为准。

## 2026-11-03 摘要（历史）

- 开发基线已完成远程工程对齐，使用仓库实际 package.json/锁文件；当前为 Hydrogen 2026.4.7 / React 18。早期 lint、缺少 SESSION_SECRET 和结账域名的阻碍均已在后续修复，证据见下方历史和 QA，不能把早期失败当作当前未解决问题。
- 本次规则整理开始前重新 fetch：origin/main 为 `56ffe2ef09ba2274837694871a052389fd332374`，本地 main 为 `c3b6101`，领先 2 个已有文档提交，无远程新增提交、无未提交改动；保留本地成果继续整理。该结果仅是任务开始时的快照，提交/上传前须重新检查。
- 既有获准批次已上传，详见[上传结果](qa/2026-11-03-upload-review.md)。后续文档与本次规则整理仅在本地；当前没有针对这些提交的新 push 批准。每次 push 及生产发布分别遵守[根授权边界](../AGENTS.md#授权边界)和 [Git 工作流](rules/git-workflow.md)。
- 最新发布限制沿用 2026-11-03 15:29 的用户决定：保留线上 GA4，不发布同意门控修复；main 已含该修复，原整包候选停止，T13 受阻、待调整发布范围。须先准备排除该改动的候选，再验证、明确范围并取得生产单独批准。本次只整理文档，不改发布候选、前台或生产配置。
- 本轮整理期间工作区另出现前台、README、发布准备及生成类型的并行修改，均保留，不纳入本轮文档验收；候选准备以[发布范围记录](plans/2026-11-03-oxygen-production-release.md)的后续结果为准，本摘要不为该任务签署验收或新增发布授权。
- 既有连接记录：`https://www.seineshop.com/`，Oxygen SeineShop Production，storefront `1000183956`；15:29 曾核对 production/main/www.seineshop.com。精确生产提交、回滚部署和外部自动发布关联未在本次复核，不将远程最新提交当作生产版本。
- 既有 Storefront/管理 App 接入及本地凭据保存授权继续有效，具体范围见[管理 App 记录](#管理-app-连接与授权范围)。历史登录、安装或调用不代表当前已接通，也不批准具体商品/库存/页面写入。保留店铺密码，不进行完整结账。

## Git 同步与迁移历史（不代表当前状态）

- **2026-11-02 首次迁移范围**：用户要求干净的远程工程，只把此前确定的规则合并进去；不迁入本地独立前台、管理脚本、旧依赖或旧版技能，也不建立旧工程归档。旧工具及接入记录仅用于理解历史，不能据此扩大本次合并范围。代码对齐及获准清理完成前，不声称工作区已经干净。

- **2026-11-02 推送规则决定（持续有效，具体流程以当前规范为准）**：仓库为 `git@github.com:forfunly/seineshop.git`，以远程 main 的工程及版本为准。每次新改动前先获取、检查远程更新并判断如何同步/合并；新改动上传目标为 main，但**每一次 push 前都必须停下来问用户，获得针对本次提交的明确同意后才可推送**。先前普通 main push 的免确认约定已撤销，详见根 AGENTS.md 与 [Git 工作流](rules/git-workflow.md)。
- **2026-11-02 对齐验收当时状态（后续修复见下方历史）**：用户确认对齐方案并于回复“已清理”后完成旧工程清理；再次 fetch 核实远程仍为 `407eeab256f4671ed832ecc8f452a52edc8aa526`。本地 `main` 已建立并跟踪 `origin/main`，恢复远程完整源码，仅合并已保存的规则。未迁入旧管理脚本或 SDK 技能，未新建工作树或旧工程备份；`.env`、`.shopify/project.json` 的 SHA-256 与清理前一致，均继续被 Git 忽略。依赖安装、30 项测试、codegen、构建、集合筛选与来源暴露检查通过；全量 lint 因远程 Jest 配置问题中断，本机页面预览因缺少 `SESSION_SECRET` 未验收，详见 [对齐验收](qa/2026-11-02-remote-alignment.md)。未推送或部署，不将源码恢复表述为运行或上线成功。

### 仓库关联历史（不代表当前工作区状态）

- 用户指定本项目仓库为 `git@github.com:forfunly/seineshop.git`，已授权在当前本地目录关联该远程仓库并读取远程分支。此次关联不包含 push、覆盖本地文件、合并不同源码、修改 CI/CD 或部署。
- 关联前本地为尚无提交的 `main`，现有源码与规范均未跟踪，未配置远程仓库；核对远程内容时保留全部本地文件及获授权的 `.env`。
- 2026-11-02 已执行 `git remote add origin git@github.com:forfunly/seineshop.git`；SSH `ls-remote --symref origin HEAD` 成功，默认分支为 `main`；`git fetch --no-tags origin` 成功取得 `origin/main`，最新提交为 `3d381a6be8afd6187e655cdc9718c539f286554d`。
- 仓库包含完整 Hydrogen 前台源码；`git merge-base --is-ancestor 1b69439 origin/main` 退出码 0，确认包含 2026-10-30 后台曾展示的部署提交。该证据不代表远程最新提交就是当前线上版本，当前生产部署仍需单独核对。
- 远程 package.json 使用 Hydrogen `2026.4.7` / React 18，本地使用 Hydrogen `2026.10.2` / React 19。此次只配置远程并 fetch Git 历史，本地分支仍无提交、工作文件未同步；未 checkout/pull/merge、未 push、未修改 CI/CD 或部署。后续采用远程工程前先核对并保存本地自定义代码、规范和管理工具，不盲目覆盖。

## 阶段与连接历史（按记录倒序，不代表当前状态）

- 2026-11-03 15:29（北京时间，记录时间）用户最新要求保留线上 GA4，不发布同意门控修复。生产配置和线上脚本未改；当前 main 仍包含已提交的同意门控代码，原整包部署候选停止，T13 标为待调整发布范围。已只读核对 Production 为 production/main/www.seineshop.com，线上首页仍出现旧 GA4 脚本。后续须先准备排除该改动的新候选，再明确发布范围并获单独部署批准；不擅自回滚源码或删除文件。见 [修订发布准备](plans/2026-11-03-oxygen-production-release.md)。时间展示更新继续保存在本地。

- 2026-11-03 用户对明确的 9 提交、48 文件批次回复“确认”后，复核远程与批准提交未变，已普通推送至 origin/main。远程 main 经 ls-remote 与 fetch 双重读回均为 `56ffe2ef09ba2274837694871a052389fd332374`；T12 完成，流程图为 12/14 已验证并进入阶段六，T13 等待生产部署单独授权。未执行生产部署；上传后的状态记录仅在本地更新，后续推送另行批准。见 [上传结果](qa/2026-11-03-upload-review.md)。下条为上传前审查历史。

- 2026-11-03 用户要求继续后，完成 T11 上传前审查：fetch/pull 确认远程无新提交，整理 8 个已有本地提交及本次审查记录提交，共 9 个提交、48 个文件。35 测试、lint（0 错误、2 既有警告）、集合筛选和构建来源审计复跑通过；环境、依赖、CI/CD 未改动。仓库无 GitHub Actions 工作流，外部 Webhook/App 与 Shopify 后台关联未实时复核，不据此保证所有外部自动部署均关闭。T12 等待针对本次推送的明确批准；未 push、未部署，详见 [上传审查](qa/2026-11-03-upload-review.md)。

- 2026-11-03 用户回复“修复”后完成本地分析同意门控与官方 Cookie 设置入口。拒绝并刷新后 GA 脚本/请求均为 0，接受后初始化一次且 collect 返回 204，撤回及客户端跳转不增加请求；EN/JA/DE、手机宽度与键盘代表交互完成复验。35 项测试、lint（0 错误、2 既有警告）、构建、集合筛选与来源审计通过。Toolkit 独立类型解析受限、既有 hydration/analyzer 提示、生产与完整 GA4 商业归因仍保留缺口。T10 范围明确为本地同意管理，流程图转入阶段五审查；未 push、未部署、未改环境/后台配置，详见 [复验记录](qa/2026-11-03-analytics-consent.md)。下条为修复前失败历史。

- 2026-11-03 修复前检查：拒绝分析并刷新后，Shopify Customer Privacy 返回 false，GA4 仍发送 page_view（204）。当时 T10 标为受阻、待修复并提交方案；后经用户批准修复，当前结果见上条。原始失败证据保留在 [验收记录](qa/2026-11-03-analytics-consent.md)，不代表当前修复仍未通过。

- 2026-11-03 用户单项授权后，仅在本地 `.env` 追加 `PUBLIC_CHECKOUT_DOMAIN=ps83if-c4.myshopify.com`，验证追加前原文件字节未变、环境文件继续被 Git 忽略。重启本机预览后，商品页浏览器不再报告 `consent.checkoutDomain is required`；首页及购物车返回 200，页面响应包含该域名。既有 CSP nonce hydration 提示仍存在，不据此宣称完整分析、同意管理或结账已验收。下方 2026-11-02 的“已请求授权且尚未修改”是当时的历史状态，该项现已解决。本轮无推送、生产配置变更或部署。

- 2026-11-02 用户回复“确认”批准批量修复后，已清除 39 个 lint 代码错误并修复 ESLint 配置及一个列表 key 警告；最终 lint 退出 0，保留 2 条脚本成功输出警告。商品询盘/图片弹窗共用原生 dialog 焦点管理，已实际检查桌面及手机视口；30 项测试、构建、集合筛选及构建来源检查通过。加购白色款 2 件、刷新保留、数量改为 3 件及移除恢复空购物车通过，未进入结账。浏览器额外报告本地分析缺少 `PUBLIC_CHECKOUT_DOMAIN`，已请求单项授权且尚未修改，详见 [修复验收](qa/2026-11-02-local-check-fixes.md)。下方早期排查记录中的待修错误和待确认批量方案已被本条更新。

- 2026-11-02 后续本地修复：用户明确授权在 `.env` 仅新增随机 `SESSION_SECRET`，已追加并验证其他原配置未变；签名会话读回、篡改 Cookie 拒绝、本机首页及商品页打开均已验证。开发服务为 `http://localhost:3000/`，仅本机回环监听；CLI 复用既有 Oxygen 关联加载其余远程运行配置，未改动线上配置。首次对齐时的“缺少 SESSION_SECRET”阻碍已解决。lint 配置已可执行，但仍有 39 个代码错误、3 个警告；批量前台修复方案仍待确认。无 push 或部署。
- Shopify 店铺：`ps83if-c4`；开发目标为 Shopify Headless 店铺。
- 用户已确认使用 Headless 架构，并授权读取现有 Storefront 凭据、创建本地 `.env`。执行 Hydrogen + React Router 本地预览方案。
- 现有线上站点为 `https://www.seineshop.com/`，由 Shopify Hydrogen / Oxygen 的 SeineShop（Storefront ID `1000183956`）Production 环境承载。2026-10-30 后台核实：主域名 Connected、DNS 指向 Shopify、TLS 证书已签发；根域名及 Oxygen 默认域名也已连接。
- 2026-10-30 本地目录已通过 Shopify CLI 关联现有 SeineShop storefront（ID `1000183956`），当时 Git 尚无提交及远程仓库配置；2026-11-02 已关联远程并 fetch，详见本文件 Git 仓库关联。不能把本地预览视为当前线上版本，也不能把“本次本地代码尚未部署”表述为店铺没有上线。后续网页开发先核对线上源码与本地差异，生产部署仍须单独授权。
- 用户已授权将本地项目关联到现有 SeineShop storefront；使用本地已安装的 Shopify CLI 执行 `hydrogen link`，只写本地 `.shopify/` 关联信息，不新建 storefront、不自动拉取或覆盖 `.env`、不连接 GitHub 自动部署。`.shopify/` 由 CLI 管理并保持 Git 忽略，不保存于公开静态资源。2026-10-30 后台 Oxygen deployments 页面显示尚未连接 GitHub 仓库；线上部署记录不代表源码可从 Oxygen 下载。
- 2026-10-30 CLI 关联成功，`.shopify/project.json` 中的 shop 为 `ps83if-c4.myshopify.com`，storefront 为 `gid://shopify/HydrogenStorefront/1000183956` / SeineShop；`hydrogen env list` 读回 Production（handle `production`、branch `main`、URL `https://www.seineshop.com`）和 Preview（handle `preview`）。关联不等于已部署或已同步线上源码；本次未执行部署或修改线上环境变量。
- 默认中文沟通，代码、命令、变量名使用英文；先结论后理由。
- 先核实商品、品牌及销售市场，再确定页面内容，不虚构商品、销量、评价或服务承诺。

## 管理 App 连接与授权范围

- 管理 API：用户已授权创建 SeineShop AI Manager，接通商品上架、集合、页面、菜单、文件、库存、翻译与主题编辑相关管理权限，并将新凭据仅保存于本地 `.env`；不得将管理凭据传到前台。授权接通不代表授权实际发布商品或生产网页，验证先使用只读请求。
- 现有管理 App：用户也已授权接入 SeineShop Catalog Manager，优先复用其现有凭据；目前已核实安装与商品等权限，但尚未取得凭据。不得把“已安装”“有调用记录”描述为本项目已接通，不得从一个组织的 403 推断用户在所有组织都没有创建或安装 App 的权限。
- 接入替代方案：既有新建管理 App 和本地保存凭据授权涵盖在当前可访问 Partner 组织通过 custom distribution 接入本店；安装目标仅限 `ps83if-c4.myshopify.com`，不申请公开 App Store 分发，不给其他店铺安装，不修改其他现有 App。
- 管理接入历史：Partner 组织 `234051952` 的 SeineShop AI Manager（App ID `441790234625`）已通过单店 custom distribution + OAuth 安装。Admin offline token 仅在本地 `.env`，24 项 scopes 曾由真实 Admin API 核验；旧工程的 `npm run admin:check` 曾验证店铺、App 身份和资源读取。本次只迁移规则，旧管理脚本未迁入，当前工程没有该命令，也未重新进行管理 API 验证。组织 `233393793` 下未安装的同名 App 仅保留记录与本地备用凭据，不用于当前连接。现有 Catalog Manager 保持原状。
