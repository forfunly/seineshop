# 客户资料、订阅与订单归属验收

日期：2026-11-17（北京时间）。范围：原生客户账户资料、邮件营销偏好及托管结账账户关联。本文件归属本功能验收，后续补验继续维护本文件；截图默认本机保留，不自动清理或提交。

## 基线与实施

- 本轮通过现有本机代理执行命令级 fetch 成功，HEAD 与 origin/main 同为 `9b558a3`；无远程新增或本地独有提交。未改 Git 全局设置。直连 fetch 超时，不作为同步证据。
- 复用唯一主目录；保留此前三份规则修改、原分析 QA 和两张本机截图，不混入本功能提交。
- 账户页显示真实邮箱、订阅状态，资料保存与营销偏好使用独立意图；认证身份由 Customer Account 会话决定，客户端客户 ID/邮箱/令牌不参与授权。订阅不是登录副作用。
- 姓名去除两端空白，允许单字及清空可选姓名，限制255字符及控制字符；检查 GraphQL 和业务错误，修改后读回核验客户身份及目标状态。PENDING 单独显示，重复已满足的设置不重复写入；网络不确定不自动重试。
- Shopify 仍为唯一客户和订单来源；资料和营销不需要新增 Admin 密钥、数据库或权限配置。若真实账户返回权限错误，须先核实具体缺口，不能把代码结构校验当作实际权限通过。
- 地址提交补同源检查；所有语言账户页面及 `.data` 响应禁止共享缓存并禁止索引。订单详情非法编码/ID或无此订单为404，接口故障为503，仍由 Customer Account API 限制订单归属。
- 普通购物车结账前刷新已登录客户身份并采用新 checkoutUrl；关联失败不继续访客结账。Buy now 沿用已核对 Hydrogen 2026.4.7 的 cart.create 自动服务端身份合并，不信任客户端身份。

## 已执行验证

- Shopify AI Toolkit Customer API 2026-04：CustomerDetails、CustomerUpdate、订阅、退订四份查询/变更均 VALID；官方订阅接口说明见[customerEmailMarketingSubscribe](https://shopify.dev/docs/api/customer/2026-04/mutations/customerEmailMarketingSubscribe)及[邮箱状态](https://shopify.dev/docs/api/customer/2026-04/objects/CustomerEmailAddress)。
- 全量 `node --test tests/*.test.mjs`：145/145通过。新回归覆盖登录与同源拒绝、身份注入不生效、姓名清空/单字、订阅/退订/PENDING、幂等设置、私有响应、业务/网络错误及读回不一致；结账回归覆盖服务端客户身份、采用刷新URL、关联失败阻断、访客购买不受影响。
- `npm run lint`：0错误、2条既有审计脚本 console 警告；`npm run codegen`（包含独立 React Router typegen）通过，`npm run build`退出0。保留原 envFile、React Router未来选项及bundle analyzer提示，不视为全项目类型检查通过。
- 集合筛选与构建来源暴露审计通过。账户页面为原有私有地址，不新增可索引URL；sitemap回归包含在全量测试中，未修改生成源或伪造lastmod。
- 本机 `npm run dev -- --port 3000` 启动，实际仅监听 `[::1]:3000`。浏览器与HTTP检查：英/jp/de账户资料及订单页均被官方OAuth开发限制拒绝，400，响应为 `private, no-store` 和 `noindex, nofollow`，不以此宣称登录后页面验收通过。

## 首次检查与验证边界（后续结果见下方补验）

- 检查任务中后台只读确认：客户时间线有 Hydrogen 创建和首次登录记录；正式订单为空；询价草稿 #D1、USD19、Open仍存在。该证据不等于本轮新功能上线或已付款交易完成。
- Shopify明确要求本机客户OAuth使用 `--customer-account-push` 的官方临时HTTPS域名。用户已明确回复「允许本次临时预览并配合测试登录」；仅本轮官方临时HTTPS登录测试获准，准备开启并在结束时清理临时回调，不改生产配置。
- 允许后最小内部测试：仅专用测试客户，记录初始姓名/营销状态；保存标注Internal QA的姓名并前后台读回，验证地址保存；在确认测试通知副作用可接受后验证订阅/退订并读回后台。测试保留记录，不删除客户/地址或业务资料，不对真实买家发营销邮件。
- 正式订单与客户账户的端到端验收仍未完成。不得用草稿单或模拟事件代替正式订单；不擅自改变正式店支付模式、付款、收费或发货。需要另行明确可用测试店及测试支付范围后，再验订单后台与账户列表归属。
- 本轮未push、未部署，所有新功能为本地候选；真实登录后的桌面/手机及语言结果见下方补验。

## 官方登录页现场观察

- 已在本次获准的官方临时域名打开真实 Shopify 登录表单。该表单自带“Email me with news and offers”，现场默认勾选；已提醒用户本轮先取消勾选再用专用测试邮箱登录。客户账户代码本身不因登录或资料修改发起订阅，但不能将此表述为托管登录表单永远不收集营销同意。未修改正式店登录设置。
- Toolkit独立JSX验证器三次将账户Outlet上下文判断为unknown；已添加与实际Outlet契约一致的JSDoc类型，仍未消除该独立工具诊断。GraphQL四份校验、项目构建和路由生成通过，不把该工具结果记为全项目类型通过。

## 已授权真实登录补验（进行中）

- 用户已完成本次官方临时链接登录，实际账户页200并读到原有测试登录客户；初始姓名两项为空、营销状态SUBSCRIBED。仅记录状态，不公开邮箱/客户ID。将保存Internal QA标记姓名并后台读回，随后恢复初始姓名；退订后恢复原订阅状态。地址如创建，仅使用明确Internal QA/公开示例地址，不删除记录、不创建订单、不付款或发货。

### 真实读回结果

- 姓名保存为Internal QA / Account Test：前台显示保存成功，后台客户标题与时间线读到Hydrogen添加两项姓名；随后从前台清空恢复初始值，后台时间线确认移除本次测试姓名。未删除客户或历史。
- 前台退订显示Not subscribed，后台Customers对应行显示Unsubscribed；前台重新订阅后显示Subscribed，后台同一行Subscribed，已恢复初始状态。未主动发送营销活动或报价邮件。
- 地址页新增1条Internal QA Do Not Ship / Seine Shop Internal QA，使用Shopify公开办公示例地址150 Elgin Street, Ottawa, ON, K2P 1L4, CA，address2为Internal QA - do not ship；前台Existing addresses和后台Default address逐项读回一致。未下单、付款、发货。Shopify自动将首个地址设为默认，已告知用户，测试地址保留；删除须另获授权。
- 已登录日语与德语账户资料页200，实际390px设备视口下document.scrollWidth等于innerWidth=390；日语全页截图人工检查文字、输入框、按钮与换行正常。桌面德语页面人工检查通过。此前resize仅调整窗口未实际变为手机视口，改为设备emulate后重新核对，不将早期宽屏截图当手机验证。

- 结账身份补验范围：同一已登录测试客户，仅B20A Black 1件/USD19加购并进入托管结账核对客户识别；不提交订单、不付款、不发货。保留本次测试购物车，不删除；不把进入结账当作正式订单完成。

### 登录客户结账与隐私验证

- B20A黑色1件加购、购物车USD19；通过本次修改的saved-cart checkout实际进入Shopify托管结账，识别同一已登录客户邮箱及Internal QA示例地址，未出现访客邮箱输入流程。加拿大地址使托管结账按当地市场显示CAD，未据此前台USD宣称两者同币种；未改价格、运费或支付设置。
- 停在支付信息为空的结账页，未选择快捷付款、填写卡号或点击Pay now。返回前台账户订单列表为空，后台Orders也为空；这验证身份传递及空订单展示，不验证已付款订单创建/归属。保留1件测试购物车；可能产生Shopify原生未完成结账记录，不等同草稿单。
- 已登录资料页实际GET200，Cache-Control为private,no-store，X-Robots-Tag包含noindex/nofollow（代理重复附加none，不影响禁止索引）。
- 独立JSX工具第三次仍返回Outlet未知类型，保留限制；实际页面及操作通过。开发预览仍出现原有hydration/nonce相关提示，功能可交互，不宣称控制台零错误；未通过注释、忽略或绕过解决。
- 本轮新建的页面12/15已关闭；其他任务页面保留，浏览器未关闭。官方临时预览通过正常Ctrl+C退出，同一OAuth回调检查从清理前200变为清理后400/redirect_uri mismatch，3000监听消失，确认临时回调已清理。

## 本次提交候选范围

客户账户与本会话此前补充的项目规则，共21文件；不包含原分析QA的并行补充或两张历史截图。候选目标origin/main；push与生产部署仍分别等待本次授权。

- 规则/记录：`AGENTS.md`、`README.md`、`RELEASE-NOTES.md`、`docs/rules/engineering.md`、`docs/rules/seo.md`、`docs/project-state.md`、本验收文档。
- 客户：`app/graphql/customer-account/CustomerDetailsQuery.js`、`CustomerMarketingMutations.js`（同目录）、`app/lib/customer-profile.server.js`、`app/routes/account.profile.jsx`、`app/routes/account.addresses.jsx`、`customer-accountapi.generated.d.ts`。
- 结账/订单：`app/lib/checkout.server.js`、`app/routes/checkout.jsx`、`app/routes/account.orders.$id.jsx`、`server.js`。
- 文案/样式/测试：`app/locales/messages.json`、`app/styles/app.css`、`tests/customer-profile.test.mjs`、`tests/checkout.test.mjs`。
