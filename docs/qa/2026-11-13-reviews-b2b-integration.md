# 商品评价与在线询价：本地接入验收

日期：2026-11-13，北京时间。范围：本机 main 与专用 Chrome for Testing；开发服务 localhost:3000，构建预览 localhost:3001，仅本机访问。未公开发布。

## 实现与页面位置

- 标题下、价格上只放一行平均评分/评价数量入口；真实零评价显示 No reviews yet，不伪造星级。点击滚动至完整评价区。
- 详情图后、批发定制区前显示完整评价，详情导航增加锚点。支持评分筛选、分页、写评价和最多 6 张 2 MB 图片；视频不在本期范围。
- 首屏 Request a quote 和底部 Wholesale/OEM/ODM 共用在线弹窗；带入当前规格与数量，可增加同商品其他规格。当前所选为 White、数量 10 时，弹窗确实带入对应 SKU 与数量。
- 两条私有资源接口不加入 sitemap。商品规范 URL 和英/jp/de 版本不变，继续使用原动态商品 sitemap 生成源和 Shopify updatedAt，不伪造模板部署时间为商品 lastmod。

## 官方资料与真实读取

已实际读取 [Reviews 指南](https://docs.sectionly.ai/zh/reviews/headless)、[Reviews 完整契约](https://app-next.customerssay.ai/headless/docs)、[B2B 指南](https://docs.sectionly.ai/zh/b2b/headless)、[B2B 完整契约](https://b2b.sectionly.ai/headless/docs)和官方嵌入表单资产；没有安装未公开的 React 包。

用户单独批准本机两把开发私钥的创建和保存；只向 Git 忽略的本机 .env 追加两个变量，没有修改生产配置、旧密钥或其他值。B2B 权限为 config:read / products:read / inquiries:write，有效期 1 天；Customerssay 后台没有期限选项，本轮未另设期限。创建后未将密钥返回聊天、截图或提交，剪贴板在保存后清空。

真实只读 API 返回 200：

- Customerssay 代表商品 B-20A 当前已发布评价 0 条，平均评分 0；界面使用真实空状态。设置 requireName=false、requireTitle=false、requireFeedback=true、allowPhotos=true。评分与邮箱依接口契约必填。
- B2B defaultMoq=1、fields=[]；该商品 isQuotedProduct=false、hidePrice=false、showInquiryForm=false，专门报价商品列表为空。本期按用户确认接通网站既有通用询价入口，不启动应用的隐藏价格/隐藏购买按钮规则，不改变零售购买权限。
- 本机 Worker 的两个 setup 接口与评价列表均可读取真实配置。运行时不支持 fetch redirect:error，已改 manual 并拒绝 3xx，防止重定向泄露私钥。

## 自动验证

- npm run lint：0 错误，2 项既有脚本 console 警告。
- node --test tests/*.test.mjs：62/62 通过，其中新增业务工具行为测试 14 项，覆盖 MOQ/字段/数量、规格归属、CSRF/Origin、流式体积上限、幂等重试、错误脱敏、私人评论字段、图片归属及不跟随重定向。所有业务写入测试均拦截 fetch，不连接真实写接口。
- npm run codegen、npm run build：退出 0。独立 react-router typegen 已执行；CLI 内置 typegen 探测信息与 Rolldown bundle-analyzer/metafile 警告仍存在，应用产物生成成功，没有更改依赖或绕过检查。
- 集合筛选与构建来源暴露审计通过。
- 对仓库文件及客户端产物执行实际两把新私钥的精确匹配检查：0 命中；不输出密钥值。

## 浏览器与行为

- 1440×1000 桌面、390×844 手机无横向溢出；评分行未阻挡价格。英、日、德新增区域/表单可打开，日文特殊符号显示正常。
- 首屏直接打开询价；White + 10 正确带入；可添加 Black；读取实际 MOQ；错误聚焦、Tab/Shift+Tab 保持在弹窗内，Escape 关闭并回到原入口。共用图库弹窗也可打开关闭。零售购物车确认 White × 10、总价 USD 190，结账链接指向 Shopify 托管结账；没有点击继续结账。
- 本地临时拦截测试：询价第一次返回未知结果，表单锁定；第二次重试的 operationId 与 payload 逐字一致，显示本地测试编号。评价未知结果后第二次提交被阻止。拦截已通过页面刷新清除，截图没有测试成功状态或虚构评价。
- 同一专用浏览器的普通页面有扩展注入 PLASMO-CSUI/DIV 导致 hydration 警告；隔离的本地验收上下文只有 HEAD/BODY，构建预览无控制台警告/错误。未修改用户扩展、持久账号或系统配置。
- 构建预览初始 HTML 包含完整评价区域，零评价不输出 AggregateRating；不包含 businessCsrf/businessVisitor 或提交令牌。预览返回 noindex，正式域名未改。预览 /sitemap.xml 返回 200 和 application/xml; charset=utf-8；生产索引许可未开启的本机商品子 sitemap 按现有保护返回 404，该次显式探测产生一个预期资源 404，不是页面运行异常。另只读核对现有生产 sitemap 索引及英/日/德 products-1 子 sitemap，均为 200、UTF-8；代表商品原有三语言规范地址仍在，未混入业务 API 地址。此核对不代表本轮功能已发布。

## 截图

以下均为本机真实界面，不是生产截图，不包含凭据或模拟买家评价：

- [商品首屏两个入口，桌面](2026-11-13-reviews-quote-entry-desktop.jpg)
- [询价弹窗，White / 10](2026-11-13-b2b-inquiry-desktop.jpg)
- [详情图后完整评价区](2026-11-13-reviews-section-desktop.jpg)
- [商品首屏两个入口，手机](2026-11-13-product-entries-mobile.jpg)

## 边界与后续

未获准执行真实评价/图片上传、询价、草稿订单或通知测试，所以真实写入、审核后展示、图片存储域名/代理、草稿订单异步结果与通知均待验。单元测试不能代替这些真实结果。未实现视频、持久化跨刷新询价草稿、可信顾客身份验证标记或完整 B2B 价格/账户权限体系。

B2B 开发密钥一天后失效；正式上线前需要单独批准并配置生产凭据。当前仅本地实现和只读接入，未 push、未部署、未改变店铺密码或执行完整结账。现有未提交的旧发布方案/进度文件和截图保留，不混入本次提交，也不自动删除。
