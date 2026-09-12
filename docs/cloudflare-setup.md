# Cloudflare 部署

当前个人主页可以直接部署到 Cloudflare Workers Static Assets。文章继续从现有 Supabase 读取，页面不需要动态 Worker、D1 或 R2。

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

部署命令先运行已有博客与数据库权限测试，再构建和上传。部署完成后使用 Wrangler 返回的 HTTPS 地址；账号的 Workers 子域名确认之前，不预先假设线上地址。

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

Payload 的官方 Cloudflare 模板使用 OpenNext。官方模板仍提示需要付费 Workers，但 Cloudflare 最新限制已调整；实际运行适配、启动时间和免费 CPU 限额需要验证，不能仅凭构建成功承诺免费稳定运行。

- [Cloudflare Next.js 部署文档](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)
- [Payload 官方 Cloudflare 模板](https://github.com/payloadcms/payload/tree/main/templates/with-cloudflare-d1)
- [Cloudflare Workers 限额](https://developers.cloudflare.com/workers/platform/limits/)
