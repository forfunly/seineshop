# 客户资料、订阅与订单归属验收

日期：2026-11-17（北京时间）。范围：原生客户账户资料、邮件营销偏好及托管结账账户关联。本文件归属本功能验收，后续补验继续维护本文件；截图默认本机保留，不自动清理或提交。

## 后续补验范围（2026-11-18）

- 用户要求继续处理剩余项；本轮复用主目录，fetch确认HEAD/origin/main无差异，保留既有发布记录、分析QA及截图。
- 正式站已有有效客户登录态。计划以当前页面实际姓名与营销状态为基线，最小修改标注QA的姓名后恢复、退订后恢复初始订阅，读回结果；只读取现有地址及订单，不新增地址、不删除测试数据，不付款、不发货、不改支付模式。可能产生Shopify客户时间线及专用测试邮箱订阅通知。
- 错误页修复归属现有SiteSeo组件与SEO规则；错误响应和无根配置时仅输出错误标题/noindex，避免本机canonical。错误页不加入sitemap，不更改可索引URL或lastmod。修复与记录先本地验证，新的push和生产部署另行确认。

### 本轮完成证据

- 正式站复用现有登录态，实际初始姓名Internal QA / Do Not Ship、营销Subscribed。仅将末名改为Do Not Ship QA，前台成功提示及独立GET读回一致，再恢复Do Not Ship；Shopify客户时间线明确记录两次Hydrogen修改。该初始姓名与此前预览结束不同，以现场读回为基线，不擅自恢复为空。
- 前台退订成功，独立GET读到Not subscribed，后台客户列表为Unsubscribed；随后重新订阅恢复Subscribed，独立GET及刷新后台客户列表一致。未另发业务邮件，未改正式托管登录表单。
- 正式已登录 `/account/profile`、`/jp/account/profile`、`/de/account/profile`、`/account/addresses`、`/account/orders`均200，资料姓名/订阅一致、默认QA地址可读、订单列表为空；`/account/orders/invalid`返回404。上述账户响应private/no-store/noindex。日德账户资料页390px无横向溢出、无替换字符，操作按钮已本地化。本轮未新增或修改地址，未付款/发货。
- 正式 `/cart` 现场为空；此前临时预览1件购物车仍为历史证据，未尝试删除其他会话购物车。已询问删除那1条默认Internal QA地址及付款测试方式，未获答复前不做这些操作。
- 本机实际 `/ja`、`/missing-internal-qa-path`、`/de/missing-internal-qa-path`均404/noindex，不输出canonical、hreflang、og:url或JSON-LD。正常 `/jp/`仍200并保持本机自指canonical/noindex。服务仅监听 `[::1]:3000`，没有临时公开链接。
- 新增真实SSR组件回归 `tests/site-seo-render.test.mjs`，通过React Router分别触发根/子加载失败、缺失配置及正常德语页面；全量148/148通过。lint0错误/2既有警告、codegen及独立路由typegen、build、集合筛选、构建来源审计通过；构建提示沿用此前记录。测试打包额外暴露原messages.json重复Load more options键，未修改翻译数据。Toolkit返回VALID但指出没有Shopify组件可做TypeScript验证，不能据此声称全项目类型检查通过。
- 正式 `/sitemap.xml` 200/有效XML/123分片；英日德pages子sitemap均200/XML有效、均不含本轮错误路径。没有新增规范地址或lastmod，生成源无需变更。该证据不代表本轮错误页修复已上线，生产仍为7ecfcd5。
- 待提交7文件：SiteSeo、SSR测试、README、RELEASE-NOTES、SEO规则、project-state及本QA，合并此前3份本地发布记录；排除分析QA并行补充及历史截图。新的推送与生产部署仍分别待用户确认。

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

## 已授权真实登录补验（已完成本轮范围）

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

客户账户与本会话此前补充的项目规则，共21文件；不包含原分析QA的并行补充或两张历史截图。候选目标origin/main；本节为提交前范围，后续授权与发布结果见下方。

- 规则/记录：`AGENTS.md`、`README.md`、`RELEASE-NOTES.md`、`docs/rules/engineering.md`、`docs/rules/seo.md`、`docs/project-state.md`、本验收文档。
- 客户：`app/graphql/customer-account/CustomerDetailsQuery.js`、`CustomerMarketingMutations.js`（同目录）、`app/lib/customer-profile.server.js`、`app/routes/account.profile.jsx`、`app/routes/account.addresses.jsx`、`customer-accountapi.generated.d.ts`。
- 结账/订单：`app/lib/checkout.server.js`、`app/routes/checkout.jsx`、`app/routes/account.orders.$id.jsx`、`server.js`。
- 文案/样式/测试：`app/locales/messages.json`、`app/styles/app.css`、`tests/customer-profile.test.mjs`、`tests/checkout.test.mjs`。

## 推送与 Oxygen Production 验收（2026-11-18，北京时间）

- 用户先批准21文件提交 `7ecfcd5b4f762ab59b216859b48f2604fd2cdabc` 普通推送至origin/main，远程完整哈希读回一致；随后明确批准Oxygen Production部署。部署前再次实时核实远程未前进，仅保留原分析QA和两张未跟踪截图，不纳入发布输入。
- 发布前重跑145/145测试、lint（0错误/2既有警告）、codegen含独立路由typegen、build、集合筛选及来源暴露审计均通过。构建原envFile、未来选项和analyzer提示保留。CLI `hydrogen deploy --env production --no-json-output --force` 附本次发布说明，经交互确认Production完成构建、上传及可路由验证；force仅容许非构建QA工作区差异，没有跳过验证。
- Shopify后台Production/main/7ecfcd5、Ready/Current；资源[5773163](https://admin.shopify.com/store/ps83if-c4/hydrogen/1000183956/deployments/5773163)，Deployment ID **6155709**，2026-11-18 10:01 GMT+8。部署域名 `https://01m7p66jdjndwcx8kyez66fgg3-d7e83d6aec4307f1a21e.myshopify.dev`，正式域名 `https://www.seineshop.com`。
- 正式 `/`、`/jp/`、`/de/`、B20A商品、`/cart` 为200；日德语言、canonical及本次CSS `app-CyhLLojm.css` 正确。浏览器日德文字和特殊符号正常、无替换字符与页面横向溢出。未新增购物车或修改现有客户数据。
- 未登录 `/account/profile`、`/jp/account/profile`、`/de/account/addresses`、`/account/orders/invalid` 为302至各自登录页，响应private/no-store/noindex；`/account/profile.data`为202且相同隐私头。本次未重新登录，不能把未登录重定向当作生产登录后操作通过。
- `/robots.txt`、`/llms.txt`、`/sitemap.xml` 均200且charset=utf-8；索引123分片XML有效。代表 `/sitemap.en.products-1.xml`、`/sitemap.de.articles-1.xml`、末片`/sitemap.de.policies-1.xml`均200/XML有效，未含账户/购物车/结账/搜索私有路径；未全量爬取其余分片。本轮仅私有账户内容调整，不新增可索引URL或lastmod。浏览器llms/sitemap显示检查通过，发布后构建来源审计再次通过。
- 额外检查发现 `/ja`（并非本站日语地址）404/noindex，但错误页canonical为 `http://localhost:3000/ja`，保留既有SEO缺口；实际 `/jp/` 正常。本轮未扩大为错误模板修复或再次发布。
- 没有修改环境、凭据、支付或CI/CD；没有付款、发货或正式订单验收。此前默认Internal QA地址和1件测试购物车保留。发布证据在本地补充，未进行第二次push。任务标签11/12在验收后关闭，原有其他任务标签保留。
