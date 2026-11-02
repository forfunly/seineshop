# 本地检查与弹窗修复验收

日期：2026-11-02。目录：`D:\AI_workspace\seineshop`，分支 `main`。用户已确认 [实施方案](../plans/2026-11-02-local-check-fixes.md)；本轮未 push、未部署、未修改 Shopify 后台业务数据。

## 改动

- ESLint 移除误用于 Node 测试的 Jest 配置，使用现有 `jsconfig.json` 解析声明文件；不添加 Jest、不降低常规规则、不忽略测试。
- 清理检查实际报告的未使用导入、翻译解构项及参数；同步移除空 deferred loader 的无用实参和参数文档。保留实际语言路由与数据获取逻辑。
- 商品表单先按错误文本去重，再以文本作为稳定 key；不再用列表下标作为错误列表 key。
- `app/lib/use-modal-dialog.js` 为图片放大与询盘共用的原生模态框 hook。打开时将焦点移至关闭按钮、Tab/Shift+Tab 循环、Escape 原生关闭、关闭后返回触发按钮；移除页面挂载时的 autoFocus。询盘通过原生 `closedBy` DOM 属性及不支持该特性浏览器的事件兼容逻辑保留背景关闭能力。
- 既有 `.env` 仅按已取得的独立授权新增了随机 `SESSION_SECRET`；其他原配置、token 和 `.shopify/project.json` 保持不变，环境文件继续被忽略。
- 框架版本、依赖锁文件、CI/CD、域名及 Oxygen 配置未修改；当前代码是远程基线上的获准修复，不再与远程应用源码完全相同。

## 命令验证

| 命令 | 最终结果 |
| --- | --- |
| `npm run lint` | 退出 0；0 错误、2 警告，仅两个验证脚本的正常 `console.log` 成功输出；未静音、改为错误输出或关闭规则 |
| `node --test tests/*.test.mjs` | 30 通过、0 失败 |
| `npm run build` | 退出 0，含 GraphQL codegen；既有 bundle analyzer/弃用告警仍存在，未宣称分析摘要成功 |
| `node scripts/check-collection-filters.mjs` | 退出 0 |
| `node scripts/audit-source-exposure.mjs --built` | 退出 0；仅覆盖该脚本列明的来源词暴露范围 |
| `git diff --check` | 退出 0 |

## 浏览器验证

- 本机 `http://localhost:3000/`，回环监听；桌面及 `390×844` 手机视口检查商品页面，手机页面宽度与视口同为 390px，没有横向溢出，询盘框位于视口内。
- 图片放大：打开后关闭按钮获焦点；Shift+Tab 到最后一个图片按钮，Tab 返回关闭按钮；Escape 和关闭按钮均能关闭并把焦点返回放大按钮。
- 询盘：点击或 Enter 打开、关闭按钮初始获焦点、Shift+Tab 到提交按钮、Tab 返回关闭按钮、Escape 关闭并返回询盘触发按钮。首轮发现仅依赖浏览器原生行为时 Shift+Tab 可移出模态框，增加共享焦点循环后复测通过。没有发送邮件。
- 白色变体切换后加购 2 件，购物车显示 `$38.00`；进入完整购物车页面后仍为白色 2 件；增加为 3 件后显示 `$57.00`；移除后恢复空购物车。保留店铺密码，没有进入结账或创建订单。
- 开发时热更新重启 Worker 期间曾出现一次上游请求 `Network connection lost`，购物车返回 500；待更新完成重新加载后返回正常页面并完成以上数量、金额及移除验证，没有用忽略错误或修改凭据处理。

## 仍有的缺口

- 浏览器报告 Hydrogen 分析/同意管理缺少 `PUBLIC_CHECKOUT_DOMAIN`。建议值为仓库 `.env.example` 已列明的 `ps83if-c4.myshopify.com`；已请求仅新增这一项的本地授权，未收到答复时不修改 `.env`。页面和购物车可用不等于分析/同意管理已完整验证。
- 开发模式另有既有 CSP nonce hydration 提示，以及首页图片的 React 18 fetchPriority 提示；本次未扩展到 CSP 或图片实现。生产运行、线上编码、收录及完整结账未验收。
- Shopify Toolkit 按 Hydrogen `2026-04` 对 22 个改动应用文件逐项运行独立校验：共享 hook 通过；其余 21 个文件在隔离环境中无法解析项目 Hydrogen/React JSX 类型或报告既有 JS/JSDoc 类型问题，没有声称全部通过。最初工具入口缺少 TypeScript，后复用项目已安装依赖启动；未安装全局包或修改插件。摘要仅保存在被忽略的 `.cache/hydrogen-validation-results.json`。项目实际 lint、测试、构建及浏览器结果如上，也不等于全项目 TypeScript 检查通过。
- 点击询盘遮罩关闭的实现已保留，并核对当前浏览器原生属性为 `any`；未跨 Safari/Firefox 做真实背景点击验收，不把原生属性读回当作全浏览器验证。
- 所有 push 都必须先明确本次提交和目标 `origin/main`，再取得单独同意；本轮修复确认不等于推送或生产发布授权。
