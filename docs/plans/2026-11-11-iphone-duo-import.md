# iPhone Duo 商品导入

用户已授权采集全集合、保留全部参数和来源链接、按原价上架；明确普通价与批发阶梯价都做。无 TVCMALL API Key，使用浏览器 DOM 采集。

## 最新范围

用户后续选择：先上架普通单价，批发阶梯价仅存后台。批发自动折扣和付费应用不再属于本批范围。完整分页清单已保存：12 页、906 个唯一链接。

现有店铺已定义 `custom.source_urls`（list.url）、`custom.source_snapshot`（json）、`custom.sourcing_record`（json）、`custom.source_captured_at`（date_time）、`custom.source_detail_status`（single_line_text_field），均 Storefront NONE；复用这些字段，替代下方初步设计的 sourcing 命名空间。商品参数复用 `custom.technical_specifications`（json / PUBLIC_READ），仅含公开规格。变体尚无自定义定义，完整 SKU 记录可嵌套在商品 source_snapshot 中，以真实 SKU 为键保留。

店铺标题匹配 iPhone Duo 的商品为 13 个；首个来源 SKU 已存在且售价 2.02 USD，本次匹配后更新到来源单价 1.01 USD，不重复创建。

## 已核实

- 店铺：ps83if-c4.myshopify.com / Seine Shop；USD；Basic。
- CLI 已获商品写入、发布、折扣读写及库存/地点只读权限。此前仅 Hydrogen 关联的限制已解除。
- 实时列表显示 906 组，80/页、12 页；采集完成后核对去重与分页覆盖。
- 首个 SKU 6601228819A：USD 1.01 / 0.99 / 0.97 / 0.96 / 0.95 / 0.94，分别从 1 / 5 / 25 / 60 / 150 / 300 件起。
- 当前 Hydrogen 前台批发模块为询价，不实现自动阶梯优惠。
- Shopify 自动折扣最多 25 个；Basic 不支持自定义 App Functions，需检查现有公开应用或适配的公开应用，不能创建数千条独立自动折扣替代。

## 字段设计（写入前先复用现有定义）

| 归属 | namespace.key | 类型 | 用途 | 访问 |
| --- | --- | --- | --- | --- |
| Product | sourcing.source_url | url | 首个来源链接，后台可点开 | 管理端，Storefront NONE |
| Product | sourcing.source_group | single_line_text_field | 来源 SPU/分组标识 | 管理端，Storefront NONE |
| Product | sourcing.snapshot | json | 来源集合、全部原始字段、采集时间及完整性 | 管理端，Storefront NONE |
| ProductVariant | sourcing.source_url | url | 对应 SKU 原链接 | 管理端，Storefront NONE |
| ProductVariant | sourcing.snapshot | json | SKU、选项、包装重量、所有参数、采购阶梯价及采集时间 | 管理端，Storefront NONE |
| ProductVariant | custom.quantity_prices | json | 实际销售用 USD 数量档位 | 按最终计价实现配置；不得包含来源链接 |

商品名称、描述、SKU、选项、图片和单件价格使用原生字段。对已有商品按来源映射及 SKU 检查重复；不能覆盖无关商品。新商品 handle 对应品类与适配型号，保持稳定。同款只按来源关联证据合并，不能仅以标题猜测。

## 执行及验收

1. 保存全分页去重清单；逐款逐 SKU 抓取描述、参数、包装、图片、变体和各档价格，保留缺失标记。
2. 读现有字段定义、重复商品、发布渠道与折扣设施；确认阶梯计价方案。
3. 准备完整可审查样本，再建立缺少的字段定义、写入商品及变体；逐项读回。
4. 全批次导入、发布到正确的 SeineShop 渠道；按清单核对数量、规格与价格。
5. 前台与购物车核对档位边界，验证结账报价但不付款。计价未就绪不得宣称完整上架成功。

参考：[Shopify Functions](https://shopify.dev/docs/apps/build/functions)、[自动折扣限制](https://help.shopify.com/en/manual/discounts/discount-methods/automatic-discounts)。

## 完成记录（2026-11-12）

原始 906 组及新增 2 组共 908 组、3,643 SKU 已完成。新增 895 Product，既有 13 Product 保留 handle 更新并补 19 个变体。普通单价 ×1、阶梯价仅私有存档，未启用批发结账。全部三渠道发布，建立 iphone-duo 集合；最终全量读回零差异。2 张来源图片 404，原链接及原因已存档。详见 [验收记录](../qa/2026-11-12-iphone-duo-import.md)。
