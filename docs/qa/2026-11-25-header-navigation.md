# 首页导航与落地页本机验收（2026-11-25，北京时间）

范围：只读对照参考站头部和公开落地页；改动限本机。未创建或修改 Shopify 商品、集合、优惠券、账号、正式订单或环境配置，未联系客户。浏览器操作包括一项可逆的访客本地收藏，以及只生成不发送的联系邮件草稿。

| 链路 | 本机结果 | 尚未与参考站等同的部分 |
| --- | --- | --- |
| 搜索框 → 热搜、分类和图搜 | 桌面打开热搜和相机弹窗；用本站真实商品缩略图经相机入口上传，跳至 `/image-search`，命中对应商品。图片在浏览器内比较，不上传；最多 60 张候选。 | 非全量视觉索引，未验证任意实拍照片的匹配质量；搜索和导航未逐帧比对。 |
| 右上角 → 收藏 | 对命中的商品点收藏，徽标加一；从页头进 `/wishlist`，读取并展示真实商品；移除后恢复空状态。 | 仅当前设备，没有账号同步。 |
| 右上角 → 购物偏好、账户、购物车 | 390px 触屏视口无横向溢出，打开购物偏好并读取配送国、语言和币种控件；购物车图标打开抽屉。 | 币种随 Shopify 配送市场，账号用现有 Shopify 托管登录；本次未登录、未下单，未接积分、专用下载清单和跨设备收藏。 |
| 商品栏目 | 新品加入类别导航，精选品牌以实际品牌筛选，品牌目录有搜索与字母筛选；榜单、趋势、认证页保留各自页面信息和同一商品卡实现。无真实集合商品时为空，各路由本机 HTTP 200。 | 没有经核实的排名、认证、分销或品牌运营数据；筛选和卡片基于 Shopify 实际商品，不填参考站商品。首次只读核对趋势页返回 504；续验已成功打开，见下方。 |
| Support Center → 各个落地页 | 七个入口指向不同地址。Chrome 实测 FAQ 从七条按配送主题筛成两条，展开答案；联系表单生成包含测试主题和编号的邮件草稿，未打开邮件客户端。公开目录 API 用本站真实商品 handle 返回 200 和商品数据。 | 联系表单不在站内直接发邮件；优惠券页暂无公开活动。API 与 AI 指南仅支持公开商品查询，不提供参考站的私有客户数据或交易连接。 |

SEO：新增可索引静态页面入口为 `/help/contact`、`/help/faq`、`/help/api`、`/help/why-choose-us`、`/help/ai-assistant-setup-guide`。英、日、德 sitemap 生成测试覆盖这些地址；空优惠券页、图搜、收藏和 API JSON 不进入 sitemap。集合仍按 Shopify 已发布且非空的集合进入对应分片。未启用本机索引，也未发布，因此正式 sitemap 及市场联调待上线授权后验证。

本轮检查：161 项测试，lint 0 错误／2 条已有脚本警告，codegen、build、集合筛选、构建来源暴露审计及 diff 检查通过。浏览器开发模式出现既有 nonce / hydration 警告；上述操作在本机实际交互成功，不以构建或 HTTP 200 替代。

## 续验：桌面溢出菜单、滚动与趋势／榜单

- 参考站首页在 1199px 下，「…」紧跟 Trending Products，面板右对齐、宽 200px，只包含 Certified Products 和 Brand Distributor。菜单和搜索弹层的计算样式没有入场动画；分类弹层约宽 260px，热搜面板从输入区左边缘开始。参考站在向下滚过约 120px 后隐藏页头，向上滚动即显示，过渡为 200ms ease-in-out。本机复验菜单顺序、打开、Esc 关闭；首页滚到 110px 仍可见、500px 隐藏、向上回到 300px 显示。键盘焦点位于头部时保持可见。390px 下抽屉含七个商品栏目，页面无横向溢出。
- 参考站趋势页与 EU 榜单均实际读到结果计数、结果内搜索、40/60/80 条选择及排序；本机从首页进入趋势页，显示 0 项和五个排序选项，提交 `case` 后跳到筛选 URL 并显示「无匹配商品」。390px 下 EU 榜单按 URL 恢复每页 60 和价格升序，无横向溢出。分类来自该 Shopify 集合的筛选项；没有商品时不复制外站分类商品或成交数据。本机两栏都没有商品，不能验证真实排序和翻页效果，也未接外部平台销量或排名、匹配标签。
- 续验不新增公开 URL；本机 `/sitemap.xml` 是 UTF-8 的空索引，符合本机禁止索引，英／日／德分片覆盖由自动测试检查。未发布、未验证正式站。本机仍有既有 hydration 和 nonce 警告；没有把本次验证视为所有页面或动效已逐项对齐。

## 发布门槛复验（2026-11-25，北京时间）

本次仅本机验证和正式域名未登录只读检查；未发邮件、未建订单、未开公开隧道。空栏目按已约定的空状态验收，不把缺失功能或未测操作记作通过。

| 项目 | 证据与判定 |
| --- | --- |
| All Categories、更多、支持菜单 | 三个本地按钮均打开并能按 Esc 收起；菜单分别有 172、2、7 个链接。分类导航抽查 18 个不同地址，均为 200；子分类未全量逐一交互验收。 |
| 搜索、热搜、分类、相机 | 热搜和 17 个搜索分类选项可展开；输入 `iphone` 后联想显示四个真实商品链接；普通结果页查询 `case` 有真实商品。相机弹层可开；上轮以真实缩略图验证命中，当前图搜仍只按最多 60 张候选比对。 |
| New Arrivals | 入口和类别筛选 URL 返回 200；无商品，按空栏验收。 |
| Best Sellers | 入口返回 200，首屏 HTML 有 40 个商品链接；本轮未重做加购交易。 |
| EU Top Rankings、Trending Products | 两个入口均返回 200 并显示 0 项；上轮已验证趋势页提交查询、榜单大小及排序参数回显。缺真实商品时不能验证实物顺序、分页或排名数据。 |
| Certified Products、Brand Distributor、Handpicked Brands | 三个入口均返回 200；分别为空商品、空目录、空商品。无真实品牌/认证数据，未验证非空筛选与卡片。 |
| 配送、语言、币种／购物车 | 购物偏好可打开并显示配送国、语言及随市场确定的币种；购物车可打开抽屉，独立购物车页返回 200。未完成结账。 |
| 账户／收藏 | 本机 `/account/login` 和 `/account/orders` 均为 400，本机账户登录端明确要求 OAuth 隧道；不按提示自动开隧道。当前正式站登录入口 302 至 Shopify，只证明旧生产版本入口可达，不证明候选版可登录或读订单。收藏页 200，上轮实测收藏和移除；目前仅本机存储，不同步账户。 |
| Contact Us／FAQs | 联系表单存在，上轮确认只生成邮件草稿，未接站内发送；FAQ 本轮实测配送主题把七条筛成两条，且能展开回答。 |
| API／Blog & News | API 真实商品 handle 返回 200 且返回值匹配，缺参、未找到分别 400/404；仅公开目录。日志首页、文章、主题页可读；未提供参考站私有 API 能力。 |
| Get Coupons／Why Choose Us／AI Assistant Setup Guide | 三页 200；优惠券无公共活动，Why Choose Us 有说明，AI 指南只使用公开目录，未接私有账户及交易工具。 |

工程：162 项测试通过；lint 0 错误、2 条既有警告；codegen、build、集合筛选、来源暴露审计、diff 检查通过。本地索引 XML 200 且声明 UTF-8，本地 noindex 时不提供分片；英／日／德 sitemap 内容有自动测试，正式候选版未部署因此未实测。开发环境仍出现 nonce 与 hydration 错误，未判为全面通过。结论：未达到全功能发布门槛，未推送或部署。

## 原因排查与补齐（2026-11-26，北京时间，进行中）

- 沿用现有 `app/routes/`、`app/graphql/customer-account/` 和共用导航组件补齐账户入口。账户余额只读 Shopify Customer Account 原生 store credit，不新增积分、数据库或后台定义；图片下载清单使用独立的浏览器本地键，条目仅存真实商品 handle，下载经公开目录中真实 CDN 图片完成；不写入客户资料、不宣称跨设备同步。相关页面 noindex，私有账户路径不加入 sitemap。验证继续使用同一记录，不将旧失败覆盖成通过。
- 隔离浏览器上下文证明整页 hydration 失败来自扩展插入的额外根节点；隔离上下文仅有 HEAD/BODY 且未复现硬错误。React18 开发环境 nonce 属性显示差异另行记录，保留 CSP nonce，不用 suppressHydrationWarning 隐藏问题。

### 续验与实际修复（2026-11-26）

- 图片下载：以本站真实 Garmin 充电线商品读取 7 张真实 CDN 图片，逐张加载成功；保存后刷新仍在，下载按钮产生真实浏览器下载，移除后存储恢复为空。修复直接带 `handle` 进入下载页未选中商品，以及下载页 loader 的 `product` 字段误触发商品标题/结构化数据；改为专用 `downloadProduct`，下载文件名使用真实图片 ID 避免分页重名。390px 无横向溢出。下载列表不改收藏、客户资料或后台媒体。
- 图搜：实际首批比较 60 张、继续后 120 张；换一张真实商品图片后重新从首批比较，计数回到 60。局部比较数组改为每个候选明确维护距离，消除 Toolkit 的隐式空数组诊断，不通过忽略检查处理。视觉匹配仍是浏览器内的近似图像比较，不宣称等同语义 AI 或一次性全库匹配。
- 搜索联想：补充后页命中、达到数量提前停止、空 cursor/重复 cursor/循环 cursor 的自动测试；不再只搜最初 80 件商品。所有 157 个分类唯一目标已在此前续验中完整请求并确认 200 和主标题；不是逐一真人点击或逐帧动效比对。
- 新品：实读参考页后补上发布日期浏览；只统计本站真实 `publishedAt`，最近 30 个 UTC 日期和指定日期可筛选，保留排序、40/60/80 与分页。空集合仍显示日期区域、分类/备货时间框架及真实空状态，不填外站日期/计数。自动测试覆盖最近日期边界、后页、指定日期和空栏目选中状态；浏览器确认 `release=recent&size=60` 恢复选中项与 Newest。
- 品牌：按真实集合成员生成分类-品牌对应关系和去重计数，增加完整 `#`/A-Z 索引；无品牌的字母禁用，不复制参考站品牌。认证与精选品牌保持各自框架及统一紧凑排序区，不添加虚构认证值。
- 多语言与布局：补齐栏目介绍、联系/FAQ/AI 指南等日德文案，栏目标题不再使用不可翻译的拼接英文。768px 德语的精选品牌和支持中心原来发生文字覆盖，原因是 flex 容器可收缩但子链接溢出；改为平板范围换行，几何坐标复验两个入口不再重叠。390px 日语品牌页、德语新品页和下载页均无横向溢出。
- 市场设置：隔离访客在 390px 从美国/德语/USD 保存为日本/日语/JPY，实际跳到 `/jp/help/contact`，页头读回日本、日语、JPY；没有进入结账或创建订单。
- 生产构建本机预览：仅监听 127.0.0.1/::1 的 3073 端口。隔离浏览器首页没有 hydration/nonce 错误，保留真实 nonce（32 字符），搜索范围面板计算宽 260px、无动画、Esc 关闭；账户弹层新增余额及下载入口。Shopify 分析请求在 localhost 有 CORS 失败，未扩大 CSP 或关闭安全保护来掩盖。开发模式仍有 React18 nonce 提示；构建期间开发 manifest 出现短暂 500，最终构建候选需重新启动预览后复查，不将其算作已修复证据。
- 已用生产构建预览请求 17 个导航/工具目标的英日德版本，共 51 个地址，全部 200 且有主标题，语言分别为 en/ja/de；该项只证明地址/SSR 可达，不替代真实发送、登录和交易。账户余额 query 已通过 Customer API 2026-04 校验；两个 JSX 验证器返回 VALID 但说明未识别可验证的 Shopify 组件，因此不计作完整类型验证。

待完成真实验收：联系表单缺少通用站内收件服务（现有商品询价接口不能伪装成通用留言）；候选版账户 OAuth 必须使用获准的官方 HTTPS 预览并由用户本人完成登录，余额/订单实际读回尚未验证。已提出对应服务信息与临时预览确认，等待期间继续独立回归。不将这些项目或整体“完全一致”标为通过，不推送、不部署未达到约定门槛的候选版。

### 本轮最终独立回归（2026-11-26，北京时间）

- 172/172 Node 测试通过；lint 为 0 错误、2 条既有脚本 console 警告；codegen、生产构建、集合筛选检查、构建来源暴露审计和 `git diff --check` 通过。构建分析器仍有既有 metafile.server.json 缺失提示，构建命令退出 0；未将其隐藏或改成跳过检查。
- 最终构建后重新启动仅本机的 3073 预览：768px 德语品牌页标题已本地化，导航换行后无覆盖、无横向溢出，控制台无错误/警告。开发服务器重新请求同一页面返回 200，确认此前构建时的 500 未持续复现。更多菜单在触屏平板下实际点击展开、Esc 关闭，焦点保持在原触发按钮。
- 在最终构建上实测 Best Sellers → Quick View → Save images to download list → Images Download List：保存 1 个真实商品，下载页读出 7 张图片；跳转后旧弹窗关闭、body 滚动恢复、无错误提示，控制台无错误/警告。此前图片下载已在本机 Downloads 目录读到 8,103 字节的实际文件；测试文件保留，不擅自删除。
- 3073 预览的 robots.txt、llms.txt、sitemap.xml 均 200，实际 Content-Type 含 `charset=utf-8`；浏览器读取没有替换字符。本站本机禁止索引，因此 sitemap 保持空索引，不伪造线上子分片通过。英日德 sitemap 自动测试排除下载、账户余额、收藏、图搜及空优惠活动。
- 最新 fetch 核实远程仍为 `e7a9c0a`，本地 `main` 领先 `42cb6af`，本轮源码仍未提交、未推送、未部署。原有其他任务文档修改和截图均保留，未纳入或覆盖。
- “已通过”仅限上述明确范围。站内联系消息发送、候选版真实账户读回尚未通过；设备收藏不等于跨账户/设备同步，图搜不等于参考站私有图像识别服务，公开 API 不等于其私有交易 API。没有将这些差异标成完全一致，也没有以通过 172 项测试为由越过发布门槛。

### 临时 HTTPS 与原生联系通道核查（2026-11-26，进行中）

- 用户本轮明确允许临时 HTTPS 账户验收；官方命令 `npm run dev -- --port 3074 --inspector-port 9234 --customer-account-push` 仅登记本轮开发回调，不改 `.env` 或生产发布配置。首次与原 3062 服务并行造成系统文件句柄耗尽，已正常退出首次临时 CLI，并停止本任务原 3062 服务后单独重开；未改系统限制。候选版已到达真实 Shopify 登录页，用户自行登录；提醒取消默认营销勾选。
- 联系收件邮箱现有 `steven@seineshop.com`，不是缺邮箱；需要验证的是 Hydrogen 表单到收件系统的传输。Shopify 原生 `/pages/contact` 存在且表单 POST `/contact`，有官方 hCaptcha 保护，不能 iframe 或绕过验证。拟用一条明确 Internal QA、保留示例邮箱的最小联系测试核验正常浏览器提交/验证码流程，可能给店铺联系邮箱产生一封内部测试通知；不联系真实买家、不发送报价或营销邮件、不改店铺配置。未通过前不宣称送达。

- 联系传输实际测试：从候选 HTTPS 页面正常表单 POST 原生 `/contact`，Shopify 返回 HTTP 400 / `Missing CAPTCHA token`；没有发送成功，不关闭或绕过 CAPTCHA。官方主题安全资料要求 `content_for_header` 提供的保护及 `Shopify.captcha.protect`，未找到 Hydrogen 通用发送接口，不能复制内部初始化脚本冒充官方 Headless 接入。原生主题联系页本身可访问，但不等于当前自定义表单已能发送。
- 邮箱域名公开 MX 查询指向飞书；这只说明收件服务，不代表网站持有发信授权。生产首页当前未观察到客服脚本或 iframe，不能将 17TRACK 查询组件当客服插件。测试错误页等本轮标签 40/41/42 已关闭，39 登录标签保留并置前供用户操作，其他任务标签未动。

### 登录后真实补验（2026-11-26，进行中）

- 用户已完成候选 HTTPS 登录，实际返回 `/account/credits`，页头为已登录状态。账户及余额响应 200、`private, no-store`、`noindex, nofollow`。余额 API 实际返回 `Access denied for storeCreditAccounts field`，不是零余额；官方 Customer API 2026-04 明确要求 `customer_read_store_credit_accounts`。用户本轮明确批准只添加这项余额只读权限，不申请交易明细或余额写入；尚待后台配置和读回复验。
- `/account/orders` 实际显示未下单空状态；输入 `Internal QA no such order` 并点击 Search 后保留查询参数、显示无匹配及 Clear filters 入口。无真实订单，不能据此宣称已付款订单及详情验收。390px 实际 viewport 与 scrollWidth 均为 390。
- 为核查获准权限打开本任务后台设置标签 43，当前要求商家登录及 hCaptcha，须由用户本人完成；不是前台买家登录失效。账户标签 39 保留。没有改 `.env`、余额、订单或权限范围外设置。

- 用户已完成商家后台登录。Customer Account API 权限初始余额/交易明细均未选；编辑时 Shopify UI 自动把两项联选，保存前显式取消交易明细，只保留已授权的余额读取。保存后刷新后台读回：余额读取已选、交易明细未选，其余原有项不变；未生成新凭据。此权限按后台说明为本店 Hydrogen 渠道共享，不涉及其他店铺。
- 修复权限根因后真实英/日/德 `/account/credits` 均 200、private/no-store/noindex，均显示真实“暂无可用余额账户”，没有不可用告警。德语 390px 截图及 scrollWidth=390 验证通过；没有通过充值测试制造非零余额，不把空账户读回写成余额消费已验。
- Orders 实际点击 Clear 后 URL 查询清空、两个输入框均为空、恢复未下单状态。资料/地址只读响应 200，非法订单标识 404；日德账户返回正确 lang。已登录账户悬停菜单为 My account/My Orders/Account Credits/My Coupons/Images Download List；实际点击图片下载入口到 `/downloads`，弹层关闭、body 滚动恢复，显示本会话真实空下载列表。My Coupons 仍为无公开优惠活动页面，不宣称提供未实现的私有券分发能力。
- 开发 HTTPS 仍有既有 nonce 属性警告，以及 Shopify 指标上报端点被 CSP 拦截；不扩大 CSP 或隐藏警告。只记录实际功能通过范围，不宣称开发控制台零错误。资料/地址未做新写入，未下单、付款、充值、扣款、发货或发客户通知。
- 联系方案续查：飞书官方发送邮件 API 要求自建应用和用户发信授权，现有邮箱 MX 不代表网站已有授权。已向用户提出仅向固定店铺邮箱发送留言、不读邮件、不向访客自动发信的最小接入范围；尚未改飞书配置或服务端凭据，待明确同意后推进。Shopify 已安装应用清单未见通用表单收件服务，不把 Messaging 营销应用视为通用留言发送接口。

- 用户对飞书接入问题要求先澄清范围，并说明在线聊天插件计划后续接入。这不是飞书发信、凭据或应用配置授权；未实施飞书接入。需明确区分 Support Center → Contact Us 的留言发送与右下角实时聊天，不能把“聊天后续接”扩大为本轮联系表单自动延期，也不能擅自纳入新插件。
- 本轮重新运行全量 Node 测试，172/172 通过。只读权限修复无前台源码变化，临时诊断代码已撤回；文档 diff 检查通过。

### 站内留言发送实现准备（2026-11-26，北京时间）

- 用户明确要求现在实现完整站内发送，而不是延期联系表单；在线聊天仍为另行接入事项。本轮复核远程 main 无新提交，保留全部已有修改。建议专用事务邮件服务向现有飞书邮箱收件，外部服务、密钥和域名配置尚待具体批准，不将开发需求扩大为这些受限操作授权。先完成局部代码与隔离测试，不修改环境配置、不发送真实邮件、不发布。
- 上轮候选实际点击 Sign out 后返回首页、页头恢复未登录入口，退出已验；临时 HTTPS 通道尚待正常关闭和回调清理核验。

- 用户已明确批准接入 Resend，仅向固定店铺邮箱发信，允许创建仅发信密钥与服务端私密配置；具体 DNS 记录和任何费用仍须先列明确认。代码使用固定 `contact@notify.seineshop.com` 发件与现有收件地址，不修改飞书或向访客发自动回复。尚未创建密钥、改 DNS 或环境配置。

- 临时 HTTPS CLI 已正常 Ctrl+C 退出，3074 监听消失；Shopify 后台 Application setup 重新读回仅保留正式 callback/origin/logout，没有临时域名，未手动改生产回调。后续联系页改用仅本机 `npm run dev -- --port 3075 --inspector-port 9235`。
- Resend 登录由用户本人完成；已建立 `notify.seineshop.com` 发信域名，North Virginia 区域，未启用点击/打开追踪或收信。用户进一步明确批准仅新增 TXT `resend._domainkey.notify`、CNAME `rsend.notify → rsend.forge.rmta.net` 与 `send.notify → send.forge.rmta.net`（DNS Only）；不改主域名飞书 MX/SPF/DMARC。实际 DNS 写入待核对后台。
- 初步自动验证：180/180 测试、lint 0错误/2既有警告、codegen、build、集合筛选及来源暴露审计通过。Toolkit 初次指出错误类型收窄、FormData 迭代库及 JSX 数字属性等问题，已修复后第二次返回 VALID，但说明无可做 TypeScript 验证的 Shopify 组件，不计为全项目类型验证。最终代码变化仍须复验。

#### 已批准的 Resend DNS 范围（待实际写入读回）

仅限 Cloudflare `seineshop.com` 下列三条；TTL Auto，CNAME 关闭代理。DKIM 为公开验证公钥，不是私钥。

| 类型 | 名称（相对根域名） | 值 |
| --- | --- | --- |
| TXT | `resend._domainkey.notify` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC4cXpQ0hnwpkPLt+kysuBvDnU7cRcTAms1VepH2ZSWKtST2ee4EpEKpLZzCKv7TLaNrKhak8ylx6SleIgiiFkkDOH51xLE8Zmd/LYl55O7MZbdhgTvnPf/CfxjoTnb5yWbsKouIFlSrwHPgcfuvQTdJBl7YOA/slHvfv0Tclxe5QIDAQAB` |
| CNAME | `rsend.notify` | `rsend.forge.rmta.net` |
| CNAME | `send.notify` | `send.forge.rmta.net` |

不新增页面建议的根 `_dmarc`，不改飞书根域名 MX，不启用 Resend receiving / open tracking / click tracking。Resend domain ID 为 `9bf06192-cd98-4cac-be62-cb005ac159bd`，当前列表 Not Started；API 密钥尚未创建，不得为绕过域名限制改用全权限密钥。

- 用户不清楚管理 `seineshop.com` 的 Cloudflare 账号，要求提供上述配置用于向上级汇报。当前可见账号未确认拥有该域名，未写 DNS、未创建密钥、未修改 `.env` 或 Oxygen 环境变量，未支付/订阅服务。上级只需为本域名添加表中三条；不得用迁移 DNS/修改 NS/替换飞书记录来绕过账号问题。
- 最终局部源码检查：全量 180/180 测试、lint 0错误/2既有警告、codegen（包含独立路由类型生成）、build、集合筛选、来源暴露审计、sitemap 13/13 及差异空白检查通过。构建分析器仍有既有 metafile.server.json 缺失提示，未隐藏。Contact Us 已在原 sitemap 生成源中，英/日/德规范条目各一次，新增私有接口 `/api/contact` 明确排除；没有伪造 lastmod，未部署候选，线上 sitemap 待发布后复验。
- 本机 Chrome 隔离会话读取英/日/德联系页未配置状态，真实 API 返回 503、页面诚实提示暂不可用并禁用发送；390px 日德无溢出、语言正确。开发模式既有 nonce 提示保留。真实提交、重试的浏览器行为、邮件服务受理与飞书收件尚未验，不能由隔离接口测试代替。临时 HTTPS 与后续本机联系服务均已正常停止，3074/3075 无监听。

### DNS 续验与真实发送准备（2026-11-27，北京时间）

- 用户表示上级已完成 DNS 配置并要求继续。实际从系统解析器、Cloudflare 1.1.1.1 与 Google 8.8.8.8 读回三条记录均与批准清单一致，根域名 MX 仍为飞书三条。未访问 Cloudflare、未新增或改写 DNS。
- Resend 正常登录会话保留；点击 Verify DNS records 后开始异步核验，事件出现 DNS verified，但域名整体仍 Pending，不把记录读回当作发信已开通。收信及追踪保持关闭。Sending access 的域名下拉尚未出现目标域名，取消创建，未用 Full access 或 All domains 绕过。
- 本轮拟仅提交一条 Internal QA 留言至固定 steven@seineshop.com，测试姓名 Internal QA、Reply-To qa@example.com、参考编号 Internal QA 2026-11-27，正文含中日德字符。预期只产生一封内部测试邮件，不向访客回复，不改变商品、订单、营销或客户账户；人工重试保持同一幂等键，避免重复邮件。执行和送达结果后补。
- 新鲜检查 180/180 Node 测试、lint 0 错误/2 条既有脚本警告、联系和 sitemap 局部 21/21 通过。当前仅验证原候选，不能替代最新远程整合及最终构建。
- fetch 发现远程 main 已到 f1b4e71（新增 iPhone 18/Pro 集合及导航），本地 42cb6af 与其分歧，且存在旧任务未提交成果。暂不更改前台源码、不盲目 pull/rebase，保留所有本地与远程成果；继续独立 DNS/凭据联调，最终发布前须完成安全整合及复验。

#### 域名、密钥及真实邮件结果

- Resend 异步核验最终完成：整体 Verified、Forge Ready、三条记录 Verified。未开 receiving/tracking，未添加建议的根 DMARC。随后创建 Sending access、仅 notify.seineshop.com 的密钥，保存本机被忽略的 CONTACT_RESEND_API_KEY；原 .env 内容保留，0600，不回显密钥并清空剪贴板。生产环境未配置。
- 在本机 3075 的隔离浏览器会话提交上述 Internal QA，双击只产生 1 个真实 POST。HTTP 200 accepted，submissionId 为 `8c90c18f-e0bd-439f-9e52-cac711d2a56a`；观察到 Sending message…、aria-busy=true、fieldset disabled，随后恢复并禁用提交按钮，结果区域获焦，输入保留。同原始请求体和 ID 手动再试仍 200 accepted，private/no-store/noindex；Resend 列表只有 1 个发送对象，未生成第二封。
- 服务商实际对象 `01a21af8-6318-7a43-94bb-438b06c7428b`：from 为 contact@notify.seineshop.com，to 为固定 steven@seineshop.com，reply-to 只为 qa@example.com，中日德正文完整。但最终状态 Bounced，SMTP 详细原文 `smtp; 550 verify address failed, User not found steven@seineshop.com`。该结果是收件系统拒收，不是页面已送达；已请用户核对飞书地址是否已创建/启用、允许外部来信或提供正确固定邮箱。未探测其他地址、未发自动回复、未改飞书或扩大密钥权限。
- 本轮 codegen（含独立 Router typegen）、生产构建、集合筛选、构建来源暴露审计及差异空白检查通过。构建分析器原有 metafile.server.json 缺失提示保留；开发 nonce 警告仍存在。原候选检查不代表最新远程已整合，不代表收件通过。

#### 收件地址澄清与主线整合约定

- 用户确认现用收件地址为 hello@seineshop.com，并指出详情页仍有旧邮箱。后续统一消费者联系入口与留言固定收件到此地址，不创建邮箱、不改三条 notify 发信 DNS、不替换飞书。此前 steven 地址退信事实保留。
- 本轮先在既有 .cache 保存不含 .env/凭据的源码变更快照和逐文件哈希；以 merge-base、本地实际工作内容、origin/main=f1b4e71 做三方整合。自动合并仅在原文件哈希未变时落盘；冲突逐项保留导航与远程 iPhone18/Pro 功能，不覆盖并行 QA。新文件仍使用既有 app/tests/docs 归属，不新建工作副本；快照不纳入提交、不自动删除。整合不改 Git 历史、不 rebase/reset/push；验证后再准备本地提交与主线祖先关系。

- Recipient correction follow-up (2026-11-27): user confirmed hello@seineshop.com. Next real browser submission uses Internal QA / qa@example.com / Internal QA 2026-11-27 corrected recipient, Unicode body, fixed hello recipient only. Expected side effect is one internal email; no visitor auto-reply, customer/marketing/order write. Prior bounced object stays unchanged.
- Safely integrated 31 remote affected paths using the recorded three-way preview; branch/history unchanged. Retained local header tools and remote phone collection/gallery/cache/series, both sitemap tests and translations. Generated types regenerated with codegen. First integrated check: 188 tests pass, lint 0 errors / 2 existing warnings; added mailbox consistency regression afterward. Public live homepage currently contains both hello and the obsolete address.


#### 邮箱修正与导航续验（2026-11-27，北京时间，本机候选）

- 已统一前台所有联系入口及服务端固定收件为 `hello@seineshop.com`。商品页九个邮件链接均为现用邮箱；源码、公开目录和生产构建扫描旧地址及真实联系私钥均零匹配（313 文件）。原退信证据保留；notify 发信 DNS 不需要因收件邮箱更改而重配。
- 真实联系页重新提交 Internal QA（仅一次内部邮件）：submission `101c3cf7-3720-44ab-9380-5b57d44c4cda`，Resend `01a21b00-a4d1-7505-8233-bab2dcea1db7`。后台再次读回 Delivered（11月27日11:16）、收件 hello、发件 contact@notify、Reply-To qa@example.com，中日德正文正确。实际收件箱位置/显示仍待用户确认，不称已读或完成生产验收。
- 176 个导航目标首轮发现 Apple Pencil、Apple HomeView 两个 404，原因是菜单 family 已有但集合 fallback 注册遗漏。已在原 categories 的 links/children 登记，不写 Shopify 商品或伪造集合。新增 family 注册一致性测试先实际失败、修正后通过；空集合 sitemap 排除覆盖英日德，继续使用原 sitemap 生成源，不伪造 lastmod。
- 最终构建首轮 191/191 测试、lint 0错误/2既有警告、codegen/build、集合筛选、来源暴露审计与 diff 检查通过。180 个路径（原176加两类日德样本）均 200 且含 h1；最慢 iPhone18 Pro 冷请求约12.7秒，保留性能观察项，不当作快速加载已验。
- 浏览器：1440px 空栏目无横向溢出，noindex/follow；更多菜单严格两项 Certified Products / Brand Distributor，Esc 后焦点回 trigger；All Categories ArrowDown 聚焦首项、Esc关闭，保留 iPhone18/Pro 与新增 family 的真实链接。390px 日德空栏目无横向溢出，但发现共用筛选/空状态17项未翻译，已补原 messages 并新增翻译回归，随后重新构建复验。未放宽 CSP 隐藏 Shopify metrics 既有错误。
- 未 push、未部署，生产联系私密变量尚未配置；工作分支祖先关系尚未与远程完成普通合并。并行 QA、截图与所有缓存保留，不删除。

- 翻译补齐后新鲜全量检查：192/192 测试、lint 0错误/2既有脚本警告、codegen/build、集合筛选、来源暴露审计和 diff 检查通过。390px 日语 HomeView / 德语 Pencil 浏览器读回本地化标题、筛选、计数、排序与空状态，截图复核无横向溢出。
- 本机 sitemap.xml 为200/UTF-8有效空索引（预览域名索引保护），因此本机集合/pages分片按保护规则404；不把它们记成线上通过，也未关闭保护或改环境配置绕过。原生成源在英日德自动测试中排除两类空栏目、包含公开联系页，生产分片和实际UTF-8显示待获准发布后验证。robots.txt / llms.txt 本机200并声明charset=utf-8。

- 已将75个明确路径准备为本地提交 `1031165`（含远程已整合文件）；随后普通合并 origin/main=f1b4e71。六个冲突均采用此前已完成三方整合并通过最终验收的候选内容，而不是旧分支内容；合并索引与1031165源码树逐字节一致，未 rebase/reset/强推，未包含三份并行QA及两张历史截图。当前记录补入普通合并提交后，再请求本次 push；生产发布仍单独授权。

#### 本次待批准推送清单

- 目标 `origin/main`；候选包括原导航提交42cb6af、本地功能提交1031165及普通合并783ff8b，另补本节验收清单。相对远程共57个文件，含导航/搜索/功能页、邮箱统一/留言、账户余额、翻译、生成类型、回归和原验收文档；不含 .env、密钥、生产配置、并行QA和截图。生产发布未获本次授权，不随推送自动宣称上线。

- `README.md`
- `RELEASE-NOTES.md`
- `app/components/BestSellerQuickView.jsx`
- `app/components/CatalogSection.jsx`
- `app/components/FacetedCollection.jsx`
- `app/components/GlobalSearch.jsx`
- `app/components/Header.jsx`
- `app/components/HeaderIcon.jsx`
- `app/components/ImageSearchUpload.jsx`
- `app/components/JournalArticle.jsx`
- `app/components/MarketSelector.jsx`
- `app/components/SiteSeo.jsx`
- `app/data/catalog-sections.js`
- `app/data/header-destinations.js`
- `app/data/navigation.js`
- `app/entry.server.jsx`
- `app/graphql/customer-account/CustomerCreditQuery.js`
- `app/lib/collection-filters.js`
- `app/lib/contact.js`
- `app/lib/contact.server.js`
- `app/lib/customer-credit.server.js`
- `app/lib/download-list.js`
- `app/lib/scoped-search.server.js`
- `app/lib/sitemaps.server.js`
- `app/lib/visual-search.js`
- `app/lib/wholesale.js`
- `app/lib/wishlist.js`
- `app/locales/messages.json`
- `app/root.jsx`
- `app/routes/_index.jsx`
- `app/routes/account.credits.jsx`
- `app/routes/account.jsx`
- `app/routes/api.catalog.jsx`
- `app/routes/api.contact.jsx`
- `app/routes/collections.$handle.jsx`
- `app/routes/downloads.jsx`
- `app/routes/help.$handle.jsx`
- `app/routes/image-search.jsx`
- `app/routes/products.$handle.jsx`
- `app/routes/search.jsx`
- `app/routes/wishlist.jsx`
- `app/styles/header.css`
- `app/styles/navigation-pages.css`
- `app/styles/search.css`
- `customer-accountapi.generated.d.ts`
- `docs/project-state.md`
- `docs/qa/2026-11-25-header-navigation.md`
- `docs/rules/business-tools.md`
- `storefrontapi.generated.d.ts`
- `tests/catalog-sections.test.mjs`
- `tests/contact.test.mjs`
- `tests/customer-credit.test.mjs`
- `tests/header-destinations.test.mjs`
- `tests/locale.test.mjs`
- `tests/site-seo-render.test.mjs`
- `tests/sitemaps.test.mjs`
- `tests/wholesale.test.mjs`

- 普通合并后192/192测试再次通过，app/tests/public及生成类型与最终构建候选无差异。实际收件箱显示确认和生产配置/发布/上线验收仍待继续；冷加载性能问题如上保留，不声称整站所有业务均已验完。


### 发布执行与真实入箱确认（2026-11-27，北京时间）

- 用户提供收件箱截图：主题 Seine Shop — Feedback、submission 101c3cf7-3720-44ab-9380-5b57d44c4cda 与本次真实留言一致，中文/日文/德文（含 Grüße）正常；本机至实际邮箱的发送链路已确认，不保存截图中的其他邮件或安全信息。
- 用户明确批准本次推送与生产部署。发布前重新完成192/192测试、lint（0错误/2既有警告）、codegen/build、集合筛选、构建来源暴露审计、diff 检查；源码及生成类型与批准候选一致。
- 已推送584b6d3c8392a32b0e2b885b80759eef9055bd12，git ls-remote 读回 origin/main 同一完整哈希。未包含三份并行QA及两张历史截图，未改CI/CD或商品数据。CLI env list 确认Production handle=production、branch=main、正式域名www.seineshop.com。
- 正式环境新增CONTACT_RESEND_API_KEY已单独提出具体范围确认；等待期间不写生产变量、不把留言未配置版本当成完整发布。Shopify后台提示用户安全验证，已请用户本人完成，不索要或代填验证码。部署与正式域名验收结果后补；此新增证据仅本地记录，未再推送。

- 用户明确批准仅在Production新增现有CONTACT_RESEND_API_KEY，且完成后台安全验证。正常后台Add variable保存成功，刷新变量详情读回仅Production、Make this value secret checked/disabled、值已遮罩；未勾选Preview、不新建或轮换密钥、不改其他变量。正常本机剪贴板传值后清空，不回显或写入记录；浏览器剪贴板读取提示被拒绝，未授予持久读取权限。
- 部署前远程main再次读回584b6d3完整哈希，来源审计通过，app/tests/public及生成类型与批准提交无差异。启动官方CLI Production部署；--force仅允许既有不参与构建的文档/截图差异，未跳过构建或路由验证、不启用客户端source map、不使用env-file覆盖生产配置。

- 官方CLI明确确认Production(handle production, branch main)，部署成功且完成routable验证，部署地址 https://01m8dvcg5d982j1ehhgccgn2ba-d7e83d6aec4307f1a21e.myshopify.dev 。后台导航随后遇Cloudflare安全质询，不绕过或自动解题，独立Deployment ID/Current读回待补；不影响继续正式域名功能验证。
- 正式站最小Internal QA计划：隔离访客从 /help/contact 提交一条，Internal QA / qa@example.com / reference “Internal QA production 2026-11-27”，含中日德正文，固定hello收件，无访客自动回复，不产生订单/评价/营销。仅观察一次真实提交及服务商事件，不自动重发；实际执行结果后补。

- 正式站隔离访客追加最小购物车回归计划：B20A Black数量1，观察Add to cart/抽屉，不点Buy now、不进入托管结账、不付款/下单/发货；保留测试购物车，不执行删除。


#### 正式发布最终读回与验收结果（2026-11-27，北京时间）

- Shopify后台安全质询已自然结束，独立读回 Production/main/584b6d3、Ready/Current，资源5882924、Deployment ID6264446、14:34 GMT+8，与CLI部署一致。未自动解题或放宽安全设置。
- 正式联系页按上述计划仅发送一次：POST200 accepted、private/no-store/noindex，submission `3c9ab560-7190-48dc-883c-103e97aa39f4`；成功区域获焦点、输入保留、发送按钮禁用。Resend对象 `01a21bb8-6f95-73c6-9ce7-31b448c5b111` 于14:36显示Delivered，固定收件hello@seineshop.com、发件contact@notify.seineshop.com、Reply-To qa@example.com，reference及中日德正文一致，没有重复发信或访客自动回复。正式邮件尚未取得用户实际入箱截图，不把Delivered称为已读；此前截图对应11:16本机邮件。
- 正式188个导航/语言/首页/工具页样本全200、含h1、无旧邮箱；两处Apple空栏目可访问且noindex/follow、不编造商品。iPhone18 Pro最慢冷请求约7.2秒，保留性能观察。结果保存在Git忽略的 `.cache/contact-production-routes-2026-11-27.json`。
- 桌面更多菜单ArrowDown聚焦Certified Products，仅Certified Products/Brand Distributor两项，Esc关闭并回More navigation；390px德语/日语联系页无横向溢出、接口配置可用、发送按钮本地化。B20A商品页10个mailto均hello、旧地址0、canonical正常；隔离访客Black数量1真实加购，服务端确认$19，重新访问/cart仍为1件/$19、无溢出且noindex。未点击Buy now/Checkout，未付款/创建订单/发货，保留测试购物车。
- 正式robots.txt、llms.txt、sitemap.xml及英日德collections-1/pages-1共9项200且Content-Type声明charset=utf-8。浏览器XML解析正常，索引135分片、集合代表分片10loc、页面代表分片13loc且联系页各一次；两个空Apple栏目不收录。另读en products-1为500loc。直接浏览器llms文本及日语pages XML无乱码/U+FFFD，日语含/jp/help/contact。未全爬135分片。结果保存在 `.cache/contact-production-resources-2026-11-27.json`。
- 发布后来源暴露审计通过，app/tests/public/生成类型与批准提交无差异；既有Clarity/Bing同步像素被原CSP阻止，不放宽保护、不声称控制台零错误。真实非零余额、付款后订单及整站性能不在已通过范围。
- 本节与项目状态仅本地补充，不自动二次push；并行三份QA、两张历史截图、原缓存均保留。


### 冷读取性能根因与局部优化（2026-11-27，未发布）

- 用户要求查真正原因并优化，同时模拟付款/下单。复用主目录；命令级复用系统已配置HTTP代理fetch成功，HEAD/origin/main均584b6d3，无新副本、不改全局配置，保留并行成果。
- 正式浏览器iPhone18 Pro首访requestStart至responseStart约6.83秒，2274商品、80卡片；后续清浏览器HTTP缓存但命中服务端数据缓存的trace为TTFB704ms、LCP1746ms、CLS0（无节流实验室样本，不是现场分位数）。不能把清浏览器缓存当作清空Oxygen子请求缓存，也不能将该慢请求直接归因于worker冷启动。
- 只读直接调用同版本Storefront API并逐请求计时：10个顺序索引查询（250×9+24）共约2.61MB，随后80张卡片查询；总8413ms。该探针在本机网络，不是Oxygen内部时钟。源码证实完整索引构建阻塞首屏，投影缓存300秒+SWR3600秒，命中快但未命中需重建；页面仍需完整索引以保持19组全量筛选及准确计数，不能截断成首250条。
- 局部方案归属既有app/lib/iphone-pro-collection.server.js：利用官方前/后向游标从集合两端读取，每轮两个别名连接，遇真实ID交集后按原顺序去重合并；不解码/伪造游标，不改UI/筛选接口、缓存时限、账户/购物车和支付。增加源模块回归，覆盖空/小集合、整页边界、2274商品、排序、错误及游标不前进；以同一真实集合全量ID/顺序/筛选输出对比，计时不能代替正确性。
- 付款前只读查验：正式店显示Accepting payments / Can't receive payouts，Manage不可用，未显示测试模式；开发店明确只能测试付款且尚无网关。已集中请求仅开发店测试网关和1个Internal QA测试商品的配置/发布范围，正式店不切测试模式、不扣款、不写正式订单。测试店结果与正式Hydrogen客户订单归属分别记录，不混称验证通过。

- 实际API否决了首版last无before方案（using last without before is not supported）；没有跳过该错误。已改为两个first:250连接，其中尾向显式reverse:true，分别使用API返回的endCursor；尾批翻转回原顺序后合并。原缓存输出类型和时限不变，14项源模块回归通过，真实API性能与输出对比继续。
- 用户进一步批准仅开发店启用官方测试网关、创建/发布1个Internal QA测试商品并模拟成功/拒付/异常；只在seine-shop-dropship-test执行，不改正式店。商品计划1.00、不追踪库存、非实体，无真实扣款/发货，测试记录保留。

### 商品卡 Bulk Buy 条件与接入范围（2026-11-27，本地候选）

- 用户要求调查部分卡片显示原因并实现本站入口。真实参考列表 `/c/iphone-duo-c131202/`：公开商品卡模块调用的条件为同 SPU 的 Items 数量大于 1 且 BulkBuyAvailable 为真，可购买区域还受销售状态约束；不是价格高、数量多或所有多规格商品必然显示。
- 浏览器正反例：Clear Case 6601228819A 悬停无入口；DUX DUCIS Expn 6601228897A 悬停有入口。点击后为六颜色逐行数量/价格/MOQ、总量与加购弹窗；未在来源站加购/提交。内部证据来自公开 GoodsItem/entry/BuyBulk 脚本及真实交互，不导入本站源码。
- 本站没有来源后台的资格开关，不伪造或新增来源字段。按本站现有支持能力映射：同一已发布 Product 至少两个不同 Variant 且有可购买规格时显示；单规格或全部不可售不显示。复用现有 ProductBulkBuy、当前 Shopify 单价及 LinesAdd，不能冒充已接通来源阶梯折扣。
- 修改归属既有共用集合商品卡、批量组件/公开规格接口、bulk-buy helper、主题样式及对应测试。桌面仍按悬停/键盘意图加载已有预览；触屏仅可见卡片按需加载，不对首屏80卡片新增SSR查询。不改商品/库存/价格/凭据/权限/路由。

- 浏览器续验暴露两个真实集成问题：顶层弹窗继承悬停层 pointer-events:none，且所在列表已有 GET 筛选 form，直接嵌入产生嵌套 form，提交退回文档导航而不是 fetcher。最初单独修 pointer-events 不足；改为将批量 dialog 通过 React portal 放到 document.body，与已有 HoverCart 相同，脱离筛选 form/悬停层。共用 modal hook 仅补可延迟挂载的 enabled 参数，其他调用默认行为不变；补回归并重新验证真实单次 POST/焦点/购物车。先前临时预览适配器还曾丢失请求 method/headers，已按官方 MiniOxygen Request 转换修正；该临时配置错误不算业务接口通过或正式故障。


### Bulk Buy、性能与开发店支付最终本机验收（2026-11-27，未推送/部署）

#### 性能实测与边界

- 最终实现是每轮两个独立 Storefront query 的 Promise.all 并发，不是上文试验中的单 query 双 alias；两端 first:250 / reverse:true 使用各自 opaque endCursor。2274条索引仍读取完整数据，共10个索引query+1个实时卡片query，但依赖轮数10→5。检测重复ID、游标停滞和非连续伪交集，不靠截首250条或延长缓存提速。
- `.cache/phone-loader-concurrent-2026-11-27.json` 交错顺序：after5837、before5813、after3000、before3876、after3207、before5593ms。中位 before5593→after3207ms（约43%），第一组无改善；每个样本2274条索引、顺序、全部筛选和80卡片hash均为 `c8472eb5cced23bdacf2f43ef0cff4d496449ad253efa430d70f9fae06451f8a`。如实保留完整方差，不选择性汇报最快样本。
- 最终本机构建整页新索引冷样本TTFB6587ms/总6595ms，随后服务端缓存命中156/161ms，均200/80卡；德语及日语Duo为200/40卡。探针在 `.cache/bulk-candidate-routes-2026-11-27.json`。整页还有根loader/渲染和本机网络开销，不能把API中位直接当整页或Oxygen生产指标；仍有冷延迟波动，生产性能待获准部署后实测。

#### Bulk Buy 逐项结果

- 实际多规格商品 SULADA iPhone Duo，Orange/Red/Black SKU6601249790A/B/C，均USD12.46，实际quantityRule minimum1/increment1/maximum null（本站上限9999）。打开全0时提交禁用；1.5触发德语错误/aria-invalid并禁用，改回整数恢复。最小量/步进/上限及重复ID、全部不可售、前100之外可售均有源模块测试。
- 初始集成发现dialog继承悬停层pointer-events:none；进一步发现外层GET筛选form导致嵌套form，表单退化为文档POST。已将dialog portal到body，表单无form祖先，hook在portal挂载后绑定焦点监听，保留详情页默认行为。CSS指针回归先失败后通过；真实浏览器由空数量的SubmitEvent不被拦截变为正确preventDefault，之后正常fetcher请求通过。没有以原先仅能显示弹窗作为功能通过。
- 临时构建预览首版适配器误传URL而非Request，导致method/headers丢失、POST被当GET；按官方MiniOxygen toMiniflareRequest修正，保留失败记录，未改业务路由。修正后一次原生提交留下3件/$37.38；portal修复后桌面单次POST `/cart.data` 200、路径仍集合、弹窗关闭并开抽屉，累计Orange4/Red2，共6件/$74.76；手机单次POST `/de/cart.data` 后Orange5/Red3，共8件/$99.68。三次购物车写入按各自版本分开记录，未点击结账或支付正式商品，购物车保留。
- 给pending cart补充selectedVariant显示数据，服务端既有白名单剥离客户端价格与metadata，Shopify决定实价。最终手机加购后控制台无error/warn；没有用缺失乐观数据错误当成功忽略。
- 德语390px触屏40卡，只滚动到可见区域加载4个预览，不是40个全发；无需悬停即可显示按钮，页面及dialog无横向溢出。德语、日语弹窗截图人工查看正常，绿色主题、标题/行/粘性合计及按钮可用。
- 日语离线打开显示本地化加载失败，提交禁用；恢复在线点再试行读取3个真实规格，错误消失。Esc关闭并归还trigger。预期的离线网络错误不冒充正常网络无错误。
- 单规格反例：Clear TPU Film（handle `1-set-for-iphone-duo-screen-protector-inside-front-back-cover-clear-tpu-film-transparent`），预览200、1个可售规格、hasNextPage false；已实际加载的卡片只有1个规格，无Bulk Buy。全部不可售及极高MOQ的隐藏规则为单元测试证据，没有伪造在线售罄商品。
- 详情页实际同商品回归：独立body dialog、3规格、全0禁用、Shift+Tab由Close回View cart、Tab回Close、Esc关闭并回Bulk Buy；桌面1280及390px页面无溢出。没有新建路由或改商品/库存/价格/权限/凭据。
- 规格接口实测合法200/非法handle400/不存在404，全部private,no-store/noindex,nofollow；200仅公开购买数据且含真实quantityRule，不含来源私有字段。网络结果不将会话Cookie或checkout token写入QA。

#### 开发店三种模拟支付

- 用户批准后仅在 `seine-shop-dropship-test.myshopify.com` 激活官方测试网关，并仅发布1个 `Internal QA — Checkout simulation — Do Not Fulfill`，Product15548652192017 / Variant68197750112529、USD1.00、不追踪库存、非实体商品；未改正式支付或库存。
- 已在开发店Preferences后台查到访问密码并正常输入实际开发店，不改密码保护，不向聊天/日志/文档写入密码。旧shopifypreview购物车不与实际域共用，因此通过保护后从唯一QA商品Buy it now进入真实开发店checkout。
- 专用保留地址qa@example.com，Internal QA / Do Not Fulfill，无营销勾选、无配送；测试有效期12/29及任意测试安全码。输入格式曾导致前端有效期校验失败，那些未到网关的尝试不算拒付/异常证据。
- 测试卡2（前台说明declined）返回通用付款失败；后台两次授权Failure，展开一条为Test=True、Bogus Gateway: Forced failure、processing_error。测试卡3（前台说明gateway failure）返回通用失败；后台Authorization/Failure，网关返回其测试规则说明。两者均为模拟器的失败路径，不冒充真实银行拒付或正式网关异常已验证。
- 卡1成功：确认页Your order is confirmed、Confirmation #M9IIEUXVL；后台订单 **#1001 / 19079881883921**，唯一QA商品1件、USD1.00，网关测试模式提示；展开Capture为Test=True、Success、Bogus Gateway: Forced success。订单Paid/Unfulfilled/Shipping not required；未发货、无真实扣款，不取消/删除测试记录、不擅自停用网关。保留的失败授权与成功Capture属于同一checkout/订单，不伪造三个成功订单。
- Shopify后台时间以店铺时区显示2:39am；核验日期为北京时间2026-11-27。正式店只读仍显示Accepting payments / Can't receive payouts（无法打款至收款账户），Manage不可用，原因未核实；需商家处理，不擅自更改。开发店结果不等于正式Hydrogen客户付款后订单归属通过。

#### 工程与SEO

- 最终210/210全量Node测试通过，lint0错误/2既有脚本console警告，codegen（含router typegen）及build exit0，集合筛选和构建来源暴露审计、git diff --check通过。新14项完整索引源模块测试含边界数量/排序/筛选/损坏分页/缓存隔离；新增modal portal与pointer回归。证据沿用 `.cache/bulk-buy-*-2026-11-27-final.log`。
- 官方Storefront 2026-04 GraphQL四个operation验证成功，保留既有ProductOption.values弃用警告；纯JS/JSDoc被独立组件validator当TSX推断any等，不计作通过，不加ignore绕过。实际源码测试、codegen及构建是本次适用工程证据，不声称完成全项目类型检查。
- URL未变、sitemap生成源及lastmod无需改。正式 `/sitemap.xml`（135分片）及en/ja/de collections-1代表分片均200、charset=utf-8，各含Duo及Pro规范地址一次，无购物车/账户/规格API。结果 `.cache/bulk-production-sitemaps-2026-11-27.json`，未全爬135分片。候选本机保持noindex，sitemap空索引与robots禁止索引是预览预期；最初误用 `/sitemap/collections-1.xml` 的404不算正确分片证据。候选上线后仍需正式页面及性能复验。
- 正常npm dev/CLI preview会话过期，已停止本任务失效进程；使用同版本官方MiniOxygen构建预览，HTTP127.0.0.1:3077、assets127.0.0.1:9101，未启用公开隧道/改认证。用户截图的设备授权码已过期，旧授权页已关闭，无需再填写。

#### 本次候选文件与发布边界

目标origin/main，以下15文件；不含三份并行QA、历史jpg、.env、缓存、商品或生产配置。完成前再审查本地提交及远程状态；本轮仍须单独批准push与Production部署，不能沿用上轮导航授权。

- README.md
- RELEASE-NOTES.md
- app/components/BestSellerQuickView.jsx
- app/components/ProductBulkBuy.jsx
- app/lib/bulk-buy.js
- app/lib/iphone-pro-collection.server.js
- app/lib/product-variants.server.js
- app/lib/use-modal-dialog.js
- app/locales/messages.json
- app/styles/brand.css
- storefrontapi.generated.d.ts
- tests/bulk-buy.test.mjs
- tests/phone-collection-loading.test.mjs
- docs/qa/2026-11-25-header-navigation.md
- docs/project-state.md

- 收尾：本任务标签32/33/34/44/45/46/47/50/51已关闭；保留21/24/27/35等其他任务标签，专用浏览器未退出。仅本机3077/9101预览正常停止，失效3075/3076 CLI已停止；不删除缓存、截图、商品、订单或购物车。后续获准发布时重新检查远程及构建，不复用过期设备码。
