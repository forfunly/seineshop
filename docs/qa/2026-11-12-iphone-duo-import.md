# iPhone Duo 商品导入验收

2026-11-12，北京时间。用户授权当前浏览器采集全集合并上架；普通售价等于来源主报价，批发阶梯价仅存后台。本记录是商品数据发布验收，不是前台代码部署记录。

## 结果

- 来源清单：原始 906 组 + 次日新增 2 组 = 908 组，3,643 个唯一 SKU。
- Shopify：新增 895 Product / 3,611 SKU；更新既有 13 Product / 32 SKU，其中新补 19 个颜色变体。保留原有商品 handle 和库存。
- 908 Product 全部 ACTIVE，发布到 Online Store、Headless、SeineShop Hydrogen 三渠道。
- 新建集合 `gid://shopify/Collection/487578140931`，handle `iphone-duo`，按标题包含 iPhone Duo 自动归集；读回数量 908，集合三渠道均已发布。
- 逐 SKU 核对价格、来源 URL、完整批发价阶梯、唯一性、主图 READY 和渠道发布：零差异。
- 新商品未捏造库存数量，采用不跟踪库存；私有记录明确 `inventory_verified: false`。供货库存需要下单前重新确认。

## 数据保存

| 字段 | 类型 | 用途 | Storefront |
| --- | --- | --- | --- |
| custom.source_urls | list.url | 全部 SKU 原链接 | NONE |
| custom.source_snapshot | json | 原始 DOM 记录、规格、图片 URL、全文或分段索引 | NONE |
| custom.source_snapshot_part_01 至 _03 | json | 21 款式大商品的完整原始记录分段 | NONE |
| custom.sourcing_record | json | 按 SKU 保存普通价、阶梯价、币种、MOQ、来源 | NONE |
| custom.source_captured_at | date_time | 采集时间 | NONE |
| custom.source_detail_status | single_line_text_field | 完整性及异常说明 | NONE |
| custom.technical_specifications | json | 可公开的产品规格 | PUBLIC_READ |
| custom.compatible_models | list.single_line_text_field | 适配型号 | PUBLIC_READ |

后台进入商品 → 元字段，可查看原链接和来源记录；较大商品从 `source_snapshot.snapshot_parts` 读取分段。价格按采集时间快照保存，不构成后续自动同步。

## 图片例外

导入时来源服务器多次超时，已补传并按原始文件逐一核对可用副本。最终仅以下两个原始画廊文件持续 404，属于商品 9797408784643 的 C/G 变体：

- `800x800_6601245596C-5.webp?v=20261028171552`
- `800x800_6601245596G-13.webp?v=20261028171553`

完整 URL 与原因保存在该商品 `custom.source_snapshot.unavailable_source_images`。各变体主图均正常，其他可用图片已上传。失败媒体记录未擅自删除。前台现有图库组件只展示部分媒体，变体切换仍可显示对应主图；所有成功上传图片保留在 Shopify 后台。

## 验证与证据

被忽略的本地目录：`.cache/catalog/iphone-duo-2026-11-11/`。

- `listing-pages.json`、`additional-listing.json`、`groups.json`、`products/`：浏览器原始采集。
- `imported-products.json`、各批次 `*-results.jsonl`：实际创建和发布返回结果，包含失败及修复历史。
- `final-catalog-audit.jsonl`、`final-audit-summary.json`：最终 908 Product / 3,643 SKU 全量读回，问题列表为空。
- `verify-existing-final.json`：既有 13 Product 的 32 SKU、完整私有快照及所有媒体核对一致。
- `snapshot-audit.jsonl`、`snapshot-audit-summary.json`：908 商品 / 3,643 SKU 原始快照全量读回，与本地逐字段无损比对零差异。
- `verify-015.json`：21 款式商品分段快照还原，与本地原始记录逐项一致。
- `final-definitions.json`：私有访问权限、集合 908 数量与三个发布渠道。
- `final-coverage-audit.json`、`retry-final-check.json`：补传图片覆盖审计及两项 404。
- `storefront-collection.png`、`storefront-product.png`：真实域名前台截图。

前台实测 `https://www.seineshop.com/collections/iphone-duo` 显示商品和价格；21 款式商品由 B424 切换到 B412，SKU 更新为 6601249069U、主图更新、未出现破图；页面可见文本无来源站名称或私有字段。普通价 $2.46，批发区域沿用现有询价展示，没有把后台阶梯价作为自动折扣。

执行验证：

```sh
python3 scripts/audit-tvcmall-import.py --root .cache/catalog/iphone-duo-2026-11-11
node --test tests/tvcmall-import.test.mjs
npm run lint
git diff --check
```

3 项工具测试通过：普通报价选择、UTF-8 分段无损还原、公共 HTML 清理。进度 HTML 内联脚本语法、UTF-8 响应与本机浏览器中文/数量显示通过。Lint 0 errors，2 项既有 `no-console` warnings（原审计脚本）。本次未改前台源码，未运行前台构建/部署；未改变店铺密码，未新增订单或执行完整结账，未推送 Git。

最终只读批量查询形状（通过已授权 Shopify CLI 执行，凭据不写入文件）：

```graphql
{
  collection(id: "gid://shopify/Collection/487578140931") {
    products {
      edges {
        node {
          id
          handle
          status
          sourceUrls: metafield(namespace: "custom", key: "source_urls") { value }
          sourcing: metafield(namespace: "custom", key: "sourcing_record") { value }
          variants {
            edges {
              node {
                id
                sku
                price
                image { url }
                media { edges { node { id status } } }
              }
            }
          }
          resourcePublications {
            edges { node { isPublished publication { id name } } }
          }
        }
      }
    }
  }
}
```
