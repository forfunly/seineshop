# 分析与 Cookie 同意管理：历史失败与本地修复复验

检查日期：2026-11-03（Asia/Shanghai）。范围：本地 Hydrogen 2026.4.7 / React 18；没有改动前台代码、环境变量、生产配置或 Shopify 商品数据。未进入结账。

## 已完成的检查与实际结果

1. 在浏览器独立测试上下文 `consent-qa-20261103` 打开本地商品页，不复用用户原有购物车或登录会话。
2. Shopify Customer Privacy API 已加载；当前测试区域返回 `CNSC`。初始无显式选择时，API 返回允许分析且 `shouldShowBanner()` 为 false，因此不能仅凭本区域未弹窗判断其他区域的要求。
3. 在独立会话通过官方 `setTrackingConsent` 将 analytics、marketing、preferences、sale_of_data 设为 false。回调完成，`currentVisitorConsent()` 四项均为 `no`，`analyticsProcessingAllowed()` 为 false。
4. 此时 GA4 已初始化，dataLayer 没有任何 `consent` 指令。完整刷新并等待 Privacy API 恢复后，拒绝选择仍保留，API 仍返回不允许分析。
5. 刷新后实际出现 Google Analytics `g/collect` 的 `page_view` 请求，网络返回 204；不是仅依据 GA 脚本标签推断发送成功。本记录不保存请求完整 URL、访客标识、Cookie 值或凭据。

## 根因及影响范围

- `app/root.jsx` 的 Layout 无条件输出 GA4 外部脚本与 `gtag('config', ...)`；它们不受 Analytics.Provider 的 Customer Privacy 同意判断约束，拒绝选择也没有同步到 GA4。
- 同处的 `withPrivacyBanner` 为 false，当前前台未找到 Cookie 同意设置入口。此为静态代码/本地浏览器观察，尚未跨区域验证真实用户横幅行为，也没有据此断言生产端实测结果。
- Shopify Customer Privacy 的加载、拒绝写入及刷新保留已验证；GA4 响应拒绝的验收失败，完整同意管理与完整分析流程不能标为完成。本轮未测试批准后事件、撤回同意后的事件、各地区/语言横幅或完整电商归因。

## 当时处理（修复前）

T10 保持未完成，标记“受阻 · 待修复”，当前位置回到阶段四。修复范围涉及全站追踪初始化与 Cookie 管理入口，先提供 [修复方案](../plans/2026-11-03-analytics-consent-fix.md)，按根 AGENTS.md“大改动先提交方案，经用户确认后实施”的规则等待批准。未推送、未部署。

依据：[Analytics.Provider](https://shopify.dev/docs/api/hydrogen/2026-04/components/analytics/analytics-provider)、[useCustomerPrivacy](https://shopify.dev/docs/api/hydrogen/2026-04/hooks/usecustomerprivacy)、[第三方同意管理](https://shopify.dev/docs/storefronts/headless/legacy/hydrogen/analytics/consent-3p)。本机实测结果与源码观察优先于文档推断。

## 2026-11-03 获准修复及复验

用户回复“修复”批准方案后，移除 root 无条件 GA4 脚本，新增 `ConsentAnalytics` 和可测试的 `google-analytics-consent` 模块。依据 Shopify `canTrack()` 同步 Google 同意状态；API 未就绪时默认拒绝，未获允许不请求 GA。撤回时先设置 GA 禁用标志；脚本加载完成前再次检查同意，避免异步初始化越过撤回。广告用途始终拒绝，测量 ID 不变。

启用 Shopify 官方隐私横幅；页脚新增 EN/JA/DE Cookie 设置入口。修复官方弹窗在本项目样式环境下的说明文字宽度与长标题计算，手机不再横向溢出。未修改后台地区设置或 `.env`。

### 浏览器实测

独立本机 Chromium 上下文 `consent-fix-20261103`，商品页及客户端首页跳转；不使用用户原登录或购物车。当前地区仍为 CNSC，初访无选择时 Shopify 允许分析；这不等于所有地区都允许。

| 操作                                 | 实际结果                                                                                                                            |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| 官方偏好弹窗选择拒绝，然后完整刷新   | Privacy API 仍不允许分析；GA 禁用标志 true，GA 脚本 0，Google Analytics 请求 0                                                      |
| 拒绝后重新接受                       | GA 脚本 1，config 1；网络捕获 `/g/collect` 页面浏览请求，返回 204                                                                   |
| 已允许后撤回，再滚动并客户端切到首页 | GA 禁用标志 true，Google 同意更新为 denied；请求数保持 2→2，没有新增分析请求，config 仍为 1                                         |
| 拒绝状态打开 DE、JA 路由             | Cookie 入口和官方偏好弹窗使用对应语言；两种路由均无 GA 请求                                                                         |
| 桌面和 390×844 手机                  | 弹窗、接受/拒绝/保存按钮可见；日语长标题未遮挡关闭按钮，德语和日语说明区域 scrollWidth 等于 clientWidth，无横向溢出                 |
| 键盘                                 | 页脚入口聚焦后 Enter 打开；打开聚焦关闭按钮，Tab 到接受、Shift+Tab 返回关闭、Enter 可关闭。未据此声称所有辅助技术或跨浏览器均已覆盖 |

未保存完整请求 URL、访客标识或 Cookie；测试结束恢复隔离会话的拒绝选择。官方弹窗关闭后仍保留隐藏 DOM，验收以可见性和实际宽度判断，而非仅检查元素存在。

### 工程检查与限制

- `node --test tests/*.test.mjs`：35/35 通过，其中新增 5 项覆盖未知/拒绝、允许、加载途中撤回、重复初始化与刷新。异步加载竞态由可控测试覆盖，未模拟所有实际网络条件。
- `npm run build`：退出 0；集合筛选及构建来源暴露审计通过。保留已有 React Router/envFile/插件兼容告警，bundle analyzer 缺少 metafile，不能声称分析器成功。
- 测试浏览器在 `.cache/` 生成第三方扩展文件，发现 ESLint 未排除此生成目录；按工程规范补齐缓存排除，不降低应用/脚本/测试规则。最终 `npm run lint` 退出 0：0 错误、2 条既有脚本成功输出警告。
- Shopify Toolkit 2026-04 已逐文件尝试校验：4 个 JSX 文件因独立校验器无法解析项目 Hydrogen/React/JSX 类型未通过；辅助 JS 返回 VALID 但注明无可验证组件。不能将此描述为全量类型校验通过。项目构建、lint 和浏览器证据分别记录。
- 既有开发模式 CSP nonce hydration 提示仍存在。本次仅验证本地同意门控；GA4 后台归因、purchase 转化、跨地区/跨浏览器及生产环境仍需后续验收。保留店铺密码，不进入结账或下单。

修复代码与工程检查完成后，T10 的范围明确为“本地分析同意管理验收”；完整商业分析不据此标为已完成。本轮未推送、未部署，无环境变量、凭据、CI/CD、依赖或商品数据变更。

[流程图更新截图](2026-11-03-consent-repair-progress-desktop.png)：阶段四 4/4 本地已验证，当前位置为阶段五审查与上传。
