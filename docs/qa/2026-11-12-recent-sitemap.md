# 近期 URL 的生产 sitemap 核对（2026-11-12）

用户要求将近期更新 URL 全部同步到 sitemap。读取正式 https://www.seineshop.com/sitemap.xml 及全部 108 个子 sitemap，解析 22,011 个条目与 22,011 个唯一 URL，无重复。

## 范围与结果

- 根据本批导入清单，核对 908 个商品 handle。
- 同时核对 `/collections/iphone-duo`、`/page/order-tracking`、`/support`、`/collections`、`/discover/b20a` 与首页。
- 英、日、德每种语言 914 个预期地址，共 2,742 个，缺失均为 0。
- 旧 `/order-tracking` 及其日、德地址均不在 sitemap；新 `/page/order-tracking` 及对应语言地址均已包含。
- 每种语言的 908 个商品条目均包含数据源生成的 lastmod。静态页面未凭此次核查伪造修改时间。
- 抽查新物流页、iPhone Duo 集合及一个本批商品：正式 HTML 可读取，canonical 自指，robots 为 index/follow。未逐个请求全部 2,742 个落地页。
- 11 项 sitemap 测试通过。

## 处理结论

此前商品数据和路径变更已随动态 sitemap 在生产生效，本轮发现零遗漏，因此没有改写生成器、重复添加条目、伪造 lastmod 或执行无必要的部署。未向 Search Console 重复提交，未声称 Google 已收录。未推送 GitHub。

原始汇总保存在本地忽略文件 `.cache/tooling/recent-sitemap-audit.json`。首次 Python HTTPS 批量读取遇到临时 TLS 连接中断；随后使用证书校验正常的 curl 重试完成全部分片读取，没有跳过失败分片。
