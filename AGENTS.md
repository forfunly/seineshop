# SeineShop 项目总规定

## 项目与沟通

- 根目录：`D:\AI_workspace\seineshop`；默认中文、结论先行，代码/命令/变量使用英文。不虚构商品、销量、评价或服务承诺。
- 架构：Shopify Headless，优先使用官方 Hydrogen，按实际安装版本开发，禁止混用新旧 API；使用 Shopify 托管结账。
- **开发基线以远程 `origin/main` 为准**：使用仓库 package.json、锁文件、架构和依赖版本（2026-11-02 为 Hydrogen 2026.4.7 / React 18）；本地独立创建的 Hydrogen 2026.10.2 / React 19 工程停用为开发/发布基线。工作区尚未对齐时不得继续基于旧本地工程开发、部署或将其整体上传覆盖远程。
- **首次对齐仅合并规则**：远程工程的代码、配置、依赖和测试作为基础，只融入用户已确定的项目规则；不迁入旧前台、旧管理脚本或旧版 SDK 技能，不建立旧工程备份目录。清理旧文件仍须按明确路径先获得删除授权；现有 `.env`、`.shopify/` 和 Git 历史保留。
- 线上：`https://www.seineshop.com/`，Oxygen SeineShop Production；本地已关联 storefront `1000183956`。2026-11-02 本地源码已恢复为远程 `main` 基线，仅合并项目规则，结果见 [对齐验收](docs/qa/2026-11-02-remote-alignment.md)；未推送或部署。远程最新提交是否对应当前生产仍需单独核对。

## Git 仓库与强制工作流

- **指定仓库**：`git@github.com:forfunly/seineshop.git`（https://github.com/forfunly/seineshop），远程名 `origin`，新改动的提交与上传目标为 `main`。
- **每次改动前必须检查远程**：包括代码和文档，先查看本地状态并执行 `git fetch origin`，检查远程新增提交、日志及文件差异，再判断如何同步或合并。已建立远程基线、工作区干净且可快进时，执行 `git pull --ff-only origin main` 后再改；有未提交改动、分歧或冲突时先保留成果并评估合并，不能盲目覆盖或跳过远程检查。
- **每次 push 前必须停下来问用户**：先完成变更、适用验证，准备明确的提交及文件清单，说明目标为 `origin/main`，得到用户针对本次推送的明确同意后才能执行 `git push`。此要求适用于所有推送，包括文档；“以后上传 main”、历史授权、用户未回复或默认选项均不能代替本次确认。
- **撤销先前的免确认 push 约定**：不再适用“普通 main push 已获持续授权/无需重复确认”。未经本次明确同意，即使验证通过或 commit 完成也不得推送；不得用其他命令、工具或 GitHub API 绕过确认。上传后核对远程 main 的提交哈希，防止漏传或误传。
- 上传前再次检查远程更新，必要时重新评估合并及验证；不擅自 rebase、reset --hard 或强推。首次源码对齐、大改动、生产部署及其他受限操作仍遵守各自授权边界，详见 [Git 工作流](docs/rules/git-workflow.md)。

## 按任务必读

以下文件是本规范的一部分，命中条件时先读取再执行；普通 Markdown 链接不会自动载入其内容。

| 任务 | 必读文件 |
| --- | --- |
| 网站建设、页面/模板/组件、内容、路由、商品展示、多语言或上线验收 | [全站 SEO](docs/rules/seo.md) |
| 参考站适配、选品/采集、价格、SPU/SKU、商品写入或自定义数据 | [商品与数据规范](docs/rules/catalog.md) |
| 工程结构、可复用工具、框架接入、验证或交付 | [工程规范](docs/rules/engineering.md) |
| 开始任何文件改动、同步源码、提交或上传 | [Git 工作流](docs/rules/git-workflow.md) |
| 店铺连接、App/凭据、部署发布或线上源码 | [连接状态与授权](docs/project-state.md)，并核对实际状态 |

只读相关文档；任务已读取且内容未变时无需反复读取。更新规范先改文档、再改实践；新增目录先约定用途、命名与清理方式。

## 必须始终遵守

- **全站 SEO**：现有及后续页面、模板、代码、数据、导航、媒体、sitemap/robots 和线上响应均遵循 Google Search Essentials 及相关官方要求；上线验证不能用本地构建结果代替。
- **参考站**：TVCMALL `https://www.tvcmall.com/` 是选品及建站主要参考；实施前查看真实页面，忠实适配结构与写法，内容与承诺以本站实际为准。
- **定价**：每个来源 SKU 的本站售价 = 对应来源价 × 2；核对币种，必要时先明确汇率。不因记录规则自动修改现有商品。
- **归并**：同 SPU 的多 SKU = 一个 Shopify Product 下的多个 Variants；保留规格、独立价格/库存/图片和来源映射，重复采集幂等更新，不能只凭相似标题合并。
- **数据**：优先原生字段，扩展参数用 Metafields，共用结构用 Metaobjects；先明确定义、类型、归属、用途和访问范围，再写入并读回验证。来源价/链接/采集时间和内部备注默认不向 Storefront 公开。
- **代码**：可复用脚本和网页保存在本项目，先复用现有实现；稳定流程保存脚本、补 README。查根因，不通过注释报错、忽略检查或绕过标记处理故障。
- **凭据**：仅使用获授权且 Git 忽略的本地 `.env`；密钥/token/密码不进源码、前台、commit、日志或公开资源。登录、多因素验证和安全挑战由用户本人完成。
- **授权**：Storefront 和 SeineShop AI Manager 的既有接入/本地保存凭据授权继续有效，范围见连接记录；接通权限不等于批准实际商品、库存、页面写入或生产发布，不重复索取已有授权。

## 先问用户的操作

- 删除文件、目录或 Git 历史；不自动清理临时文件。
- 超出既有授权的 `.env`、密钥、token、CI/CD 配置操作；不轮换其他现有 token。
- 数据库 schema 变更或数据迁移。
- **每一次 `git push`**（包括本项目 `origin/main` 的普通推送和文档推送）、`git rebase`、`git reset --hard` 或强制推送。推送必须获得针对本次提交的明确同意，不能沿用先前授权；生产部署、密钥及 CI/CD 改动另守各自边界。
- 安装新的全局依赖或修改系统配置。
- 公开发布，包括生产部署、文章或 `npm publish`。
- 大改动先提交方案，经用户确认后实施。

## 目录与验证

- `app/`：前台；`scripts/`：采集/归并/定价及管理工具，英文 kebab-case 命名、默认只读、不导入前台。
- `public/`：公开静态资源；`docs/plans/`、`docs/qa/`：方案/验收，日期命名；`docs/rules/`：按主题规则；`docs/project-state.md`：连接状态与历史。
- `.agents/skills/`、`.claude/skills/`：版本匹配的项目技能；`.shopify/` 为 CLI 本地关联目录并被忽略。生成物、依赖不提交、不自动删除，完整目录约定见工程规范。
- 验证命令以远程工程 package.json 与测试配置为准；2026-11-02 有 `npm run lint`、`npm run codegen`、`npm run build` 及 `tests/`。旧本地的 typecheck/admin 脚本不得描述为远程已有功能。文档变更检查内容完整性、路径与链接。
- 本机启动使用远程工程的 `npm run dev`，核对 CLI 默认监听地址并仅监听本机，不套用旧版 Vite 参数、不主动开公开隧道；按变更范围检查桌面/手机、商品选择和购物车。用户要求保留店铺密码，未经进一步指令不关闭保护或继续完整结账验证。
- 文本资源（robots.txt、llms.txt、agents.md、CSV 等）用 UTF-8；部署后实测 Content-Type 的 `charset=utf-8`，并在浏览器检查中文、多语言及特殊符号，HTTP 200/哈希/构建通过均不能替代。
- 交付区分本地、Preview 与 Production，记录已验证项和缺口；不把文档约定、已有安装或成功构建描述为已上线、已收录或功能已验证。

## 远程工程原有要求

This storefront is scaffolded from Shopify's Hydrogen skeleton template. See the README for framework-specific details.

Use the [Shopify AI Toolkit](https://shopify.dev/docs/apps/build/ai-toolkit) for all Shopify API and platform work. If missing, install it in the agent host per that page (or `npx skills add Shopify/shopify-ai-toolkit --list` for skill-compatible hosts).

## Project memory

Read `README.md` and `RELEASE-NOTES.md` before changing storefront features. When present in the local workspace, also read `../DEVELOPMENT-MEMORY.md`. It records the user's reference-site strategy, consumer-facing source restrictions, and approved commercial rules. Keep that internal document outside public assets and build inputs. Run the source-exposure audit before deployment.
