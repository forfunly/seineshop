# 分析与 Cookie 同意管理：历史失败与本地修复复验

## Clarity Oxygen Production 发布验收（2026-11-17）

- 本次用户明确批准推送0452ef4、仅Production启用Clarity并发布，随后确认发布目标Shopify Oxygen。24文件提交已推到origin/main，实时远程哈希读回 `0452ef40c56957f9d995dc7b87470e1a9b5a0620`。没有上传本机.env或创建GA4密钥/订单定义；不连接结账像素。
- 后台 `PUBLIC_CLARITY_ENABLED=true` 最终只有Production。初始保存时界面包含Preview，发现后在部署前移除并保存，仅部署Production；其他正式变量未改。CLI先因非交互确认退出，随后交互执行 `hydrogen deploy --env production --no-json-output --force` 成功，未跳过可路由验证。force只允许原QA等非构建输入差异，不包含其他应用改动。
- Oxygen资源[5760768](https://admin.shopify.com/store/ps83if-c4/hydrogen/1000183956/deployments/5760768)、Deployment ID6143434、Production/main/0452ef4、Ready/Current。部署地址 `https://01m7m99ner133jd68tfvf5ecwy-d7e83d6aec4307f1a21e.myshopify.dev`，正式域名 `https://www.seineshop.com`。当前代码包含已在main的GA4前台事件；GA4服务端配置缺权限而保持关闭，结账像素未连接。
- 专用Chrome独立QA上下文 `clarity-production-qa-20261117`：公开商品页官方tag与SDK200，SDK0.8.80-beta，`s.clarity.ms/collect`多次204，body初始mask=true。拒绝通过Shopify官方Privacy API写入后active=false，缓冲后collect新增0；刷新analytics=false且Clarity脚本0。重允恢复；点击购物车链接时guard停止（本站该链接打开抽屉，不据此称发生路由切换），直接/cart在analytics=true时仍脚本0。
- 英/日/德商品标题和canonical正常，日语lang=ja、德语lang=de；日德scrollWidth未超视口。实际生产最小加购验证：独立购物车黑色1件/USD19、抽屉和/cart一致，dataLayer仅1条add_to_cart且商品数量1/金额19/USD；没有点击结账、支付、订单、通知或发货，不删除QA购物车。
- robots.txt与llms.txt为200/text/plain;charset=utf-8，sitemap.xml为200/application/xml;charset=utf-8，现有123分片索引可解析，首个en.products-1与末个de.policies-1均200/XML可解析/UTF-8；本次没有新公开URL或索引内容，未修改sitemap源。浏览器llms英文特殊标点及sitemap的ja/de条目无替换字符，日德商品字符正常。通知API GET405，未配置购买保持服务端关闭。
- 生产控制台存在Clarity尝试请求c.bing.com/c.gif而被CSP拦截；未扩大广告Cookie同步许可。核心collect已204，不能据此声称控制台零错误或跨浏览器全覆盖。Clarity后台仍跳转gettingstarted并提示数据几小时后显示，尚未实际观察后台回放/热图，不把网络204当作回放生成证据。
- 发布前137/137测试、lint0错误/2既有警告、codegen/独立router typegen、build、集合筛选及敏感扫描已通过；部署重新构建及发布后构建来源审计通过。原envFile/future flags/bundle analyzer工具提示保留。新增验收资料仅文档，按文档验证，无源码改动。
- 本次24/26/27/28标签已关闭；用户原应用商店18、Shopify后台19及原空白页保留，专用浏览器继续开放。未创建新工作副本，原六事件发布副本及无关QA段落保留。三份验收文档UTF-8、47个相对链接及diff空白检查通过；资料独立准备本地提交，不再次部署业务代码。

## Clarity 与 GA4 服务端候选验收（2026-11-17）

用户要求继续后，基于实时origin/main=3945896完成新鲜复验：137/137全量测试、lint（0错误/2既有警告）、codegen/独立router typegen、build、集合筛选通过。拟以24个本任务文件准备本地提交，另一个任务的六事件发布准备段落留在工作区、不纳入本次提交。生产建议范围为仅新增 `PUBLIC_CLARITY_ENABLED=true` 并发布Clarity；GA4服务端保持关闭、原结账像素连接不包含在本次范围内。push、正式配置和部署待逐项授权，不修改本机.env。

### 后续Shopify应用安装与关联

用户确认邮件后再次实测：Shopify显示 **Project link approved by admins of Clarity project (ID: zey8gxj9j0)**，Clarity标题为Seine Shop、项目页显示已成功使用Shopify安装。已按用户要求把分析后台及Shopify管理永久入口登记到[项目状态](../project-state.md)。dashboard入口当前会自动导航到gettingstarted；没有把此安装提示当作正式Hydrogen采集验收。本次新建标签23检查后关闭，用户原标签18/19保留；两份文档UTF-8与diff空白检查通过，未改源码、未push/部署。

用户亲自完成Microsoft Clarity应用安装并要求继续在Shopify后台操作。正式店后台已打开应用，选择Clarity only，未启用Brand Agents；现有项目ID `zey8gxj9j0` 已填入关联表单并提交。后台读回 **Project link request is sent ... pending project admins approval**，已请用户处理项目管理员确认邮件。原Shopify后台19及应用商店18为用户打开，保留；本轮未新建浏览器标签。

官方[Shopify集成说明](https://learn.microsoft.com/en-us/clarity/third-party-integrations/shopify)要求预先存在项目经管理员邮件确认；新项目流程的主题Clarity JS开关用于Online Store主题。本站Hydrogen仍需发布此前准备的独立前台代码，未把应用安装当作主站采集上线。用户另明确没有原GA4账号权限，既有ID与服务端开关保持，未创建替代资源或密钥。仅更新状态记录，无应用源码/.env/主站发布变更。

当前会话用户确认“两项都继续接入”。本轮复用主目录，保留六事件提交 `3945896` 及原两张未跟踪截图；当前本地与已缓存的 origin/main 都是该提交，结束前重新 fetch 首次 HTTP/2 失败，重试结果见项目状态。本轮没有 push、生产部署、真实付款、订单写入、凭据/.env、权限或元字段定义变更。

- Clarity：用户完成登录后创建 **Seine Shop** 项目，域名 `https://www.seineshop.com`、公开安装 ID `zey8gxj9j0`，从官方手动安装代码读回。免费浏览器脚本直接接 Hydrogen，不需要 GTM 或 Clarity API token。`PUBLIC_CLARITY_ENABLED` 默认关闭，生产未部署。
- 本地公开商品页通过已存在的 Vite 模块进行一次明确允许的 SDK 联调；观察到官方 tag、SDK `0.8.77` 及 `https://t.clarity.ms/collect` 请求，随后撤回并调用 stop，一秒缓冲后没有新 collect 请求。未据此声称 Clarity 后台已处理成回放。自动测试覆盖拒绝时零加载、重复允许、延迟加载期间撤回、重允、GPC及敏感路径/查询排除。页面初始 body 全文字遮罩；账户、购物车、搜索、代发及 API 不允许采集。
- 最新构建预览 `localhost:3012`：商品标题正常、Shopify Privacy API可用、body遮罩为true、未启用时无Clarity脚本，控制台0错误/0警告。先前3011开发页发生过HMR/hydration错误，不以该页证明生产构建失败；重新构建并重启预览后没有复现。
- GA4：成功加购可切换为唯一服务端发送方，未配置或缺匿名标识时保留浏览器；真实本地加购只观察到一条浏览器事件。购买要求合法订单签名通知、Admin真实已付金额、结账完成时允许分析回执及匹配的签名上下文；订单私有JSON状态通过CAS领取，重复/并发不重发，不确定结果留待核对。拒绝时即使残留匿名字段也不签发上下文。没有发送真实服务端购买事件。
- 隔离测试覆盖HMAC、店铺/主题不匹配、伪造/过期上下文、未付款/测试/取消订单、折扣及含税金额、回执与付款先后顺序、并发、超大请求、私有定义缺失、客户端凭据刷新及错误信息不泄密。浏览器像素遇到服务端证明时仅提交回执，失败不改走浏览器purchase，避免双发。
- 构建Worker真实OPTIONS `/api/ga4-checkout`，Origin:null返回204、Allow-Origin:*、POST/OPTIONS、Content-Type允许，private/no-store/noindex及UTF-8齐全。开发Vite会拦截OPTIONS，不能用其结果判断生产Worker CORS。GET通知入口405、未配置POST回执503；两入口不加入sitemap，既有sitemap回归通过。
- 137/137全量测试、lint（0错误/2既有警告）、codegen及独立router typegen、build、集合筛选和构建来源审计通过；末次补充拒绝签发保护后13/13服务端测试及build再次通过。保留envFile弃用、React Router未来选项和构建分析器缺少metafile提示；不称全项目类型验收。
- Shopify AI Toolkit Admin 2026-04分别验证订单查询与CAS写入操作通过。Storefront codegen与Admin schema分离；独立JSX验证对返回null/JSDoc存在工具限制，未添加忽略或绕过。
- 当前Google登录可见6个资源，已读到其他网站或不同测量ID：Forfunly `G-HSZ3WC36N2`、piu `G-BECBNMPPSJ` / `G-ZPC6MZLYSJ`，另一个piuuu无数据流；原Forfunly仅显示forfunly.com，Meilan为其他网站。未核对到本站 `G-BKLZMJ9EP7`，已询问所属账号；Analytics连接器缺少默认认证，也未用于替代账户验证。未创建错误资源的secret。

待具体授权后：匹配正确GA4数据流并创建API secret；专用正式店Admin应用及最小订单/商品权限、付款通知签名配置；ORDER JSON `seine_analytics.ga4_purchase`（Storefront NONE）；仅追加相应本机配置。原结账像素仍未连接且后台代码尚未升级本轮回执版本。生产配置、像素连接及部署分别授权，真实GA4入库和支付闭环仍待验。未收到最终允许回执或网络不确定仍可能少计，服务端回传不绕过隐私选择。

本次候选文件归属：`app/components/ClarityAnalytics.jsx`、`CommerceAnalytics.jsx`；`app/lib/clarity-consent.js`、`ga4-server.server.js`、`ga4-orders.server.js`、`ga4-endpoints.server.js`、`checkout.server.js`；`app/routes/api.ga4-checkout.jsx`、`api.ga4-orders-paid.jsx`、`cart.jsx`、`checkout.jsx`；`app/root.jsx`、`app/entry.server.jsx`、`server.js`；`scripts/ga4-checkout-pixel.js`；三个分析测试文件；README、RELEASE-NOTES、工程规范、原分析方案、本QA及项目状态。原截图不在候选范围。

24个候选文件与构建共117个文件扫描7项本机实际敏感值，0匹配；6份Markdown严格UTF-8读取、65个相对链接通过，diff空白检查通过。本任务12/13/14标签均已关闭，只剩原空白页7；3011开发和3012预览均已停止，没有删除缓存或截图。结束前fetch两次分别HTTP/2失败和HTTP/1.1超时，下次提交/推送前须再次核对远程。

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
