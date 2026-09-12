# Supabase 接入验证记录

验证日期：2026-09-12（Asia/Shanghai）。

## 本地自动检查

- `npm test`：7 项全部通过。
- 在 PGlite PostgreSQL 中实际执行建表迁移：匿名和普通登录角色可以读取已发布文章，草稿和未来发布文章不可读；INSERT、UPDATE、DELETE、TRUNCATE 均被数据库拒绝。
- 验证前端公开密钥配置、正文和卡片文本转义、稳定分页、空数据库、HTTP 错误及无效响应。
- 四个 JavaScript 文件通过 `node --check`，`git diff --check` 通过。

## 实际 Supabase 项目

- 项目：`my-page` / `bclkpczvgzmraytxqdfv`，新加坡区域，创建完成状态 `ACTIVE_HEALTHY`。
- 已通过 Supabase CLI 的 Management API 查询入口执行一次迁移，建立 `public.blog_posts` 并迁入 3 篇原有示例。
- 使用前端 publishable key 调用实际 Data API，成功读取 `office`、`music`、`journal` 三篇文章。
- 同一公开密钥的 POST、PATCH、DELETE 请求全部返回 HTTP 401 / PostgreSQL `42501`，没有写入文章。
- `supabase/verify.sql` 在实际云端事务中验证草稿、未来文章不可读取，并回滚临时数据。返回：RLS 开启、匿名可读取、匿名/普通登录角色不可写入、残留测试记录 0。
- 数据库密码已保存在本机 macOS Keychain；前端配置仅包含公开项目 URL 和 publishable key。

## 浏览器

- 实际云端配置：桌面和 390px 手机宽度均显示 3 篇文章，无控制台错误；手机文档宽度未超过视口。
- 手机正文弹窗正常显示标题、段落、小标题、列表和引用；关闭后恢复文章卡片焦点。
- 本地受控响应：首次请求失败显示重试，点击后恢复 3 篇；空数组显示空状态且不显示示例卡片；8 篇数据先显示 6 篇，再加载为 8 篇，分页按钮随之隐藏。
- 文字统计输入“你好 Supabase”：总字符 11、中文 2、英文词 1；专注计时显示 25:00；待办仍显示仅保存在当前浏览器。
- 测试用浏览器视口已恢复，测试页面放在被忽略的 `.playwright/` 目录，未纳入发布文件。

GitHub Pages 工作流会重新运行同一套测试，再发布明确列出的静态文件和本地资源。

## GitHub Pages 发布

- 已推送代码提交 `1be0c0cbddda9ed8ef820b96e1380f9bf74aa71a`。
- [部署工作流 34661602103](https://github.com/zhanxuanying/my_page/actions/runs/34661602103) 状态为 `completed / success`。
- 线上 `index.html`、`styles.css`、`app.js`、`blog.js`、`blog-data.js`、`supabase-config.js` 均返回 HTTP 200，SHA-256 与本地一致。
- 使用线上域名 Origin 请求实际 Supabase Data API，HTTP 200、CORS 允许，读取到预期 3 篇文章。
- 本地浏览器已验证真实 Supabase 连接；线上页面的额外浏览器复查因浏览器工具超时未完成，线上静态文件和 API 通过上述 HTTP 检查核验。
