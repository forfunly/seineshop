# SeineShop 内部交接核验

日期：2026-11-05（Asia/Shanghai）。范围：给另一个 GPT 的背景、配置、权限和进度交接资料；不改变网站业务或外部平台配置。

## 来源与范围

- 先读取根规范、Git 工作流、工程规范、项目状态/进度、商品/SEO 规则、README 和 RELEASE-NOTES。
- 本次 `git fetch origin` 成功；HEAD 与 origin/main 均为 `f3bb1ea6ce3ddd2f853a1ff9c1b297598cd4078c`，没有双向提交差。保留原有 4 个已修改内部文档和 2 张未跟踪生产截图，不覆盖/清理。
- 新增交接输出目录约定于工程规范；交接指南及 ZIP 存于被忽略的 `.cache/handoffs/`，英文日期命名，不放公开资源，不自动删除。
- Shopify 店铺/Storefront 标识由原始文档和本机 `.shopify/project.json` 只读核对；`.env` 仅提取键名用于配置说明，不输出或复制值。本次未重验 Admin API、Shopify 后台 Current 或全部生产页面。
- GSC 当前浏览器账号 `piu0uip218@gmail.com` 可访问 `sc-domain:seineshop.com`；已提交站点地图列表 0 行。设置页显示非经过验证的所有者，用户页要求 Owner；Full/Restricted 精确角色未核实。未提交 sitemap、请求索引或修改权限。
- GA4 代码测量 ID 为 `G-BKLZMJ9EP7`；本次浏览器可见属性未完成匹配，数值 property/stream/管理员待补。没有误用其他站点数据或新建资源。
- Google Analytics 连接器查询报缺少 ADC；SEO 平台账户/绑定管理接口报 `platform admin permission required`。这不代表浏览器 GSC 不可读，也不能据此推断所有账号无权限。

## 交付内容

六份按顺序阅读的中文指南，涵盖接手提示词、平台地址/环境键、权限与红线、当前进度和核验步骤；附原规则、状态/进度、方案/QA/截图、配置示例、依赖清单/锁文件、进度服务。白名单复制，不复制真实 `.env`、`.shopify/`、SSH/ADC 凭据、浏览器会话、依赖或构建产物，不复制完整前台源码或 Shopify 数据。

原始生产结论仍以 2026-11-04 16:14 证据为准：#5996658 / f3bb1ea；现有 15/15 里程碑范围不扩大。用户要求保留旧 GA4，休眠同意组件不能当当前生产能力。

## 验证与边界

打包后检查 UTF-8、文档文件/锚点链接、HTML 脚本语法与 15 项任务/阶段引用及日期顺序；本机进度页检查 UTF-8 响应和浏览器中文新动态。使用明确文件白名单和敏感字符串检查，重新读取 ZIP 核对 CRC、逐文件大小/SHA-256 与 manifest，确认无真实凭据或忽略目录混入。实际验证结果另记录于包内 `verification.json`，不使用历史构建结果代替本次文档检查。

本次未改前台或依赖，不运行无关网站 lint/codegen/build/交易测试；未提交、push、部署、改 CI/CD、改实际 `.env` 或平台权限；没有删除文件。后续 push、生产部署与配置写入继续按次授权。
