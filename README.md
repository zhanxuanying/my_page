# 轩颖的小世界

占轩颖的个人主页。粉色、兔子、温柔的动态效果，以及实用的日常小工具。

## 页面内容

- 个人介绍：21 岁、女生、文员，喜欢王菲和兔子。
- 音乐角落：王菲主题卡片，链接到网易云音乐搜索。
- 专注时光：25 分钟专注 / 5 分钟休息，支持开始、暂停、继续和重置。
- 今日小清单：添加、勾选、删除事项，保存在当前浏览器。
- 文字小助手：实时统计字符（含空白 / 不含空白）、中文字符、英文单词。
- 博客笔记：从 Supabase 读取已发布文章；支持阅读全文、分页、空状态和加载重试，已迁入 3 篇示例笔记。
- 移动端导航、键盘可操作弹窗，以及减少动态效果的无障碍支持。

## 本地预览

无须安装依赖，也没有构建步骤。在项目目录执行：

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

打开 http://127.0.0.1:4173 。也可以直接打开 `index.html`，本地存储会受浏览器的本地文件策略影响。

## 发布到 Cloudflare

执行 `npm ci` 安装部署工具，然后运行 `npx wrangler login` 完成本机授权。运行 `npm run deploy:cloudflare` 会检查博客功能、构建公开文件并部署到 Cloudflare Workers Static Assets。

线上地址以部署成功后 Wrangler 返回的地址为准。完整步骤见 [Cloudflare 部署说明](docs/cloudflare-setup.md)。当前部署的是已有个人主页；Next.js / Payload 在线写作后台尚未接入。

## 发布到 GitHub Pages

项目已提供 `.github/workflows/pages.yml`，发布方式：

1. 将这些文件提交并推送到仓库的 `main` 分支。
2. 在 GitHub 仓库的 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
3. 在 **Actions** 中运行 **Deploy personal homepage to GitHub Pages**。之后向 `main` 推送会自动部署。
4. 工作流完成后，从部署结果打开实际的 Pages 地址。本仓库通常对应 `https://zhanxuanying.github.io/my_page/`。

所有资源使用相对路径，适配仓库子目录。工作流版本及权限配置参考 [GitHub Pages 官方文档](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。

## 修改内容

| 文件                    | 用途                                   |
| ----------------------- | -------------------------------------- |
| `index.html`            | 个人介绍、区块标题、文章卡片、音乐链接 |
| `styles.css`            | 配色、排版、响应式与动画               |
| `app.js`                | 工具逻辑、文章列表和阅读弹窗           |
| `blog.js`               | Supabase 读取、安全的正文和卡片渲染    |
| `blog-data.js`          | 仅未配置数据库时使用的本地示例         |
| `supabase-config.js`    | 项目 URL 和公开的 publishable key      |
| `assets/bunny-hero.png` | 兔子主视觉                             |
| `assets/favicon.svg`    | 兔子网站图标                           |

更换博客时，在 [Supabase 后台](https://supabase.com/dashboard/project/bclkpczvgzmraytxqdfv/editor) 的 `blog_posts` 表中编辑并保存，刷新主页即可看到更新。发布、下架和正文格式见 [博客后台使用说明](docs/supabase-setup.md)。

开发检查：`npm ci --ignore-scripts` 后执行 `npm test`。测试在真实 PostgreSQL 引擎 PGlite 中检查 RLS 与写入限制，并验证前端请求、分页、空数据、错误和文本转义。GitHub Pages 工作流会先运行这些检查。

## 数据与使用边界

待办事项只存储于当前浏览器；不跨设备同步。清理浏览器数据会清除清单。浏览器禁止存储时，页面会提示仅保留本次会话。

计时器在当前页面内运行，关闭弹窗仍会继续；刷新或关闭页面会重置。文字统计不发送网络请求，关闭弹窗保留当前草稿，刷新后清空。

本页面不会自动播放音乐，也不包含任何受版权保护的歌曲音频。博客会请求 Supabase Data API；音乐入口链接至音乐网站。主视觉已放入本地资源，无外部图片加载依赖。

## 主视觉来源

兔子插画由内置 ImageGen 为此主页生成，已保存至 `assets/bunny-hero.png`。

创作提示：一只软绒绒的白兔坐在淡粉色软垫和矮台上，右上方伸入少量樱花，温柔日光与细腻阴影，极简奶白与玫瑰粉摄影棚，精致可爱的绒感立体插画；正方形构图，无文字、标志或界面元素。
