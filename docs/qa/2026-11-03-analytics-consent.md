# 分析与 Cookie 同意管理：验收未通过

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

## 当前处理

T10 保持未完成，标记“受阻 · 待修复”，当前位置回到阶段四。修复范围涉及全站追踪初始化与 Cookie 管理入口，先提供 [修复方案](../plans/2026-11-03-analytics-consent-fix.md)，按根 AGENTS.md“大改动先提交方案，经用户确认后实施”的规则等待批准。未推送、未部署。

依据：[Analytics.Provider](https://shopify.dev/docs/api/hydrogen/2026-04/components/analytics/analytics-provider)、[useCustomerPrivacy](https://shopify.dev/docs/api/hydrogen/2026-04/hooks/usecustomerprivacy)、[第三方同意管理](https://shopify.dev/docs/storefronts/headless/legacy/hydrogen/analytics/consent-3p)。本机实测结果与源码观察优先于文档推断。
