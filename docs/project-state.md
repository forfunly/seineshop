# 项目连接状态与授权记录

最近更新：2026-11-03。处理店铺连接、App 凭据、发布或线上源码时必须读取，并通过当前实际状态复核。历史安装或授权不代表当前会话已经登录，也不代表已批准具体商品/网页发布。阶段状态见 [进度流程图](project-progress.md)。

## Git 仓库关联

- **最新迁移范围**：用户要求干净的远程工程，只把此前确定的规则合并进去；不迁入本地独立前台、管理脚本、旧依赖或旧版技能，也不建立旧工程归档。旧工具及接入记录仅用于理解历史，不能据此扩大本次合并范围。代码对齐及获准清理完成前，不声称工作区已经干净。

- **最新用户决定（2026-11-02，覆盖此前推送授权）**：仓库为 `git@github.com:forfunly/seineshop.git`，以远程 main 的工程及版本为准。每次新改动前先获取、检查远程更新并判断如何同步/合并；新改动上传目标为 main，但**每一次 push 前都必须停下来问用户，获得针对本次提交的明确同意后才可推送**。先前普通 main push 的免确认约定已撤销，详见根 AGENTS.md 与 [Git 工作流](rules/git-workflow.md)。
- **本轮实际状态**：用户确认对齐方案并于回复“已清理”后完成旧工程清理；再次 fetch 核实远程仍为 `407eeab256f4671ed832ecc8f452a52edc8aa526`。本地 `main` 已建立并跟踪 `origin/main`，恢复远程完整源码，仅合并已保存的规则。未迁入旧管理脚本或 SDK 技能，未新建工作树或旧工程备份；`.env`、`.shopify/project.json` 的 SHA-256 与清理前一致，均继续被 Git 忽略。依赖安装、30 项测试、codegen、构建、集合筛选与来源暴露检查通过；全量 lint 因远程 Jest 配置问题中断，本机页面预览因缺少 `SESSION_SECRET` 未验收，详见 [对齐验收](qa/2026-11-02-remote-alignment.md)。未推送或部署，不将源码恢复表述为运行或上线成功。

### 仓库关联历史（不代表当前工作区状态）

- 用户指定本项目仓库为 `git@github.com:forfunly/seineshop.git`，已授权在当前本地目录关联该远程仓库并读取远程分支。此次关联不包含 push、覆盖本地文件、合并不同源码、修改 CI/CD 或部署。
- 关联前本地为尚无提交的 `main`，现有源码与规范均未跟踪，未配置远程仓库；核对远程内容时保留全部本地文件及获授权的 `.env`。
- 2026-11-02 已执行 `git remote add origin git@github.com:forfunly/seineshop.git`；SSH `ls-remote --symref origin HEAD` 成功，默认分支为 `main`；`git fetch --no-tags origin` 成功取得 `origin/main`，最新提交为 `3d381a6be8afd6187e655cdc9718c539f286554d`。
- 仓库包含完整 Hydrogen 前台源码；`git merge-base --is-ancestor 1b69439 origin/main` 退出码 0，确认包含 2026-10-30 后台曾展示的部署提交。该证据不代表远程最新提交就是当前线上版本，当前生产部署仍需单独核对。
- 远程 package.json 使用 Hydrogen `2026.4.7` / React 18，本地使用 Hydrogen `2026.10.2` / React 19。此次只配置远程并 fetch Git 历史，本地分支仍无提交、工作文件未同步；未 checkout/pull/merge、未 push、未修改 CI/CD 或部署。后续采用远程工程前先核对并保存本地自定义代码、规范和管理工具，不盲目覆盖。

## 当前阶段

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
