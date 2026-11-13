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
