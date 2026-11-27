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
