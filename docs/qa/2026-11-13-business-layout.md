# 商品询价与评价入口布局验收

日期：2026-11-13（北京时间）。环境：本地开发与本地构建预览；未推送、未部署，未修改密钥或后台配置。

## 参考核对

实际打开 TVCMALL 的 [B20A 商品](https://www.tvcmall.com/details/b-20a-3-in-1-wireless-charging-station-15w-foldable-magnetic-charger-stand-for-phone-earbuds-samsung-galaxy-watch-3-4-5-6-7-black-sku6630000794a.html) 及 [手机壳商品](https://www.tvcmall.com/details/gkk-for-iphone-18-pro-max-17-pro-max-magnetic-case-600d-fine-carbon-fiber-texture-hard-pc-phone-back-cover-black-sku6601249245a.html)。

- More Pieces 在单价右侧，紧接数量阶梯；其批发弹窗包含商品摘要/数量、服务类型、详细需求、邮箱/电话、姓名/公司、附件、取消/提交。
- Customization 模式有明显的 Create a Custom Request 按钮；实际定制弹窗另有样品链接、需求数量，联系信息采用双列。不复制其 MOQ、价格、时效、服务承诺、联系人或品牌。
- Reviews 位于详情导航及详情图后，折叠加载 Trustpilot 组件。所查看两个商品没有可用评价正文及站内写评价表单，不能据此臆造对方评价弹窗。
- 参考页缩到手机视口仍维持桌面宽布局；本站手机样式按同一信息顺序适配单列，不声称复制了未经确认的独立移动站布局。

## 初版布局变化（联系方式必填的后续修正见末尾）

- 主询价入口移到单价右侧，为绿色边框、44px 高按钮，替换旧下划线入口。数量阶梯移到价格下，继续联动购买数量。
- 询价弹窗为 760px 上限：商品图/名称/SKU/当前单价，当前规格数量，可展开追加规格，服务类型、必填需求、联系人信息。桌面邮箱/电话、姓名/公司、样品链接/目的地成对排列；手机单列。取消/提交与关闭按钮滚动时保持可用。
- 姓名、邮箱、公司及详细需求必填；电话/WhatsApp、样品链接、配送国家可选。后三项及服务类型保存到现有 note，不改变应用接口或后台字段。应用动态必填和多 SKU 校验保留。
- 简化评价区标题，显示真实数量、清晰写评价按钮；评分由下拉改为原生单选星级，保留邮箱、评价内容、可选姓名/标题/图片及应用必填配置。
- 英、日、德新增文案同步；零评价保持真实 0，没有示例评分或买家。

## 附件能力核对

重新读取 [中文指南](https://docs.sectionly.ai/zh/b2b/headless)、[官方完整契约](https://b2b.sectionly.ai/headless/docs) 和公开的 [官方表单脚本](https://b2b.sectionly.ai/api/storefront/v1/form.js)。公开端点仅列配置、商品规则、JSON 询价及嵌入资源；询价字段没有附件，非 JSON 写入返回 415。官方 form.js 未实现文件选择、上传或 FormData 提交。中文文档网站自身聊天助手的“添加附件”不属于 B2B 商品询价接口。

因此结论限定为“当前公开的 Headless 接入没有提供附件上传能力”，不断言供应商内部不存在其他接口。TVCMALL 弹窗确有附件上传，这是另一套系统。本站提供清楚的邮件附件说明；若后续要求站内文件上传，需要独立存储、文件校验和询价关联方案。

本轮只读打开 Sectionly 后台 Quote Settings 时，上游嵌入页出现 Unhandled Thrown Response / 200，未能用后台字段编辑器进一步核对；没有修改或保存配置。公开契约/脚本的结论不依赖这个异常页。

## 验证

- 全量 Node 测试 62/62；最后一次代码调整后重跑业务工具、sitemap、批发相关测试 27/27。
- lint 0 错误、2 个原有脚本 console 警告；codegen、build 退出 0；集合筛选和构建来源暴露审计通过；git diff --check 通过。
- CLI 仍有既有 envFile/Router future flags 和 Rolldown bundle-analyzer 警告；Toolkit 解析为 2026-04，但其组件校验未覆盖 Money 和本站组件，不能当作完整类型检查。Money 的 as 属性同时核对已安装 2026.4.7 的类型，使用 span 避免在段落内生成 div。
- 构建预览在专用 Chrome for Testing 的隔离本地页验收，无控制台错误。桌面 1440×1000、完整表单截图 1440×1280；手机 390×844，无页面/弹窗横向溢出。移动弹窗单列、首尾滚动、关闭及底部操作可见。
- 日语和德语手机商品页的入口与新增字段显示对应译文，页面和询价弹窗无横向溢出。
- Escape 关闭后焦点回到首屏询价按钮；OEM 入口正确预选 OEM。选择 50 件后数量为 50、当前单价总额为 $950.00，零售加购/立即购买按钮仍可用，询价带入同一数量。
- 询价提交仅在浏览器拦截本地 POST：模拟首次断网、重试成功，两次 operationId 和 payload 完全一致；服务类型、电话、样品链接、目的地保留。
- 评价仅拦截本地 POST：点击 4 星产生 rating=4，4 颗已选星；模拟失败后内容保留。没有真实评价、图片、询价、草稿订单或通知写入；没有实际结账。
- 当前生产 sitemap 索引只读返回 108 分片；英/日/德 products-1 分片均 200、UTF-8，每份含代表 B20A 规范 URL 一次，无业务资源接口。URL、sitemap 生成源及可信 lastmod 未变；本次界面未部署，生产界面待发布后复验。

## 新版截图

以下为本地真实商品/真实零评价的界面截图，未注入示例评价；保留上一版截图。

| 视图 | 证据 |
| --- | --- |
| 单价旁询价入口，桌面 | [截图](2026-11-13-reference-quote-entry-desktop.jpg) |
| 完整询价弹窗，桌面 | [截图](2026-11-13-reference-inquiry-desktop.jpg) |
| 评价区及写评价入口，桌面 | [截图](2026-11-13-reference-reviews-desktop.jpg) |
| 评价表单，桌面 | [截图](2026-11-13-reference-review-form-desktop.jpg) |
| 询价入口，手机 | [截图](2026-11-13-reference-quote-entry-mobile.jpg) |
| 询价弹窗，手机 | [截图](2026-11-13-reference-inquiry-mobile.jpg) |


## 后续修正：必填联系方式与参考评价区复核（2026-11-13）

- 用户明确要求联系方式必须填写：邮箱继续必填，电话/WhatsApp 改为必填，去掉 optional 标记；英/日/德同步。
- 客户端和服务端共用校验，拒绝空白、非电话号码、过短/过长号码。通过校验的号码以 `Phone / WhatsApp` 自定义字段传入现有 Sectionly JSON 询价，不更改后台字段定义或应用配置。保留原幂等请求。
- 浏览器构建预览验证：留空电话时浏览器阻止提交并聚焦电话框；填文字时显示号码错误，未产生 POST。合法号码使用本地拦截模拟断网和重试，两次 payload/operationId 一致，号码完整保留。实际配置首读暂时失败，重试后读取成功；没有将测试写入发送给应用。
- 新增服务端回归：缺失、空字符串、纯空格、文字、过短/过长号码均返回 400，且不调用询价写入接口；合法号码正常转存。全量 63/63 测试通过，lint 0 错误/2 既有警告，codegen/build 退出 0，来源暴露审计通过。构建保留原有 CLI/Rolldown 提示。
- 再次实看参考站 B20A：详情导航含 Reviews，区块紧随 More Images，展开后存在 704×700 的 Trustpilot iframe；当前正文为空白。只能确认有评价区域，不能断言商品评价数量或编造其表单。未操作参考站业务提交。
- [参考站评价区域截图](2026-11-13-reference-original-reviews-desktop.jpg)。旧本站截图保留为初版证据，其中电话 optional 标记已被本次必填修正取代。
- URL 与 sitemap 生成源未变；本轮重读生产 sitemap 索引 200/108 分片，英文 products-1 为 200、UTF-8，代表商品规范条目存在一次；全量测试含 sitemap 回归。本次代码仍未上线。
- 没有创建真实询价、草稿订单或通知，没有改 `.env`、密钥或后台配置，未 push/部署。


## 后续：三模式阶段草稿与完整目标（2026-11-13）

本轮最新需求包含三模式全部按钮后的页面与业务结果，不能仅新增三个标签就宣布完成。完整需求、参考证据、逐入口差距和实施次序并入[原接入方案](../plans/2026-11-13-reviews-b2b-integration.md#三模式完整流程方案)。未新建补充方案/QA文档。跨系统方案已请求用户确认，未建立独立后台、数据库、上传存储或新凭据。

本地阶段草稿：标题上方三模式选择；批发保留现有真实单价和购买；定制七步说明、正确类型的询价与当前SKU一件普通商品样品加购；代发货暂为咨询入口，并明确同步功能尚不可用，不满足完整目标。非批发悬浮条使用相应申请入口。英/日/德同步文案，原电话/邮箱必填和后台校验保留。

已验证：

- 新鲜 lint 0错误、2个既有脚本警告；全量63/63测试；codegen/build退出0，仍有原CLI/Router/Rolldown提示；集合筛选与构建来源暴露审计通过。Toolkit对新增组件返回“无可校验的Shopify组件”，不能当作完整类型检查。
- 专用浏览器隔离构建预览使用 localhost:3004，桌面1440×1200、手机390×844；无控制台错误。键盘ArrowRight可从Wholesale转为Dropshipping，颜色/SKU保留；定制显示7步；Custom/Dropshipping各自打开正确服务类型，邮箱电话required，Escape回到触发按钮。
- Buy sample点击在浏览器本地截住submit，验证LinesAdd仅带当前白色SKU和quantity=1，未向本站发送实际加购或订单；不把拦截当作真实订单端到端验收。参考站实际Buy Sample增加其购物车，未结账/付款；本站行为按此修正。
- 桌面和手机模式区、弹窗无横向溢出；模式按钮48px高。完整代发店铺授权、商品发布、订单同步/履约，站内附件、批量采购、自动阶梯折扣及配送报价均未完成或未验收。
- 初次切换手机模拟视口会重载页面并恢复默认模式，截图前已等待加载后重新选中并核验；截图文件按实际模式核对。

阶段草稿截图（不是完整系统验收）：

- [定制桌面](2026-11-13-purchase-modes-customization-desktop.jpg)
- [代发桌面咨询草稿](2026-11-13-purchase-modes-dropshipping-desktop.jpg)
- [批发手机](2026-11-13-purchase-modes-wholesale-mobile.jpg)
- [定制手机](2026-11-13-purchase-modes-customization-mobile.jpg)
- [定制操作手机](2026-11-13-purchase-modes-customization-actions-mobile.jpg)
- [必填联系信息弹窗手机](2026-11-13-purchase-modes-inquiry-mobile.jpg)

URL、模式参数、商品元字段和sitemap生成源未改；全量测试包含sitemap回归，既有商品条目继续核对，不伪造lastmod。本轮保留为未提交的本地阶段草稿，未push/部署；原main已有5个本地提交仍保留，其他任务的进度/发布文档与旧截图未纳入本任务。

补充核验（2026-11-14，北京时间）：日语/德语手机页面三模式、定制七步与按钮译文正常，无横向溢出。生产sitemap索引200、108分片，英文`sitemap.en.products-1.xml`为UTF-8/200，代表商品条目唯一。本地界面未发布，生产界面仍待验。

滚动入口修正（2026-11-14）：发现旧IntersectionObserver在从首屏直接跳到页尾、未跨过相交状态时可能不显示悬浮条。改为合并到动画帧的被动滚动/窗口大小监听，并在切换模式时重算；本地构建验证直接跳到底部后可见定制申请而非加购，修正后重新lint/build及来源审计。Toolkit提示的frame隐式any通过数值初始化修正，未绕过检查。

## 多规格批量购买与 Shopify 优先方案（2026-11-16）

用户已批准完整三模式方案；本轮继续在原主目录开发 Bulk Buy，不新增工作副本。用户进一步确认由自己的仓库发货，业务资料优先放 Shopify 原生资源、元字段、元对象与文件；修订方案并入原接入文档，没有创建数据库/Shopify 定义或新凭据。

### 本轮实现与验证

- 规格标题行右侧提供 Bulk Buy 按钮，与参考规格区位置对应；单一规格商品不额外显示多规格入口。原生弹窗显示真实 SKU 图片、名称、单价、独立数量、小计与合计。按需分页 50 个规格，最多一次提交 250 个不同规格，每行 1–9999。已下架/售罄规格不可选，零数量不提交。
- 新资源 `/api/product-variants` 及语言前缀版只读公开商品数据，独立于 B2B 私钥；实测 200、private/no-store、noindex/nofollow。服务器重新校验行数、重复 ID、数量及 ID 类型，只转发 ID/数量，不信任浏览器价格/selectedVariant/额外字段。Shopify 负责实际价格及库存。
- **真实购物车联调**：在独立匿名验收会话中，黑色 SKU `50063404663043` 2 件、白色 SKU `50063404695811` 3 件一次加入成功；弹窗关闭并打开购物车，两行数量分别为 2/3，当前 Shopify 单价均 USD 19.00，总计 USD 95.00。没有创建订单或结账付款。此记录只证明现有 Shopify 售价与批量购买一致，不代表自动阶梯折扣生效，也未修改商品售价。
- **失败恢复**：只读浏览器替身模拟分页第二页 503，首行输入 7 和已加载两行保留；点击重试追加第三行且首行仍为 7；恢复原 fetch 后退出，替身规格未提交到购物车。服务端测试覆盖库存调整警告、失去响应后不自动重发、错误详情不外泄。
- **视觉与键盘**：桌面 1440×1000、手机 390×844 无页面/弹窗横向溢出；Tab 从最后按钮回到关闭按钮，Escape 恢复 Bulk Buy 触发按钮。发现 Hydrogen Image 默认 inline width:100% 导致图片拉宽，已给 56×56 显式尺寸并重新截图。`2026-11-16-bulk-buy-desktop.jpg` 为发现问题时保留的初始证据，以 verified 文件为最终截图。
- **多语言**：构建预览 localhost:3004 验证日语与德语真实页面，标题、规格、单价/数量/合计、加载与操作按钮译文正常；德语手机无横向溢出。英文桌面/手机及实际购物车使用 dev3000 验证，最终版本无新增依赖。测试/代码生成运行中的开发页热更新不作为最终预览证据。
- **工程检查**：新鲜全量 69/69 测试通过；lint 0 错误、2 项既有脚本 console 警告；codegen、build 退出 0；集合筛选与构建来源暴露审计通过。CLI envFile/Router future flags/Rolldown bundle analyzer 提示仍在；codegen 不是完整全项目类型检查。相关日志保存在忽略的 `.cache/business-*-2026-11-16.log`。
- **SEO/sitemap**：商品规范 URL 未变；新资源不入 sitemap。sitemap 测试包含在 69 项内；本地预览禁止索引，索引为空符合当前配置。再次读取生产英文 products-1 子 sitemap，代表商品规范条目存在一次，未包含新资源路径。未伪造 lastmod；生产页面本轮没有更新。
- **平台只读核实**：既有 CLI 认证读回店铺为 Seine Shop / ps83if-c4.myshopify.com、Basic 非 Plus；PRODUCT 元字段定义完整读回，公开参数/评价字段可复用，来源记录保持 Storefront NONE。后台网页仍在安全验证页，已置前供用户操作。无新增认证、权限、元字段/元对象定义或后台业务写入。

本轮最新截图：

- [规格区入口桌面](2026-11-16-bulk-buy-entry-desktop.jpg)
- [批量购买桌面最终版](2026-11-16-bulk-buy-desktop-verified.jpg)
- [批量购买手机](2026-11-16-bulk-buy-mobile.jpg)

### 仍待完成

自动阶梯计价、配送报价、站内私有附件、定制报价/样品状态，以及连接客户店铺、上架/映射、订单同步/采购、仓库履约与运单回传仍需开发和联调。官方确认 Basic 不能使用包含 Functions 的单店自定义应用，公开应用的 Functions 可用于所有套餐；不能通过只改前端价格绕过。Shopify Files 官方说明用于公开访问，不将客户机密附件直接当作私有文件上传。

完整目标未标记完成。未 push、未部署、未改 .env/密钥/CI、未创建数据库或 Shopify 定义；保留已有无关修改和所有截图。开发/预览服务仅监听本机。
## 商品页运费查询与后台恢复（2026-11-16）

本轮范围：既有主目录及专用 Chrome for Testing；构建预览 localhost:3004，仅本机监听，不发布。继续沿用上述批量采购与三模式成果，没有生成真实订单/询价/通知。

- **后台**：用户完成安全验证后，实际进入本店首页和 Sectionly 设置。子页初次报应用错误，reload 后恢复。系统姓名/公司/邮箱必填；自定义字段类型仅 Text、Multi-line Text、Dropdown Select、Number，未见上传字段；通知邮箱空、MOQ=1。现有询价数 0，商家报价/付款转订单只有后台说明，尚未真实交易验证。
- **长期开发密钥**：原密钥后台 Expired/UTC 2026-11-14 到期。用户另批 365 天、server-only 与原三项权限；新 key Active/UTC 2027-11-16 到期，仅替换本机环境项、其他值逐行一致，0600/Git 忽略。复制后清空剪贴板，刷新清掉一次性明文展示；源码/客户端/服务端产物精确密钥扫描 0。真实两个只读资源和 Worker setup 均 200，未创建询价或通知。
- **Shopify 能力**：配送已配置 Standard/Fast、无 Carrier accounts，本地配送/自提关闭。折扣列表为空、创建框仅四种原生类型；Companies/Catalogs 在 Basic 可见且当前为空，新建目录进一步计价编辑要求保存，已取消，不写入公司/目录/折扣。不能据此声明阶梯价已生效。
- **实现位置**：批发购买按钮下的 More Shipping Options；弹窗带当前规格/数量，国家来自 Shopify availableCountries 与本站开放市场交集；州省对美/加/澳/日使用名称下拉，其余目的地填写城市、邮编、街道。输入通过 POST 送往独立临时 Cart，只读取固定配送选项，不改用户购物车/地址簿，不创建订单、付款或通知。响应仅含合成标识、服务名称/描述和金额，不返回地址/购物车 ID/结账 URL。
- **真实联调**：使用公开市政示例地址 200 N Spring St, Los Angeles, CA 90012（不是买家个人资料）。B-20A 黑色 1 件返回 Standard USD12/Fast USD18；6 件返回两项均 USD0，符合后台现有满额免运费设置。估算前后原购物车仍 5 件。此处仅验证固定报价，不包含承运商计算、时效保证、其他购物车商品或完整结账结果。
- **语言与币种**：最终构建预览英日德表单/国家列表正常；日德页面均无控制台警告/错误、无横向溢出。日本公开市政示例地址（JP-13/Shinjuku/1638001）真实返回 Standard JPY1946/Fast JPY2918，币种来自 Shopify 的目的地上下文，不使用前台换算。
- **错误与交互**：改变地址即时清空报价；本地拦截一次 503 后保留城市/地址等输入，显示重试提示；恢复 fetch 后真实重试返回报价。无配送、数字商品、库存调整、超量/跨站/无 CSRF、超大请求等由服务端行为测试覆盖。Tab 从末尾返回关闭按钮，Escape 关闭并恢复原入口焦点；390×844 页面和弹窗无横向溢出，结果可内滚动查看，1440×1000 桌面双列。语言/数量/规格变化清空旧结果，语言切换重新读取配置。
- **验证**：全量 Node 测试 74/74，lint 0 错误/2 既有脚本警告，codegen/build exit0，集合筛选与构建来源审计通过；CLI 既有 envFile/Router future/Rolldown 分析提示仍存在。dev 的既有 nonce hydration 警告没有作为构建预览通过依据；最终浏览器在构建预览检查。
- **SEO**：商品地址未改，复用现有动态 sitemap 源，不伪造 lastmod。local `/sitemap.xml` 200/UTF-8、索引关闭时为空；生产索引 200/UTF-8，英日德 `products-1` 中代表商品规范地址各 1 次，未含 shipping API。线上核对只证明原地址保留，不代表功能发布。

本机截图：[运费入口桌面](2026-11-16-shipping-entry-desktop.jpg)、[真实费用弹窗桌面](2026-11-16-shipping-desktop.jpg)、[手机表单](2026-11-16-shipping-mobile.jpg)、[手机费用结果](2026-11-16-shipping-mobile-results.jpg)。后台含密钥页面不截图。未 push/部署，完整代发、阶梯价及私有附件仍待实施。

用户要求圈出入口后，新增[运费入口红圈放大图](2026-11-16-shipping-entry-annotated.png)：从上述桌面原图裁切放大，红圈和箭头指向绿色 Buy now 按钮下方右侧的 More Shipping Options。已视觉检查按钮、入口和红圈对应，保留未标注原图；此图为本地预览，不代表正式站已上线。仅改文档与标注图，验证 UTF-8、相对链接与 `git diff --check`，不重复运行前台构建。

## 运费命名更新与开发店草稿导入（2026-11-16）

用户认为原运费命名不准确并要求继续开发，随后明确批准测试应用、本机配置及私有映射定义。本轮沿用主目录和既有方案；只写开发测试店的一个草稿，不发布商品，不创建订单，不改正式店业务数据。

- **运费入口**：更名 Estimate shipping；日语「送料を見積もる」、德语「Versandkosten berechnen」。保留在批发购买按钮下，动作与填写目的地后估算运费一致。顺带修正未知异常类型的安全处理，配置读取明确传 null、长度上限显式转数值；2026-04 Hydrogen 校验成功。首次默认版本校验选错 2026-10、第二次暴露静态类型问题均留在本机日志，最终以指定版本修复后的成功结果为准。
- **最终浏览器验收**：新构建、本机 loopback3005、专用 Chrome for Testing 隔离会话；英文桌面 1440×1100、英日德手机 390×844 无横向溢出和控制台 error/warn。实际重新打开表单，使用此前美国公开市政示例地址，黑色 1 件返回 Standard USD12 / Fast USD18，购物车仍 0 件；Escape 关闭并恢复焦点到 Estimate shipping。没有结账或真实个人资料。
- **测试应用**：CLI 初始化独立应用，官方 SDK 15.1.1；dev preview 仅装测试店，client credentials grant 自动取得临时管理 token、仅内存保存。已授权的三个本机环境项不进入提交，未轮换其他项；Secret 剪贴板已清空。这里只支持同组织开发店，没有客户店 OAuth，也没有网站代发工作台。
- **定义→写入→读回**：TOML 定义 Product app.source_id（id/unique）、Variant app.source_id（单行文本）、私有 product_mapping 元对象。三者 Storefront NONE 已读回。实测 unique 单行文本不能用于 customId，修正空定义为官方 id 类型后查询及创建成功；源公开目录读取改用既有服务端私有 Storefront token，与官方 SDK 的请求头一致，没有创建或修改源凭据。
- **真实商品链路**：B20A 源 9764421861635 → 测试店草稿 15524635443473。黑/白两个规格均 USD19，SKU/选项/对应图片核对一致，两张媒体 READY。库存合计0、各规格0、tracked=true/DENY，状态 DRAFT、publishedAt=null；后台明确 This product is not published anywhere。私有映射字段完整读回。同一工具再次 --apply 返回 reused/同一商品 ID，没有第二次建品或更新商品。--verify 返回 verified=true/failures=[]。
- **恢复与边界**：默认只读计划，写入必须 --apply，核对必须单独 --verify。只挑公开字段，不复制内部来源/标签/库存数量；币种不符、分页不全、重复规格/选项、非 Shopify HTTPS 图片均拒绝。创建丢失响应不自动重试，显式重试先查唯一 ID；映射保存失败可恢复；冲突或商家改价/改状态只报告，不覆盖。
- **检查**：最终全量82/82 Node测试通过，lint 0错误/2既有脚本警告，codegen/build exit0，集合筛选与构建来源审计通过；配置 validate 成功，全部生成 GraphQL（含核对查询）通过2026-04 schema校验。源码、文档及客户端/服务端构建共294文件针对7项实际密钥/凭据值精确扫描，0匹配；.env 0600/Git忽略，依赖与CLI本地会话忽略。既有 envFile/React Router future flags/Rolldown 分析提示保留，没有绕过检查。
- **SEO**：没有新增公开路由，既有 sitemap 生成源与 canonical 商品路径不改。local /sitemap.xml 200/UTF-8、禁索引时0子图；生产索引200/UTF-8，英日德 products 子图代表商品地址各1次，没有 shipping API/代发私有地址。不伪造lastmod，生产读取仅证明原地址保留，不代表新功能已发布。

新截图（均非正式站发布）：[英文桌面原图](2026-11-16-shipping-estimate-entry-desktop.jpg)、[红圈放大图](2026-11-16-shipping-estimate-entry-annotated.png)、[英文手机](2026-11-16-shipping-estimate-entry-mobile.jpg)、[日语手机](2026-11-16-shipping-estimate-entry-jp.jpg)、[德语手机](2026-11-16-shipping-estimate-entry-de.jpg)、[测试店草稿后台](2026-11-16-dropship-draft-admin.jpg)。旧命名截图保留为历史证据。

完整目标仍未完成：独立客户店连接与网站工作台、订单采购/履约运单回传、自动阶梯价、私有询价附件需继续。没有push/生产部署；无关发布方案、进度文件及旧截图保持原状，没有新增工作副本或删除任何文件。

## 代发工作台与私有服务（2026-11-16）

- **入口与页面**：商品页 Dropshipping 模式新增绿色 Open dropshipping workspace，咨询保留为次入口；账户菜单也可进入。当前商品带到工作台，表单填写本站商品链接，不要求客户理解商品handle。连接/商品/订单三个区域，未登录不能导入；订单区域明确尚未同步。英文桌面1440×1000、日德手机390×844检查，均无横向溢出，按钮/输入框至少44px；修复全局form最大400px及input盒模型对新页面的影响。截图为真实未登录状态，不含演示订单或伪造连接。
- **访问与恢复**：Customer Account服务端读取自己的ID；浏览器tenant/token被忽略。登录返回白名单仅允许本地化工作台及商品参数，修复稳定授权回调丢失日德前缀的问题。服务桥请求签名覆盖租户、时间、nonce、方法、路径和原始body；测试拒绝篡改/重放/过期/Host重绑定，限制请求大小。会话按租户/店铺加密，断开后不可再用；刷新令牌不能重新激活已断开的连接。显式重试查询现有草稿，防重复并发和旧任务覆盖新任务状态。
- **授权与实际平台读回**：用户明确同意本次两定义及本机地址。现有app dev预览自动应用SHOP connection_vault/order_ledger，真实只读API返回json/NONE，值尚未写入。CLI配置校验valid=true/issues=[]。本机仅新增DROPSHIP_SERVICE_URL，原.env字节保留、0600/Git忽略。Node3460只监听127.0.0.1；签名只读请求返回200/空连接与任务，没有记录受控测试身份。原B20A草稿再次--verify通过（2规格/2READY图片/0库存/DRAFT），未进行本轮商品写入。
- **订单基础**：纯函数与查询准备完成，检查PAID/未取消、完整分页、稳定规格映射、未发数量、币种和订单快照；仓库资格必须另外核对本站采购已付、关联ID与数量，已部分履约采购也不自动再次放行。3组行为测试覆盖拒绝场景。没有启用订单读取权限或实际采购、仓库任务、履约操作，不能据此宣称订单同步已完成。
- **登录联调缺口**：开发工具账号过期后用户已重新登录。Customer Account的localhost3006回调被拒（redirect_uri mismatch），本机dev3000显示官方需customer-account-push/临时HTTPS测试地址。已单独请求官方临时测试链接授权，尚未获回复；未开启公开通道，也未修改正式店后台回调。真实客户登录、连接保存和网页导入写入待继续，SDK begin/callback cookie保护仅在本机行为测试完成。
- **检查**：98/98全量测试；lint0错误/2既有脚本警告；codegen/build、集合筛选及来源暴露审计通过。新增Admin/Customer GraphQL按2026-04校验；Hydrogen组件工具报告无适用Shopify组件，不把此输出当作全项目类型检查。构建保留envFile/future flags/Rolldown分析器提示。
- **键盘与浏览器提示**：商品页工作台链接具有可见焦点，Enter可进入并保留商品参数；本机dev控制台仍有已有的根文档script nonce hydration提示，未通过忽略标记掩盖，不将开发模式控制台记为全清。工作台所需真实登录联调仍按上项限制处理。
- **提交前审查**：源码/文档及客户端和服务端构建共390文件，针对本机6项实际敏感值精确扫描，0匹配；7个相关Markdown的UTF-8和90个相对链接检查通过。无关旧发布方案、进度与旧截图保留在工作区，不纳入本轮提交。
- **SEO与响应**：工作台文档、数据/API均private/no-store/noindex；实际本机文档头为private,no-store/noindex,nofollow，三语言正文正常，canonical不带商品参数。工作台不加入既有STATIC_PAGES；启用索引的sitemap行为测试明确排除工作台/API。本机/sitemap.xml为200/UTF-8/禁索引0子图，pages分图404与当前索引关闭一致。没有新增可索引地址、路径迁移或伪造lastmod，没有发布线上。

新证据：[商品页原图](2026-11-16-dropship-workspace-entry-desktop.jpg)、[入口红圈](2026-11-16-dropship-workspace-entry-annotated.png)、[工作台桌面](2026-11-16-dropship-workspace-desktop.jpg)、[日语手机](2026-11-16-dropship-workspace-ja-mobile.jpg)、[德语手机](2026-11-16-dropship-workspace-de-mobile.jpg)。原图保留，圈图只增加标记。外部客户OAuth、真实订单/履约、自动阶梯价及私有附件仍未完成；未push/部署。

## 临时 HTTPS 客户登录联调（2026-11-16）

- 用户明确允许本次官方临时测试链接；开发者登录与网站客户登录分开处理。第一次与命令级代理重试均在官方连接组件下载阶段超时；随后通过已有代理下载CLI指定的官方cloudflared 2024.8.2到忽略的 `.cache/tooling/cloudflared/`，不安装全局工具、不改系统配置、不删除文件。用CLI原生路径参数复用该组件，官方临时预览启动成功。
- Vite原来只允许tryhydrogen域名，但官方重命名入口实际转发Host为trycloudflare；加入官方底层域名后实测工作台可打开。只在开发构建允许官方HTTPS预览调用本机HTTP回环代发服务；生产、伪装后缀和远程HTTP地址仍拒绝，行为测试覆盖。
- 未登录页面已显示开发预览/仅指定测试店/草稿不发布提示，英文桌面1280px无横向溢出。真实点击登录进入「Sign in - Seine Shop」客户邮箱页；用户完成登录后实际返回含原商品参数的工作台，服务端客户身份读取成功。
- 首次连接因403被阻止：受控诊断仅记录协议/域名与布尔校验结果，确认请求URL为HTTP而浏览器Origin为HTTPS，CSRF/访客均正确；诊断已移除。根因在官方代理终止TLS，本机请求仍HTTP。仅开发构建在精确官方域名且转发协议为HTTPS时，先规范化请求URL再创建会话/执行路由，保留完整同源与CSRF校验；新增请求体/方法/请求头保留和生产/伪造域名不生效测试。重载后真实连接指定测试店成功，页面显示Connected · Development connection。
- 真实网页导入B20A成功、历史Completed；View imported products显示1商品/2规格/USD。私有字段真实读回1个加密连接与1个completed任务，结果reused/目标15524635443473，与原草稿一致。独立--verify再次通过，仍DRAFT、未发布、2规格、2READY图片、库存0；没有新商品/库存写入或真实订单。重载后连接/历史保留；[已连接桌面截图](2026-11-16-dropship-workspace-connected-desktop.jpg)仅截工作台，不含客户身份/凭据。日德390×844实际已登录页面无横向溢出；正文与已完成状态译文正常。
- 已登录文档200/private,no-store/noindex,nofollow；只接受POST的API之GET返回405，无JSON正文符合实现。一次把GET当JSON的验收读取报错已纠正，没有修改API契约。错误CSRF的真实POST返回403/forbidden且不写入。最终生产包中请求规范化和桥接调用的开发参数均为false。
- 最终全量99/99行为测试与lint（0错误、2既有脚本警告）、codegen/build、集合筛选与--built来源审计通过。Toolkit按Hydrogen2026-04检查页面，无适用Shopify组件，不能充当完整类型验收；既有nonce hydration、envFile/Router/Rolldown提示保留。本轮无GraphQL变更。256文件/6项实际敏感值精确扫描0匹配；不含私有状态值或客户ID。
- 已正常终止本轮3007开发预览，对应监听及连接进程均消失；独立3460继续仅本机监听。官方授权端点相同临时回调在关闭前200、退出清理后400且redirect_uri mismatch，确认临时回调清理。未关闭用户浏览器或清除登录资料。无生产发布/外部店OAuth/订单同步验收，未push或部署。

## 未推送功能补验（2026-11-16，16:27 北京时间起）

用户要求每个功能先验证，验证通过后下一步询问是否推送；已先并入根规则和 Git 工作流。本轮复用主目录，远程核对仍为 origin/main 46182bd、本地 9ece6bc，领先10个提交；不把本地完成等同上线。

| 功能 | 本轮新增证据 | 当前边界 |
| --- | --- | --- |
| 商品评价 | 新构建真实读取 ready / 0条；5星筛选200，page=0、rating=6各400；合法会话提交txt附件400/media，错误CSRF 403/forbidden | 后台读到手动发布；真实评价保存、图片上传/展示代理仍待获准测试 |
| 在线询价 | 新构建配置200、MOQ=1；合法会话/其他合法字段、空电话的POST返回400/phone；后台通知邮箱仍空 | 真实保存、异步草稿订单与后台读回仍待获准测试；不主动发通知 |
| 三种采购模式 | 实际切换Dropshipping显示含原商品参数的工作台链接；Customization显示7步与样品按钮；390×844实际viewport=390、无横向溢出 | 只是已实现的页面及动作，不代表完整定制/代发交易已完成 |
| Buy sample | 新构建实际点击后，Shopify购物车读回黑色×1、USD19；未进入结账 | 普通商品样品加购，不是定制样品报价/生产 |
| Bulk Buy、Estimate shipping | 相关行为测试本轮通过；真实多行购物车和USD/JPY配送证据见本文件既有章节，代码未改，不把模拟测试重新称为真实联调 | 固定配送估算，不是承运商实时报价；自动阶梯价未实现 |
| 代发工作台与草稿 | 英/jp/de工作台均200/private,no-store/noindex,nofollow；API的GET为405；再次独立--verify返回verified=true/failures=[]，DRAFT/库存0/2规格/2张READY图片 | 已登录网页链路沿用上节真实证据；本轮未重开临时通道；外部OAuth及订单/仓库履约/运单回传尚未实现 |

- 本轮全量99/99测试通过（0失败/跳过）、lint 0错误/2既有脚本console警告、codegen/build退出0、集合筛选与构建来源审计通过。保留envFile/Router未来选项、transformWithEsbuild弃用和Rolldown分析器/metafile提示；不称全项目类型检查或控制台全清。
- 旧3005预览只包含较早构建，探测工作台返回404；未据此改业务代码。新构建使用本机3008，已核对仅127.0.0.1/[::1]监听，三语言工作台正常。样品点击后的第一次立即读取早于加购完成，随后等待实际结果读回黑色1件；不把首次瞬时空购物车作为最终结果。
- 只读新构建sitemap为200/application/xml; charset=utf-8，禁索引时未含工作台/API；没有新增URL或修改生成源。预期的GET405和拒绝输入400/403会产生资源控制台错误，单独记录，不能当作无关运行报错，也不掩盖。
- 已通过聊天单独请求最小真实测试：一条明确内部测试的未发布评价/一张测试图，以及一条测试询价及一张自动生成的未付款草稿；本记录写入时尚未获回复，未执行这些写入。审核后公开评价会影响真实评分，本轮不申请公开。
- 完整目标中仍未实现的独立客户店OAuth、订单采购/仓库履约/运单回传、自动阶梯价及站内私有询价附件，属于开发待办，不能列为“已完成、仅待验”。未push、未部署，原有无关发布方案/进度资料/旧截图继续保留。
- 本轮候选源码/文档/构建共216文件针对本机6项实际敏感值精确扫描0匹配；4份修改文档严格UTF-8解码、87个相对链接检查通过，git diff --check通过。未修改.env/凭据/应用设置，没有删除文件。

### 已获准的两项真实内部测试与自主执行规则调整

- 用户明确允许两项内部测试，并要求今后常规测试不要逐项停下来询问。先检查并修改根规则、工程/Git流程和业务工具规则，允许最小内部测试直接执行，保留push、发布、删除、凭据/权限/数据定义等明确边界；历史授权记录不覆盖为现行政策。
- 本轮计划只创建：B20A一条3星、1张自制Internal QA图片、明确“内部接口测试、非买家评价”的未发布评价；B20A黑色1件询价，姓名/公司Seine Shop Internal QA、邮箱qa@seineshop.example、电话+1 202-555-0123，备注“内部测试，请勿联系、收费或发货”。允许应用自动创建一张未付款草稿并读回，不主动发邮件、不付款/收费/发货、不删除记录。测试前重新读到后台手动发布和通知邮箱空白，均不修改。
- 图片仅用于测试，生成物保存在Git忽略的.cache/internal-qa-review-upload-2026-11-16.png，不进入public；提交只执行一次，未知结果先后台读回，不自动重复提交。
- 真实评价上传和提交各200，后台出现1条Internal QA/3星/Unpublished，正文及1张640px测试图保存并可读；公开列表仍0条/平均0。仅图片代理使用限时签名做独立读回，不发布评价：初次本机Worker出站直连CDN超时503，Node经现有代理执行同一loader200；用命令级NODE_USE_ENV_PROXY/HTTP(S)_PROXY重启回环3008后真实资源路由200/image/png/private,no-store，15377字节与原图SHA256相同。没有改.env或业务安全策略。
- 真实询价首次400；相同失败请求的受控上游诊断返回Product title is required。修复服务端只转发Shopify实际title，不接受浏览器标题；回归先复现400!=201，再修复通过。新构建网页返回201，后台仅1条cmwj2k15400faqx3ga9qpk3rl，Black/6630000794A/1件、公司/电话/备注均读回一致；自动草稿因Email contains an invalid domain name失败，未形成订单。qa@seineshop.example由本次测试方案选取，Shopify不接受该保留顶级域，并非真实客户资料故障。
- 按用户新自主测试约定，使用qa@example.com（IANA保留示例域名）补一条最小询价以验证草稿；原记录后台邮箱只读，不删除、不改写历史。后续测试仍无通知、付款或履约，旧失败记录保留；不为修改内部测试占位邮箱再次停下来询问。
- 补测网页201，询价cmwj2n21500fmqx3gqmtw5kfv；应用后台自动链接原生草稿#D1（1381027840259）。原生后台读到Black/6630000794A/数量1/单价与合计USD19，完整内部测试备注及电话，公司信息在备注中；时间线仅应用创建草稿，无付款或发票发送操作。应用自动关联测试公司/联系人，原生客户显示qa@example.com/No orders；没有实际订单、地址或履约。保留2条测试询价（首条因示例邮箱域名失败）和1张未付款草稿，不删除。
- 用同一成功请求的operationId和逐字相同payload在网页资源接口显式重放，仍201/同一询价ID；不再次手动建草稿。公开评价仍0条/平均0，内部测试评价不进入商品公开HTML或AggregateRating。
- 修复后99/99全量测试、lint 0错误/2既有警告、codegen/build、集合筛选、构建来源审计通过。Toolkit2026-04独立源码检查报告17条通用类型诊断；对修复前HEAD同一模块执行基线检查，诊断逐项相同（JS类属性/默认选项推断、FormData联合类型、Node duplex与DOM类型差异），本轮没有新增诊断。不把该检查记为通过，也没有添加忽略或扩大为全模块类型重构。
- 推送前只读检查Oxygen deployments：当前仍显示Connect GitHub，未连接自动部署仓库；没有GitHub Actions目录。生产Current仍865d945/物流路径迁移，本轮不部署、不连接仓库。正式通知/付款及测试评价公开发布均未执行，不以这次内部测试宣称完整代发/定制交易已完成。

## Oxygen Production 发布验收（2026-11-16）

- 用户批准12个既有提交推送及主站部署；推送前fetch无并发提交，push后`ls-remote`确认`origin/main=1aa4e07ad772dda9a93bdab95d1fb31902ab66d5`。保留原未提交发布方案、进度文档及旧截图，没有纳入本次提交。发布候选重新通过99/99测试、lint（0错误/2既有警告）、codegen/build、集合筛选、构建来源暴露审计、diff检查；213个候选及构建文件针对本机实际敏感值扫描0匹配，Markdown严格UTF-8解码通过。保留原构建弃用/分析器提示，不宣称全项目类型检查或控制台全清。
- 用户另行批准两项现有服务端密钥配置到Oxygen Production。`CUSTOMERSSAY_SECRET_KEY`与`SECTIONLY_B2B_PRIVATE_KEY`均设Secret，最终仅Production；没有上传整份.env或代发测试配置，不记录密钥值。Oxygen仓库设置仍未连接GitHub自动部署；本次使用现有官方CLI手动部署。
- 命令为`shopify hydrogen deploy --env production --no-json-output --force --metadata-description "Reviews, B2B inquiries, purchase modes, bulk buying and shipping estimates; source 1aa4e07"`；`--force`仅允许保留既有不参与构建的文档/截图改动，不是强推或跳过平台验证。没有使用`--env-file`、`--no-verify`或客户端源码映射。官方CLI完成上传、部署与可路由验证并退出0。
- 后台[部署详情](https://admin.shopify.com/store/ps83if-c4/hydrogen/1000183956/deployments/5746750)：Deployment ID `6129563`，2026-11-16 18:37 GMT+8，Production/main/`1aa4e07`，Ready/Current，bundle 1.49 MB，worker startup 5 ms。实际部署URL为`https://01m7hyxfx2bgyeg4hnzhd8hzdk-d7e83d6aec4307f1a21e.myshopify.dev`。以下检查直接使用正式域名`https://www.seineshop.com`。

| 范围 | 正式站实测 | 边界 |
| --- | --- | --- |
| 评价 | 公开读取200/ready、0条/平均0；设置200；写评价弹窗正常加载、照片控件存在；公开页面无Internal QA | 上节真实上传/未发布评价证据保留，本轮不重复创建或公开测试评分 |
| 询价 | 配置200/MOQ=1；实际弹窗加载完成，需求、邮箱、电话、姓名、公司均required；Escape关闭 | 上节真实保存/异步草稿及幂等证据保留，本轮不额外造单 |
| Bulk Buy | 前台黑2/白3加购；正式购物车读回两行、5件、USD38+57=95；结账链接为本店myshopify.com | 未点击付款、未创建订单；验收记录不保存购物车密钥或结账私有URL |
| Estimate shipping | 真实API查询黑1、美国公开示例地址；200，Standard USD12/Fast USD18，private/no-store；之后购物车仍5件 | 仅Shopify现有固定报价，不是承运商实时报价 |
| 三模式/多语言 | 英文三模式；日语390px切换Dropshipping出现带原商品参数的工作台入口；德语390px切换Customization显示7步、询价/样品按钮；无横向溢出 | 自动阶梯价和完整定制生产流程未完成 |
| 私有工作台 | 英/jp/de均200/private/no-store/noindex；未登录显示登录入口、导入按钮禁用；无CSRF的POST为403/forbidden | 仅页面代码上线，正式环境未接本机Node服务/测试店凭据；外部OAuth与订单业务未开放 |
| 17TRACK | 既有`/page/order-tracking`200，手机无溢出；空输入真实点击显示校验，未请求供应商 | 无真实履约运单，未验证实际运输事件或承运商结果 |
| SEO/编码 | 英/jp/de自指canonical、en/ja/de/x-default正确；robots/llms/sitemap/static XML的真实Content-Type含charset=utf-8；全部114分片200，23967规范URL快照，无工作台/API；浏览器sitemap管理页中文/日本語/Deutsch与特殊符号、llms原文正常 | 动态商品数量是当时快照，不代表搜索引擎已收录；未伪造lastmod |

- 正式询价弹窗、正式评价入口、正式德语手机定制模式三张截图均已打开核对；询价截图等待配置加载完成，不使用瞬时Loading画面作为最终证据。用户随后要求撤回这三张图片，已改为仅在本机留存；本记录保留文字验收结果，图片不作为后续视觉风格的规范。
- 正式站原有Shopify Analytics/consent组件报告`PUBLIC_CHECKOUT_DOMAIN`缺失；生产原无此变量，根源码读取未在本批修改。用户随后明确确认仅Production补`ps83if-c4.myshopify.com`并重部署，变量已保存并读回仅Production。再次部署退出0、后台资源5749637、Production/main/813e4b6、Ready/Current；新地址为`https://01m7jd1bn3nq8ea83btyj00ttb-d7e83d6aec4307f1a21e.myshopify.dev`。业务源码与1aa4e07一致，没有上传本机.env或修改其他配置。22:46北京时间，正式商品页强刷后控制台无error/warn，customerPrivacy API存在；评价/询价/运费均200，robots/llms/sitemap/static XML均200/charset=utf-8。重新执行99/99测试及构建来源审计通过；不以此声称已验证统计平台入库或转化归因。未付款、发货、公开测试评价或部署独立测试应用。
- 发布后的验收记录与三张截图经用户确认保存为813e4b6并推送；用户随后明确要求撤回三张图片。本次以新提交从仓库当前版本取消跟踪，本机文件保留，不改写历史。同步移除图片链接，保留文字验收记录。没有新工作副本。
