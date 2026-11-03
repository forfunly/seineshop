# 工程、目录与验收详细规范

工程结构、可复用工具、框架接入、验证或交付任务必须读取；沿用根 AGENTS.md 的操作边界。

- 开始改动、同步、提交及上传前还必须读取 [Git 工作流](git-workflow.md)。远程 `origin/main` 是唯一开发基线；首次对齐只合并项目规则，不迁入旧本地独立工程的代码、工具或依赖。

## 代码留存与复用

- 当前项目根目录为 `D:\AI_workspace\seineshop`。本项目后续编写的可复用脚本、采集处理逻辑和网页代码均保存在该目录下，按用途归档，不能只留在聊天记录、临时终端命令或项目外的临时目录中。
- 商品采集、来源数据整理、SPU/SKU 归并、价格计算及 Shopify 管理工具放在 `scripts/`；网页、组件与前台业务逻辑放在 `app/`；实施方案与验收记录分别放在 `docs/plans/`、`docs/qa/`。
- 编写新功能前先检查现有实现，优先复用或完善已有脚本与模块，避免为同一流程重复创建功能相同的脚本。临时排查形成稳定、需要重复执行的流程后，应保存为项目脚本。
- 新增或修改可复用工具时，补充 README 中的用途、运行命令、输入输出及所需配置说明，并执行适用验证。凭据仍仅使用获授权的本地 `.env`，不得硬编码进脚本或示例。

## 目录与命名

- 根目录：本规范、项目说明及工具生成的必要配置。
- `docs/plans/`：开发方案，按 `YYYY-MM-DD-topic.md` 命名；保留决策与验收记录。
- `docs/project-progress.md`：项目进度事实与入口；`docs/project-progress.html`：内部交互展示，单文件 HTML/CSS/JavaScript，无外部依赖，不导入前台、不放 `public/`、不加入 sitemap。`scripts/serve-project-progress.mjs` 仅在本机提供该页面及明确列出的验收 Markdown，响应声明 UTF-8；不读取 `.env`。进度数据与事实记录同步更新，保留历史验证日期，未知时间不编造。页面只是更新时的快照，不执行推送、部署或店铺写入；不自动清理文件。
- `docs/rules/`：按主题拆分的项目详细规范，英文 kebab-case 命名；由根 AGENTS.md 指定必读条件，保留原有重要规则，不自动清理。`docs/project-state.md` 保存当前连接状态、已有授权范围与历史接入事实；它不替代根规范中的操作红线。
- `app/`：React Router 页面、组件、样式、服务端数据接入与会话；沿用官方模板命名。
- `public/`：可公开的静态资源；不得包含环境变量或后台数据导出。
- `.agents/skills/`、`.claude/skills/`：仅在实际需要且版本匹配时使用的项目技能；2026-11-02 已清理旧版 SDK 技能，远程基线没有这两个目录，不为对齐而重建。根目录 `AGENTS.md` 是必须保留的项目总规定，与技能目录不同。
- `docs/qa/`：不含后台或凭据信息的本地预览截图与验收记录；按日期及视口命名，保留交付版本。
- `.react-router/`、`dist/`、`build/`、`.cache/`、`node_modules/`：工具生成文件、项目级缓存及本地依赖，不纳入源代码提交，不自动清理。npm 共享缓存被占用时可用命令级 `--cache .cache/npm`，不更改系统或全局 npm 配置。
- `tests/`、`guides/`、`.cursor/rules/`：沿用远程已有的测试、开发指南和编辑器规则及命名，不混入旧工程实现。
- 对齐前遗留的 `docs/plans/2026-10-30-headless-storefront.md` 和 `docs/qa/2026-10-30-*` 保留为本机历史资料，不参与新工程构建或验收；在 `.git/info/exclude` 逐项排除，不上传远程，也不自动删除。
- `.env`：获授权的本地连接参数；必须被 Git 忽略，不输出其内容。
- 管理 App 的身份、实际权限、接入历史与已有授权见 [项目连接状态](../project-state.md)；处理连接或凭据前必须读取，不从旧安装记录推断当前已接通。
- `scripts/`：本地管理工具与验证脚本，使用英文 kebab-case 命名；只读为默认，不内嵌凭据，不导入前台构建。保留有用工具，不自动删除临时文件。
- 正式初始化后，以经确认的官方模板为基础，在开始新增目录前补充其用途和命名约定。
- 不把临时截图、导出数据、下载包或密钥放入源代码目录。
- 不自动删除文件。临时产物需要清理时先列明路径并询问用户。

## 实施规则

- 先更新规范，再调整目录或工程实践；大改动先提交方案，用户确认后实施。
- 优先采用 Shopify 官方 Hydrogen；先确认实际版本，依照该版本文档开发，禁止混用新旧 API。
- `tests/` 当前使用 Node 内置 `node:test` 与 `node:assert/strict`，ESLint 测试配置必须匹配实际框架，不套用需要 Jest 运行时的规则；不得为修复检查配置而引入无关测试框架或跳过测试检查。
- 使用 Shopify 托管结账；只实现已经验证可用的功能。
- 不通过注释错误、忽略类型检查或加入绕过标记处理故障。
- 密钥、token、密码不得进入代码、commit 或日志；不要求用户在聊天发送验证码。

## 必须单独获得用户授权的操作

- 删除文件、目录或 Git 历史。
- 超出授权范围的 `.env`、密钥、token、CI/CD 配置操作；已授权复用现有 Storefront 凭据、创建 SeineShop AI Manager 并取得和本地保存管理凭据。不允许轮换其他现有 token。
- 数据库 schema 变更或数据迁移。
- **每一次 `git push`**，包括本项目 `origin/main` 的普通推送及文档推送；必须先说明本次提交并获得用户明确同意，先前免确认约定已撤销。`git rebase`、`git reset --hard` 或强制推送也必须先问。按根 AGENTS.md 和 Git 工作流执行。
- 安装新的全局依赖或修改系统配置。
- 公开发布，包括生产部署、发布文章或 `npm publish`。
- 登录、多因素验证和安全挑战由用户本人完成。

## 验证与交付

- 工程验证以远程工程实际配置为准：2026-11-02 package.json 提供 `npm run lint`、`npm run codegen`、`npm run build`；运行与变更相关的 tests/ 测试。旧本地工程曾使用 `npm run typecheck`、`npm run test:admin` 与 `npm run admin:check`，仅作为历史工具记录，在获准迁入并验证前不得当作远程已有命令。
- 本地启动使用远程工程 `npm run dev`，核对该版本 CLI 的监听选项并仅监听本机；旧本地 Vite 的 `--host 127.0.0.1` 不能直接照搬到 Hydrogen CLI。不主动建立公开隧道。
- 当前可执行：`npm ci`、`node --test tests/*.test.mjs`、`npm run lint`、`npm run codegen`、`npm run build`、`node scripts/check-collection-filters.mjs`、构建后 `node scripts/audit-source-exposure.mjs --built`。`codegen` 生成 GraphQL/路由类型，不等于全项目类型检查；远程没有独立 `typecheck` 命令。2026-11-02 已修复 lint 配置及代码错误，检查为 0 错误、2 条脚本成功输出警告，见 [修复验收](../qa/2026-11-02-local-check-fixes.md)；不通过忽略规则绕过。
- 改动后主动执行适用验证，并在浏览器检查桌面和手机布局、商品选择、购物车及结账跳转。
- 真实店铺尚未接通时，明确标记演示数据与尚未验证的交易功能。
- `robots.txt`、`llms.txt`、`agents.md`、CSV 等文本资源采用 UTF-8；上线后检查实际 Content-Type 的 `charset=utf-8` 并通过浏览器验证多语言及特殊符号显示，不能只依据 HTTP 200 或构建结果。
