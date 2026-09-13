# 轩颖的小世界

占轩颖的个人主页与在线写作空间。粉色、兔子、温柔的动画，配上随时能打开的写作间。

- [个人主页](https://xuanying-homepage.xuanying-personal-homepage.workers.dev/)
- [博客与阅读](https://xuanying-homepage.xuanying-personal-homepage.workers.dev/blog)
- [在线写作后台](https://xuanying-homepage.xuanying-personal-homepage.workers.dev/admin)

## 功能

主页保留个人介绍、王菲音乐角落、专注计时器、今日清单与文字统计。

写作后台采用开源 Payload CMS，提供中文富文本编辑器、自动保存、私密草稿预览、发布与下架、历史版本恢复、分类标签、封面及正文图片库。原有三篇示例笔记已经迁入。阅读页支持搜索、分类、目录、进度条、字号调整、分享、前后篇、RSS 与搜索引擎元数据。

[写作使用说明](docs/writing-guide.md) · [部署与维护](docs/cloudflare-setup.md) · [验证记录](docs/cloudflare-verification.md)

## 开发

需要 Node.js 22 或更新版本。安装依赖，把 `.env.example` 复制成 `.env` 并配置数据库与服务端密钥，然后运行：

```sh
npm ci
npm run dev
```

访问 `http://localhost:3000`。`npm test` 检查权限规则、内容安全、图片校验、主页接口及原数据库 RLS；`npm run typecheck` 检查类型；`npm run build:cloudflare` 生成生产 Worker。

## 技术与数据

Next.js + Payload + Lexical 提供动态后台和博客，OpenNext 将应用部署到 Cloudflare Workers。Supabase PostgreSQL 的独立 `payload` schema 存储文章、历史和管理员；Hyperdrive 管理生产数据库连接；Supabase Storage 的 `blog-media` bucket 存储公开图片。

首页通过 `/api/notes` 读取 CMS 已发布文章。以前的 `public.blog_posts` 表保留为迁移前备份，编辑该旧表不会再更新新博客。数据库密码和服务端密钥不会提交到 Git，也不会打包进网页资源；线上通过 Worker secrets 注入。

GitHub Actions 继续发布静态主页镜像到 [GitHub Pages](https://zhanxuanying.github.io/my_page/)，镜像的文章入口连接 Cloudflare 博客。Cloudflare 应用通过 `npm run deploy:cloudflare` 单独发布；推送 GitHub 不会自动更新 Worker。

## 常用文件

| 文件 | 用途 |
| --- | --- |
| `index.html`、`styles.css`、`app.js` | 原个人主页、动画与工具 |
| `blog.js`、`cms-config.js` | 主页博客接口与文章卡片 |
| `src/app/(blog)`、`src/components` | 博客列表、阅读页和组件 |
| `src/collections`、`src/payload.config.ts` | 后台数据模型、权限与编辑器 |
| `src/storage`、`src/migrations` | 图片存储、数据库迁移 |
| `wrangler.jsonc`、`scripts/build-cloudflare.mjs` | Cloudflare 配置与生产构建 |

待办只保存在当前浏览器；计时器刷新后重置；文字统计不发送网络请求。主页不自动播放音乐，不包含歌曲音频。兔子插画由 ImageGen 为此主页生成，保存于 `assets/bunny-hero.png`。
