# Cloudflare 部署

当前个人主页可以直接部署到 Cloudflare Workers Static Assets。文章继续从现有 Supabase 读取，页面不需要动态 Worker、D1 或 R2。

已部署地址：[轩颖的小世界](https://xuanying-homepage.xuanying-personal-homepage.workers.dev/)。Worker 名称为 `xuanying-homepage`。

这份配置部署的是当前 HTML / CSS / JavaScript 主页。Next.js 和 Payload 在线写作后台属于后续升级，尚未接入本项目。

## 授权与部署

在项目目录执行：

```sh
npm ci
npx wrangler login
npx wrangler whoami
npm run deploy:cloudflare
```

`wrangler login` 会打开 Cloudflare 浏览器授权页。仅登录 Cloudflare 网站不会自动授权本机 CLI。完成后，`whoami` 应显示预期账号。

部署命令先运行已有博客与数据库权限测试，再构建和上传到同一个 Worker。

更新网页代码后重新执行 `npm run deploy:cloudflare`。Supabase 中的文章编辑会由网页直接读取，无须重新部署。当前 Cloudflare 使用 Wrangler 发布，尚未配置 GitHub 推送后自动发布；仓库现有 GitHub Actions 仍部署到 GitHub Pages。

此命令不创建付费订阅。静态资源请求的计费与限额以 [Workers Static Assets 官方文档](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/) 为准。

## 本地验证

```sh
npm run preview:cloudflare
```

使用 Wrangler 输出的本地地址验证主页、博客、实用工具和移动端布局。当前网站没有服务端函数；博客请求直接访问 Supabase，仍由已配置的 RLS 限制访问。

## 发布范围

`scripts/build-static.mjs` 仅复制公开文件到 `_site/`。Cloudflare 与 GitHub Pages 共用这份输出，源代码、测试、SQL 和环境文件不上传。

`supabase-config.js` 中只有项目 URL 和公开的 publishable key，可随网页发布。数据库密码、Supabase service role key、Cloudflare 令牌不能写入这个文件。

`.dev.vars`、`.env*`、`.wrangler/` 和 `_site/` 已忽略。Cloudflare 授权由 Wrangler 存储在本机，不通过 Git 同步。

## 后续 Next.js 博客

完整在线写作后台需要新增应用代码、管理员权限与内容迁移。部署 Next.js 动态应用时，需要调整为相应的 Workers 构建输出，不能直接将 `.next/` 当作静态目录上传。

Payload 的官方 Cloudflare 模板使用 OpenNext。隔离验证项目已在当前账号成功部署，并通过基本认证接口检查；完整在线编辑、Supabase PostgreSQL 适配和免费额度下的持续运行仍需进一步验证。详见 [实际验证记录](cloudflare-verification.md)。

- [Cloudflare Next.js 部署文档](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)
- [Payload 官方 Cloudflare 模板](https://github.com/payloadcms/payload/tree/main/templates/with-cloudflare-d1)
- [Cloudflare Workers 限额](https://developers.cloudflare.com/workers/platform/limits/)
