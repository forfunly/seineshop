# 远程 main 源码对齐验收

日期：2026-11-02。范围：本地 `D:\AI_workspace\seineshop`；未推送、未部署，未进行线上 SEO、商品或结账写入验收。

## 对齐结果

- 远程：`git@github.com:forfunly/seineshop.git`；fetch 后基线为 `407eeab256f4671ed832ecc8f452a52edc8aa526`。
- 本地 `main` 已建立并跟踪 `origin/main`；只有当前一个工作树，没有创建旧工程备份。
- 应用源码、公开资源、脚本、测试、配置、依赖锁文件及生成的 API 类型与远程一致；差异仅为项目规则、方案和本轮验收文档。
- 使用远程锁定版本：Hydrogen `2026.4.7`、React `18.3.1`、React Router `7.16.0`、Shopify CLI `3.93.2`。环境 Node `24.19.0`、npm `11.17.0`。
- 根 `AGENTS.md` 及 SEO、定价 ×2、SPU/SKU 合并、上架 handle、内部来源数据保护、改动前检查远程、每次 push 单独确认等规则保留。
- 旧前台、旧管理脚本、旧配置及旧版 SDK 技能未迁入。`.agents/` 技能目录与根 `AGENTS.md` 总规定不同；后者保留。
- `.env` 与 `.shopify/project.json` 的 SHA-256 和清理前相同，均被 Git 忽略；未输出凭据，未修改环境变量文件。
- 旧的 2026-10-30 方案、截图及验收资料保留于本机，在 `.git/info/exclude` 按具体路径排除，不上传、不用于本轮验收。

## 实际验证

| 检查 | 结果 |
| --- | --- |
| `npm ci --cache .cache/npm --no-audit --no-fund` | 退出 0，安装 824 个包，锁文件未变 |
| `node --test tests/*.test.mjs` | 30 通过、0 失败 |
| `node scripts/check-collection-filters.mjs` | 退出 0 |
| `npm run codegen` | 退出 0，GraphQL 类型及路由类型生成完成；不等于全项目类型检查 |
| `npm run build` | 退出 0，生成 `dist/client` 和 `dist/server`；存在下述分析器告警 |
| `node scripts/audit-source-exposure.mjs --built` | 退出 0；仅证明脚本检查的内部参考词未进入前台源码与产物，不等于全面安全审计 |
| `npm run lint` | 退出 1，远程原有配置错误，原因见下 |
| `git diff --check` | 退出 0 |
| 工程与远程差异 | 除 `AGENTS.md`、`docs/` 外无差异；API 生成文件仅产生行尾格式变化，已恢复远程版本 |
| 凭据及关联完整性 | 两个保留文件哈希一致，忽略规则生效 |

## 已知问题与边界

- 首次默认缓存安装因共享 `D:\nodejs_cache` 文件占用报 `EBUSY`；改用命令级项目缓存后完成安装，未更改全局配置。依赖未就绪时先运行测试曾因找不到 `react-router` 失败；安装完成后重跑全部 30 项通过。
- 全量 lint 在 `jest/no-deprecated-functions` 中断：ESLint 对 `**/*.test.*` 启用 Jest 规则，但仓库测试实际使用 `node:test`，也没有安装 Jest。配置和测试均来自远程；本次不安装无关测试框架，不忽略该检查，也不改动远程配置来掩盖问题。
- 构建有现有 CLI/Vite 兼容告警：bundle analyzer 尝试修改 Rolldown bundle 被忽略，缺少 `metafile.server.json` 导致分析摘要失败；构建命令最终退出 0，前台与服务端产物已生成。不能声称 bundle 分析完整成功。另有 envFile、React Router future flags 与 transformWithEsbuild 弃用提示。
- `.env` 缺少 `SESSION_SECRET`，服务端 context 明确要求该值；本轮按授权边界保持文件原样，未启动页面预览或验证购物车。示例中的其他缺项包括 `PUBLIC_CHECKOUT_DOMAIN`、索引/预览开关、客户账户 client ID 和 `SHOP_ID`，需按实际用途核实，不编造或自动覆盖。
- 当前远程最新提交是否就是 Production 版本未复核；本地构建成功不代表生产已部署、SEO 已验收或完整结账已通过。保留店铺密码保护，不进行下单测试。
- 后续若推送，只能在说明本次提交与目标 `origin/main` 并取得明确同意后执行；生产部署另行确认。
