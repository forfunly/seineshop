# 分析与 Cookie 同意管理：历史失败与本地修复复验

## GA4 六事件本地候选验收（2026-11-17）

范围：当前会话用户已确认六事件方案；复用主目录 main，开工远程核对 `483164b`，原两张未跟踪截图保留。没有新依赖、凭据/.env、CI/CD、schema、商品/价格/库存变更、push 或主站发布。新建的后台像素只是未连接草稿，不能当作线上已接通。

### 实现与验收依据

| 事件 | 归属与本轮证据 |
| --- | --- |
| `session_start` | 沿用 GA4 自动会话，不手工发送。现有测量 ID 不变；不声称已核对正确 GA4 后台资源中的入库。 |
| `view_item` | 实际本地商品页发送 USD19/1件/黑色，规格 ID 与 Shopify 一致；德国拒绝分析时无电商事件，允许后发送德文商品/规格。日语手机页同时复核语言和布局。 |
| `add_to_cart` | 普通加购 USD19/1件；Bulk Buy 黑1+白1 上报 USD38/2件，购物车旧数量不重复计入；样品加购 USD19/1件。复用的吸底按钮走同一已验收服务端动作；未另外增加业务测试数据验证吸底点击。 |
| `begin_checkout` | 原始像素在隔离浏览器执行，模拟 `checkout_started` 到本机接收器成功。前台不在按钮点击时发送。真实手机购物车键盘 Enter 跳转 Shopify，5件/小计 USD95 与保存的购物车一致。 |
| `add_payment_info` | 模拟 `payment_info_submitted` 到本机接收器成功；没有提交真实支付信息或扣款。 |
| `purchase` | 模拟 `checkout_completed` → `purchase`，商品净额36、税3、运费12，订单ID独立，重复完整流程仍只有一条购买。不是实际 Shopify 支付或正式 GA4 收入验收。 |

- 服务端以加购前后完整快照比较真实数量，支持库存调整警告、网络不确定、币种及价格校验，不因分析失败重复写入或阻塞购买。最多250行完整快照；超出时保守跳过加购分析，不编造数量。超过200项的加购按 GA4 上限拆分；结账购买保留单笔完整金额、前200项商品，不拆成虚构订单。
- 本机浏览器真实读取 GA client/session 标识（只记录可用性，不保存真实值）。购物车结账后读回三个匿名属性存在；拒绝分析后再次请求结账，旧匿名属性确已清空，购物车仍保留。Buy now 单独1件/USD19结账，返回后原购物车仍5件。
- 修复外部结账后浏览器返回缓存恢复时的 fetcher 悬挂：使用当前 React Router 7.16 的 `reset()`，手机后退后 Buy now 恢复可用。普通加购、批量加购、样品、购物车结账都在隔离浏览器会话中；过程中一次移动设备切换刷新中断了样品响应，未据此推定客户端上报，随后独立复测。最终测试购物车黑4/白1，共5件/USD95；没有订单、通知、付款或发货。
- 390px手机商品/购物车按钮无横向溢出，checkout按钮宽350px、键盘聚焦及Enter可用；英语、德语、日语页面正常，语言前缀的checkout action保留。外部评价读取在本机出现过不可用提示，不作为本轮评价功能验收；未改相关接入。
- 内部浏览器接收器 `node scripts/preview-ga4-pixel.mjs` 仅监听127.0.0.1:3010；原始像素的Google脚本传输在测试页替换成本机接收器。最新代码执行完整流程两次只收到 `begin_checkout`、`add_payment_info`、`purchase` 各1条，金额均36/USD，浏览器外部资源请求0；页面UTF-8中文正常。模拟订单ID不进入生产GA4。

### Shopify 草稿与启用边界

- 用户本人完成 Shopify 身份验证后，在 `ps83if-c4.myshopify.com` 创建 **Seine Shop GA4 Checkout**（自定义像素174522627）；代码保存并刷新读回，界面仍提供 Connect，未执行连接。Required只勾Analytics，Marketing/Preferences不勾；未修改17TRACK或全局隐私设置，未改数据出售设置。
- [后台草稿](https://admin.shopify.com/store/ps83if-c4/settings/customer_events/pixels/custom/174522627)与仓库 `scripts/ga4-checkout-pixel.js` 去除末尾换行后的SHA256同为 `af3789003f2f557e44a5faf77a56181da0dc346825e2ab8f0583058f07e915db`。编辑器保存时仅移除末尾换行，非业务差异。
- Shopify静态发现要求订阅事件名称为字面量。最初动态循环触发后台未订阅提示，已改成三处显式 `analytics.subscribe`，刷新读回后提示消失，并新增回归保护。
- 生产仍使用原版主站，结账像素未连接。后续分别确认push、主站部署、连接此草稿，再核对Pixel Helper/实际GA4请求及正确数据流。不要另接同ID的重复Google像素。真实测试店支付、跨域GA4归因和后台入库尚未闭环；页面未加载、拦截器或浏览器中断仍可能丢失客户端事件，本轮没有订单Webhook对账。
- 沿用历史决定：基础GA4初始化和停用同意修复不在本轮发布调整范围。新增电商事件遵循Shopify分析许可，不能据此宣称旧基础page_view已改为同意门控。

### 检查与资料

本次提交清单（27文件，目标 `origin/main`，尚未获准推送）：

- 组件：`app/components/AddToCartButton.jsx`、`CartSummary.jsx`、`ProductBulkBuy.jsx`、`ProductForm.jsx`、`CheckoutForm.jsx`、`CommerceAnalytics.jsx`。
- 公共/服务端逻辑：`app/lib/checkout.server.js`、`fragments.js`、`ga4-cart.server.js`、`ga4-client.js`、`ga4-commerce.js`。
- 接入与样式：`app/root.jsx`、`app/routes/cart.jsx`、`app/routes/checkout.jsx`、`app/routes/products.$handle.jsx`、`app/styles/cart.css`。
- 已跟踪查询类型同步：`storefrontapi.generated.d.ts`。
- 像素与测试：`scripts/ga4-checkout-pixel.js`、`scripts/preview-ga4-pixel.mjs`、`tests/ga4-checkout-pixel.test.mjs`、`tests/ga4-commerce.test.mjs`。
- 文档：`README.md`、`RELEASE-NOTES.md`、`docs/rules/engineering.md`、`docs/plans/2026-11-03-analytics-consent-fix.md`、本QA、`docs/project-state.md`。两张原有未跟踪截图不在提交内。

- 交付前最新检查：118/118测试、lint（0错误/2项原有脚本警告）、codegen、build、集合筛选、构建来源审计、差异空白检查均通过。27个候选文件与dist合计118个文件扫描6项本机实际敏感值，0匹配。保留原envFile弃用、React Router未来选项和构建分析器缺少metafile提示；构建退出0，不以此声称全项目类型通过。6份Markdown严格UTF-8解码、62个相对链接检查通过。
- 官方 Toolkit 2026-04 对含 `pageInfo.hasNextPage` 的真实购物车查询校验通过，保留原CartCost税费字段弃用提示。CheckoutForm源码校验无通用错误，但工具没有可验证的Polaris组件；CommerceAnalytics两处返回null的JSX被独立工具报隐式any，JSDoc注释也未被该工具识别。没有添加忽略或绕过，不将其记为全项目类型通过；本项目没有全项目typecheck命令，codegen/build与真实浏览器结果分别记录。
- 无公开URL或可索引正文变更；现有sitemap生成源和lastmod保持，sitemap测试包含在全量测试中。内部测试接收器不是站点路由，不加入sitemap。
- 本次浏览器验收记录原有页面，已关闭本任务9/10/11/15四个标签；原空白页5及另一个任务的页面16保留，专用浏览器仍供其他任务使用。原58/59在浏览器重新连接前已不存在，未按旧ID操作。日语手机购买区截图视觉检查正常，未新增仓库截图。已停止本次3009开发服务和3010隔离接收器，缓存及原有截图不删除。
- 官方依据：[Shopify checkout_started](https://shopify.dev/docs/api/web-pixels-api/standard-events/checkout_started)、[payment_info_submitted](https://shopify.dev/docs/api/web-pixels-api/standard-events/payment_info_submitted)、[checkout_completed及数据结构](https://shopify.dev/docs/api/web-pixels-api/standard-events/checkout_completed)、[customerPrivacy](https://shopify.dev/docs/api/web-pixels-api/standard-api/customerprivacy)、[Google GA4 ecommerce](https://developers.google.com/analytics/devguides/collection/ga4/ecommerce)。

以下保留11月3日历史证据，不代表本次或当前生产状态。

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
