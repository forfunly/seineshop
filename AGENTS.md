# SeineShop 项目总规定

## 项目与工作入口

- 项目根目录：`D:\AI_workspace\seineshop`；默认中文、结论先行，代码、命令和变量使用英文。不虚构商品、销量、评价或服务承诺。
- 架构：Shopify Headless / 官方 Hydrogen，使用 Shopify 托管结账；沿用远程工程的 package.json、锁文件和实际依赖版本，禁止混用新旧 API 或迁入停用的本地独立工程。
- 指定仓库：`git@github.com:forfunly/seineshop.git`，远程名 `origin`，开发基线及上传目标为 `main`。每项新修改任务开始前检查本地与远程，按 [Git 工作流](docs/rules/git-workflow.md) 同步并保留已有成果。
- 本文件只保存长期规则与任务入口。最新连接、授权和发布限制见 [项目状态](docs/project-state.md)；当前节点、完成依据及下一步见 [进度记录](docs/project-progress.md)和[交互路线图](docs/project-progress.html)。历史状态不代替当前核验，远程提交不等于生产版本。

## 授权边界

以下操作必须先获得用户明确授权；即使 auto-accept 也不得跳过：

- 删除文件、目录或 Git 历史，包括临时产物；不自动清理。
- 超出既有授权的 `.env`、密钥、token、CI/CD 配置操作；不轮换其他现有 token。已有接入和本地保存凭据的授权范围以项目状态记录为准，不重复索取，也不扩大为实际商品、库存、页面写入或生产发布授权。
- 数据库 schema 变更或数据迁移。
- **每一次 `git push`**（包括文档）：先完成变更和验证，说明提交、文件清单及目标 `origin/main`，取得针对本次推送的明确同意。历史授权、“以后上传 main”、默认选项或未回复均不算批准；不得通过其他工具/API 绕过。推送与生产部署分别授权，完整流程见 Git 工作流。
- `git rebase`、`git reset --hard` 或强制推送。
- 安装新的全局依赖或修改系统配置。
- 公开发布，包括生产部署、文章发布或 `npm publish`。
- 大改动先在 Plan Mode 提交方案，经用户确认后实施；判断标准见工程规范。

登录、多因素验证和安全挑战由用户本人完成；不要求在聊天发送验证码。密钥、token、密码仅使用获授权且被 Git 忽略的本地配置，不进入源码、前台、commit、日志或公开资源。

## 按任务必读

以下文件是本规范的一部分，命中条件时先读取。普通 Markdown 链接不会自动加载正文；只读相关文档，内容未变时无需反复读取。

| 任务 | 必读文件 |
| --- | --- |
| 开始任何文件修改任务、同步源码、提交或上传 | [Git 工作流](docs/rules/git-workflow.md) |
| 工程结构、工具、框架、验证、交付或进度页维护 | [工程规范](docs/rules/engineering.md) |
| 网站建设、内容、页面/组件、路由、商品展示、多语言或上线验收 | [全站 SEO](docs/rules/seo.md) |
| 参考站适配、选品/采集、定价、SPU/SKU、商品写入或自定义数据 | [商品与数据规范](docs/rules/catalog.md) |
| 店铺连接、App/凭据、部署发布或线上源码 | [项目状态与授权](docs/project-state.md)，并核对实际状态 |
| 修改前台功能 | [README](README.md)、[RELEASE-NOTES](RELEASE-NOTES.md)及工程规范中的项目记忆约定 |

## 实施底线

- **规则先行**：先更新约定，再调整实践；新增目录先规定用途、命名与清理方式。先复用已有实现，可复用工具保存于本项目并补充 README。
- **真实内容与来源边界**：主要参考 TVCMALL `https://www.tvcmall.com/`，实施前查看相关真实页面，忠实适配结构与写法，使用本站实际内容和承诺。来源站品牌、采购信息及内部记录不得进入面向消费者的页面或构建资源；详细规则及商业约定保存在仓库内的商品规范，不依赖外部记忆文件。
- **商品与数据**：逐 SKU 售价 = 对应来源价 × 2，核对币种；同 SPU 多 SKU 归为一个 Product 的多个 Variants，保留独立规格、价格、库存、图片和来源映射。原生字段优先，扩展用 Metafields / Metaobjects；先定义类型、归属、用途及访问范围，再写入并读回验证。记录规则不等于授权批量修改现有商品。
- **质量**：查根因，不以注释报错、忽略检查或绕过标记处理故障。全站遵循 Google Search Essentials；按工程规范的验证表运行相关检查，文档与内部网页也需验收。
- **编码与上线**：robots.txt、llms.txt、agents.md、CSV 等文本资源使用 UTF-8；上线后实测 Content-Type 的 `charset=utf-8`，并在浏览器检查中文、多语言和特殊符号。HTTP 200、哈希或构建通过不能替代显示验证。
- **本机与交易边界**：使用 `npm run dev`，核对当前 CLI 监听选项，仅监听本机，不开公开隧道；保留店铺密码，未经进一步指令不关闭保护或继续完整结账验证。
- **进度与交付**：每完成一项任务、切换阶段、遇阻、验收或发布，同步更新进度 Markdown 与交互网页的状态、当前位置、数量、动态、依据及下一步。展示要求见工程规范；验收失败回到修复节点。区分本地、Preview、Production，记录缺口，不把已有安装、成功构建或 Git 上传当作已上线、已收录或线上功能已验证。

## 目录与运行速查

- `app/`：前台；`public/`：公开静态资源；`scripts/`：本地工具与审计，英文 kebab-case 命名、默认只读、不导入前台。
- `docs/rules/`：长期详细规范；`docs/plans/`、`docs/qa/`：按日期命名的方案与验收；项目状态及进度文档仅供内部使用，不放入公开资源或构建输入。
- `.env`、`.shopify/`、依赖和生成物不提交、不自动删除；技能目录只在实际需要且版本匹配时使用，完整约定见工程规范。
- 启动：`npm run dev`；检查：`npm run lint`、`node --test tests/*.test.mjs`、`npm run codegen`、`npm run build`。按改动范围选择检查，命令含义和审计要求见[验证对照表](docs/rules/engineering.md#验证与交付)，不假设存在 `typecheck` 或旧管理脚本。
- 内部路线图：`node scripts/serve-project-progress.mjs`，打开 `http://127.0.0.1:4174/`；仅供本机查看，是手动维护的状态快照。

本项目源于 Shopify Hydrogen skeleton；框架说明见 README。所有 Shopify API 与平台工作使用 [Shopify AI Toolkit](https://shopify.dev/docs/apps/build/ai-toolkit)；缺失时按官方指引补齐，涉及全局安装或系统配置仍先取得授权。部署前必须运行来源暴露审计。
