# 商品管理 API 接入验收

时间：2026-11-05 16:58（北京时间）。仅本机认证与只读验证；没有商品变更、前台部署或推送。

## 授权与连接

用户明确要求自行生成、配置商品管理凭据，并回复“已授权”完成 Shopify 授权页。复用项目 CLI 3.93.2 的官方认证能力，实际安装身份读回为 Shopify CLI Connector App，目标仅 ps83if-c4.myshopify.com。此次没有恢复或轮换旧 SeineShop AI Manager 的 offline token。

CLI 保存 online 会话及其刷新信息；不导出到 .env，不在文档保存 token。会话失效/权限不足时重新授权，不将其当作永久 offline token。

## 实际验证

- Shopify Toolkit 对 Admin 2026-10 查询验证通过，所需 scope：read_products。
- store auth 退出 0，确认目标店铺认证成功。
- store execute 退出 0，响应 shop.name=Seine Shop、myshopifyDomain=ps83if-c4.myshopify.com。
- currentAppInstallation.app.title=Shopify CLI Connector App。
- accessScopes 精确读回：write_products、read_products。
- products(first:1) 读回 gid://shopify/Product/9764421861635，B-20A 3-in-1 Foldable Wireless Charging Station。
- 只读调用未使用 --allow-mutations；没有实际测试商品写入。写权限已授予和具体业务写入已获批准是不同事实。
- 本轮 fetch 退出 0，双向提交日志为空；本地未提交资料保留。

## 后续复用

从项目根目录运行（沿用项目自带 Node，不安装全局依赖）：

```sh
export PATH="/Users/a1234/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH"
OPT_OUT_INSTRUMENTATION=true node node_modules/@shopify/cli/bin/run.js store execute --store ps83if-c4.myshopify.com --version 2026-10 --query 'query { shop { name myshopifyDomain } currentAppInstallation { app { title } accessScopes { handle } } products(first: 1) { nodes { id title } } }' --json
```

仅当会话失效或需要重新认证时使用：

```sh
OPT_OUT_INSTRUMENTATION=true node node_modules/@shopify/cli/bin/run.js store auth --store ps83if-c4.myshopify.com --scopes read_products,write_products
```

授权页由用户本人完成；实际商品修改按用户具体任务确定范围。不要将 API 凭据导入前台或公开资源。

参考：[Shopify AI Toolkit](https://shopify.dev/docs/apps/build/ai-toolkit)；本机命令选项已通过该版本 CLI --help 核对。
