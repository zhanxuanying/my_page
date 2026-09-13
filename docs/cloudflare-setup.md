# Cloudflare 部署与维护

应用地址：[轩颖的小世界](https://xuanying-homepage.xuanying-personal-homepage.workers.dev/)。Worker 名称 `xuanying-homepage`，后台 `/admin`，博客 `/blog`。

## 当前架构

- Next.js 16 / Payload 3 / Lexical 提供后台、API 和阅读页。
- OpenNext 输出 Cloudflare Worker；原主页和图片等公开文件由 Static Assets 提供。
- Supabase 项目 `bclkpczvgzmraytxqdfv`：CMS 使用独立 `payload` schema，连接角色 `xuanying_cms` 仅拥有此 schema；旧 `public.blog_posts` 保留。
- Hyperdrive `xuanying-cms` 绑定为 `HYPERDRIVE`，查询缓存已关闭，保证发布和权限修改立即生效。
- Supabase Storage `blog-media` 为公开图片桶，写入仅经服务端授权接口。

当前配置沿用免费方案，没有开通付费订阅。动态请求、数据库与存储仍受平台额度约束；以 [Workers 限额](https://developers.cloudflare.com/workers/platform/limits/)、[Hyperdrive 方案](https://developers.cloudflare.com/hyperdrive/platform/pricing/) 和 [Supabase 方案](https://supabase.com/pricing) 为准。

## 本地配置

```sh
npm ci
cp .env.example .env
```

仅在 `.env` 中填写：

| 变量 | 用途 |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | 本地为 `http://localhost:3000`，线上为正式网址 |
| `SUPABASE_URL` | Supabase 项目网址 |
| `DATABASE_URL` | 专用 CMS 角色的 PostgreSQL 连接串 |
| `DATABASE_CA` | Supabase 提供的数据库 CA 证书，保留 PEM 换行 |
| `PAYLOAD_SECRET` | 长随机会话签名密钥 |
| `SUPABASE_SERVICE_ROLE_KEY` | 服务端图片存储权限，禁止放入前端配置 |

本地数据库连接使用 CA 验证，线上通过 Hyperdrive 连接。Supabase 的 CA 可在数据库 SSL 设置中下载。[官方 SSL 说明](https://supabase.com/docs/guides/platform/ssl-enforcement)。

运行 `npm run dev` 后访问 `http://localhost:3000`。现有数据库已迁移，不要重新初始化或覆盖内容。

## 生产发布

```sh
npx wrangler login
npx wrangler whoami
npm run deploy:cloudflare
```

发布脚本运行测试、类型检查、OpenNext 构建，然后部署同一个 Worker。生产网址从 `wrangler.jsonc` 读取，不会误用本地 `.env` 中的 localhost。

首次设置或轮换凭据时，使用 `wrangler secret put` 分别设置 `DATABASE_URL`、`DATABASE_CA`、`PAYLOAD_SECRET`、`SUPABASE_SERVICE_ROLE_KEY`。这些 secret 已为当前 Worker 设置。构建脚本清除 OpenNext 默认复制的私有环境文件，服务端凭据仅通过运行时 secrets 提供。普通发布保留已有 secrets。

本机的 `.env`、`.dev.vars` 和 `artifacts/` 是私有配置或验证资料，均被 Git 忽略。不能上传到 GitHub；不要把 `.env`、数据库密码或 service role key 放进 `public/`。

`npm run preview:cloudflare` 可启动本机 Workers 预览。CLI 包装脚本自动从私有 `.env` 读取 `DATABASE_URL`，为 OpenNext 的本地平台代理配置 Hyperdrive 连接；也可使用 `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE` 覆盖。日常 UI 开发使用 `npm run dev` 更方便。

## 数据库维护

迁移在 `src/migrations` 中。应用禁用启动时自动修改数据库结构；应用部署不会执行迁移。修改模型后先生成迁移并检查 SQL，再运行：

```sh
npm run payload -- migrate:create
npm run migrate
npm run generate:types
npm run generate:importmap
```

初次搭建其他环境时，需要先建立专用数据库角色及 `payload` schema，授予该角色此 schema 的所有权，并撤销 `PUBLIC`、`anon`、`authenticated` 对此 schema 及其默认表/序列的权限。Hyperdrive 连接使用该专用角色，关闭查询缓存。不要使用 `postgres` 超级权限作为应用运行账户。

原内容迁移工具 `npm run import:posts -- /path/to/legacy-posts.json` 按 slug 跳过已有文章，可安全重跑；本项目三篇旧笔记已导入。管理员初始化及恢复见 [写作说明](writing-guide.md)。

## 验证

```sh
npm test
npm run typecheck
CMS_ADMIN_EMAIL=your-email@example.com CMS_TEST_URL=https://your-worker.workers.dev npm run verify:cms
```

最后一个命令从 macOS 钥匙串读取管理员密码，在指定站点创建临时验证文章和图片，验证权限、发布与历史后删除自己的记录。它会真实写入数据库，只在明确要检查的环境运行。报告保存在被忽略的 `artifacts/`。

## GitHub Pages

推送 `main` 后，`.github/workflows/pages.yml` 执行测试和 `npm run build:static`，只上传公开文件到 `_site/`。该镜像的文章接口和阅读链接指向 Cloudflare。GitHub Pages 不托管 Next.js 后台；Cloudflare 仍通过上述命令独立发布。

参考：[Cloudflare Next.js 文档](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)、[Payload Cloudflare 模板](https://github.com/payloadcms/payload/tree/main/templates/with-cloudflare-d1)。
