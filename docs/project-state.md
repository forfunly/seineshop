# 项目连接状态与授权记录

最近更新：2026-11-02。处理店铺连接、App 凭据、发布或线上源码时必须读取，并通过当前实际状态复核。历史安装或授权不代表当前会话已经登录，也不代表已批准具体商品/网页发布。

## Git 仓库关联

- **最新用户决定（2026-11-02）**：停用本地独立版本作为开发/发布基线，以远程 main 的工程及版本为准。每次新改动前获取并检查远程更新，验证后提交并普通 push 到 main 已获持续授权；详见 [Git 工作流](rules/git-workflow.md)。本轮为规则调整，实际本地源码尚未对齐；第一次源码对齐仍需先给保留方案，经确认后实施。

- 用户指定本项目仓库为 `git@github.com:forfunly/seineshop.git`，已授权在当前本地目录关联该远程仓库并读取远程分支。此次关联不包含 push、覆盖本地文件、合并不同源码、修改 CI/CD 或部署。
- 关联前本地为尚无提交的 `main`，现有源码与规范均未跟踪，未配置远程仓库；核对远程内容时保留全部本地文件及获授权的 `.env`。
- 2026-11-02 已执行 `git remote add origin git@github.com:forfunly/seineshop.git`；SSH `ls-remote --symref origin HEAD` 成功，默认分支为 `main`；`git fetch --no-tags origin` 成功取得 `origin/main`，最新提交为 `3d381a6be8afd6187e655cdc9718c539f286554d`。
- 仓库包含完整 Hydrogen 前台源码；`git merge-base --is-ancestor 1b69439 origin/main` 退出码 0，确认包含 2026-10-30 后台曾展示的部署提交。该证据不代表远程最新提交就是当前线上版本，当前生产部署仍需单独核对。
- 远程 package.json 使用 Hydrogen `2026.4.7` / React 18，本地使用 Hydrogen `2026.10.2` / React 19。此次只配置远程并 fetch Git 历史，本地分支仍无提交、工作文件未同步；未 checkout/pull/merge、未 push、未修改 CI/CD 或部署。后续采用远程工程前先核对并保存本地自定义代码、规范和管理工具，不盲目覆盖。

## 当前阶段

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
- 当前管理连接：Partner 组织 `234051952` 的 SeineShop AI Manager（App ID `441790234625`）已通过单店 custom distribution + OAuth 安装。Admin offline token 仅在本地 `.env`，24 项 scopes 已由真实 Admin API 核验；`npm run admin:check` 验证店铺、App 身份和资源读取。组织 `233393793` 下未安装的同名 App 仅保留记录与本地备用凭据，不用于当前连接。现有 Catalog Manager 保持原状。
