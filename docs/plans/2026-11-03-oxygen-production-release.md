# Oxygen 生产发布准备

日期：2026-11-03（北京时间）。状态：原发布候选暂停，待修订范围。用户最新要求保留线上 GA4 配置，本次不发布 GA4 同意门控修复；没有执行部署。当前 main 仍含该修复，禁止按下方原候选命令直接整包上线。

## 最新范围约束（覆盖下方原候选）

- 线上 GA4 先保持原样；不修改线上脚本、统计配置或店铺隐私设置。
- 已上传 main 的同意门控代码保留为已提交事实，不擅自删除文件、改写 Git 历史或直接部署。下方涉及 GA4 的发布范围和命令已失效，仅保留准备记录。
- 其他弹窗/键盘及 lint 修复若要发布，先准备应用差异中排除 GA4 改动的新候选，验证 GA4 行为与当前线上保持一致，再提交新的具体发布范围。没有新候选和生产批准前不执行部署。
- T13 标记为受阻（待调整发布范围），T14 未开始。这里是本次发布范围的阻碍，不代表店铺离线；时间展示更新不受影响。

## 本次范围与已核对目标

- 店铺 `ps83if-c4.myshopify.com`，已关联 SeineShop storefront `1000183956`。
- 已通过当前项目安装的 CLI 执行 `hydrogen env list`：Production 的 handle 为 `production`，branch 为 `main`，域名为 `https://www.seineshop.com`；Preview 单独存在。
- 已推送的应用代码基线为 `56ffe2ef09ba2274837694871a052389fd332374`。本地后续提交仅包含内部记录；本轮核对 `app/`、`public/`、依赖、服务入口、Vite/React Router 配置和环境示例相对该提交无差异。执行前再次核对，若应用范围有变化则停下重新说明。
- 发布内容为 GA4 同意门控、官方 Cookie 设置入口及 EN/JA/DE 文案、商品图片/询盘弹窗焦点与键盘修复，包含此前 lint 修正。内部进度页和本方案不是前台页面，不加入 public 或 sitemap。
- 只读访问线上首页返回 200，仍包含无条件 GA4 脚本且未发现 Cookie settings 入口；资源路径包含 `/4924604/assets/`。这些是当前响应特征，不能据此推断生产的准确 Git 提交或将资源路径编号冒充可回滚部署 ID。

## 原候选命令（已失效，不执行）

在 `D:\AI_workspace\seineshop` 使用现有项目依赖：

```powershell
$env:SHOPIFY_CLI_NO_ANALYTICS='1'
node_modules/.bin/shopify.cmd hydrogen deploy --env production --no-json-output --metadata-description "Consent and dialog fixes; app source 56ffe2e"
```

该命令将构建结果和部署元数据发送至 Shopify Oxygen，并将 Production 的当前版本切换到新部署，会改变线上客户看到的前台。不传 `--env-file`，不以本机 `.env` 覆盖远程生产变量；不修改密钥、权限、CI/CD、商品、价格、库存或后台页面数据。不使用 force、跳过验证、客户端 source map 强制公开或认证绕过参数。

本次批准只涵盖这批前台的生产部署与下述验收，不自动批准新 push、生产变量变更、删除或店铺密码设置变更。若登录、安全挑战或缺失配置阻碍发布，按项目边界处理；不得绕过。

## 发布前及失败处理

1. 再次 fetch 并核对远程及应用代码范围，确认工作区可审查且无新业务修改；测试与构建证据见关联验收。本轮新增内容只是内部时间展示和发布记录，不改变前台代码。
2. 在 Oxygen 当前部署列表记录可恢复的成功部署和回滚入口，再执行发布。准确的当前 Git 提交和可回滚部署尚未从后台实时读回；公开资源编号不能代替这一步。无法记录可恢复版本时先暂停发布并说明。
3. CLI 自带 routability 验证保持开启。若构建失败或未切换成功，保留实际结果，不标已发布；若切换后关键浏览、购物车或同意门控失败，停止后续发布并按已核对的回滚入口提出恢复操作，不能声称自动回滚成功。

## 发布后验收与进度

- 核对 CLI 的成功结果、实际部署标识、Production 环境和真实域名响应；先区分已部署与已验收，保留传播延迟事实。
- 独立浏览器验证 Cookie 设置入口、允许/拒绝/撤回、刷新保留及 GA4 实际网络请求；英语/日语/德语、桌面和手机抽查。
- 商品页检查变体、图片和询盘弹窗；购物车抽查加购、数量与刷新保留。继续保留店铺密码，不下单、不执行完整结账验证。
- 在真实域名抽查初始内容、canonical/hreflang、robots/sitemap 和状态码；相关文本资源实测 UTF-8 响应头及浏览器中文/特殊符号显示。本地构建不能替代线上验收，既有缺口单独记录。
- 部署成功后更新 T13；代表线上验收完成后才更新 T14。同步 Markdown 与 HTML 的状态、依据、下一步和北京时间。发布结果记录保存在本地，任何后续 push 仍单独批准。

## 现有证据与限制

[上传及哈希核对](../qa/2026-11-03-upload-review.md)、[同意门控修复与 35 项测试](../qa/2026-11-03-analytics-consent.md)、[lint 与弹窗修复](../qa/2026-11-02-local-check-fixes.md)。已有构建兼容/analyzer 提示和 Toolkit 独立类型解析限制不冒充已消除；GA4 后台归因、purchase 转化及跨地区/跨浏览器完整覆盖仍不是这次代表验收的已完成项。

依据：[Oxygen 环境](https://shopify.dev/docs/storefronts/hydrogen/deploy/oxygen/environments)、[部署及回滚](https://shopify.dev/docs/storefronts/headless/legacy/hydrogen/deployments)，并核对当前 CLI 的实际 `hydrogen deploy --help`。
