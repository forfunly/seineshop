# 本地工程对齐远程 main 方案

日期：2026-11-02。状态：本地源码对齐和规则合并完成，验证结果及缺口见 [对齐验收](../qa/2026-11-02-remote-alignment.md)。用户已回复“开始”批准方案；平台拒绝自动删除后，用户手动清理并回复“已清理”。未推送或部署；此前保留旧工程和迁入管理工具的方案已被用户最新要求替代。

## 结果与范围

- 工作目录固定为 D:\AI_workspace\seineshop，仅保留远程 origin/main 的一套代码、配置、依赖和测试；唯一需要合并的本地成果是用户此前确定的项目规则。
- 当前只有一个 Git 工作树，没有额外工作树。远程当前为 407eeab，实施前再次 fetch 并检查新增提交及差异。
- 只合并 AGENTS.md、docs/rules/ 中 SEO/商品/工程/Git 规则及必要的当前状态说明；其中每次 push 前必须单独询问用户的最新约定优先。
- 不迁入旧前台、旧管理脚本，不新增旧工程备份目录，不升级远程 Hydrogen，不改远程页面功能。
- 既有 .env、.shopify/ 与 .git/ 保留原位，不输出凭据、不修改环境变量、不删除 Git 历史。

## 已批准并由用户完成的清理范围

所有目标先解析绝对路径并核对在 D:\AI_workspace\seineshop 内，禁止计算路径越界；以原生 PowerShell 对已列明路径操作，不跨 shell 拼接删除命令。

- 需要删除后用远程原版恢复的旧目录：app/、public/、scripts/。
- 不属于远程基线的旧目录：.agents/、.claude/；旧依赖及生成物：node_modules/、dist/、.react-router/。
- 不属于远程基线的旧文件：server.ts、vite.config.ts、react-router.config.ts、tsconfig.json、tsconfig.graphql.json、tsconfig.tsbuildinfo、.npmrc、LICENSE。
- package.json、package-lock.json、env.d.ts、.env.example、.gitignore 和 README.md 用远程版本对齐；这些文件不带旧逻辑合并。先确保实际 .env 及 .shopify 在整个过程不被提交或删除。
- docs/ 下历史记录不作为活跃开发规则；本次不批量删除文档，也不把旧验收结论当成新工程验证结果。

## 实施步骤

1. 确认用户批准上述清理及首次代码对齐后，再次 fetch 并复核远程变化；保留最新规则文本到既有 Git 对象，不创建旧工程副本，不包含真实凭据。
2. 清理已批准的旧文件与目录，用正常 Git 操作建立跟踪 origin/main 的本地 main 并恢复远程完整工程；不强制 checkout、不 reset --hard。
3. 仅合并最新规则及准确的当前状态说明；保留远程 README/RELEASE-NOTES 的操作方式，禁止新增旧管理工具的 npm scripts。
4. 按远程锁文件安装本地依赖，检查只存在一套入口和配置；不修改系统设置、全局依赖或 CI/CD。
5. 执行远程测试、lint、构建、集合筛选与构建产物来源暴露检查；如存在基线问题，查根因并如实报告，不跳过或绕过。
6. 运行本机预览需要 SESSION_SECRET，现有 .env 缺少该字段；此方案不自动修改 .env。未经进一步授权时完成可执行的代码/静态/构建验证并列明本机运行缺口，不伪造验证通过。
7. 检查与远程差异只包含规则文档，工作区没有旧配置/旧页面混用。准备可审查的本地提交及验证结果；每次 push 前再次征求用户针对本次提交的同意。

## 本轮边界

本轮按已批准方案恢复远程源码，只合并规则；不修改 Shopify 商品、库存或线上配置，不关闭访客密码，不执行 push 或生产部署。`.env` 与店铺关联保持不变；旧验收文档仅本机保留，不作为本轮验证证据。
