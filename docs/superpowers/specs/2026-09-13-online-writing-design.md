# 在线写作后台

## 目标与方案

在现有 Cloudflare 站点接入 Next.js + Payload CMS，延续粉色个人主页。
用户已选择 Cloudflare、Supabase 和完整在线写作后台；本次沿用此前验证过的开源 Payload 方案。
相比重新手写 CMS，Payload 提供成熟的富文本、认证、草稿和版本恢复；相比搬到其他博客服务，可以保留现有主页、域名与数据库。

## 使用流程

- `/admin`：中文后台，管理员登录后管理文章、图片与自己的账户。
- 文章编辑：标题、摘要、分类、标签、封面图或主题色、Lexical 富文本、阅读时长、发布时间、SEO。
- 草稿、自动保存和历史版本由 Payload 管理；发布后的修改可以先存草稿，公开页继续展示已发布版本。
- 预览需要管理员会话。新文章默认草稿，访客无法读取草稿、未来文章或用户资料，不能写入任何集合。
- `/blog`：搜索、分类筛选和分页；`/blog/[slug]`：移动端阅读、目录、阅读进度、上一篇/下一篇、分享、元信息与 RSS。
- 首页保留现有 HTML/CSS/工具，通过同源公开接口读取 CMS 已发布文章并链接到阅读页。

## 数据与部署

- Supabase PostgreSQL 新增独立 `payload` schema，使用仅拥有该 schema 的数据库角色；显式迁移，关闭自动 schema push。
- 现有 `public.blog_posts` 保留作为迁移来源。幂等导入现有文章，正文转为 Lexical，核对数量、标题和内容。
- 图片通过 Payload Storage Adapter 存入 Supabase Storage。图片为公开素材，允许 PNG/JPEG/WebP/GIF，最大 5 MB；仅管理员上传和删除。
- 生产环境使用 Cloudflare Hyperdrive（免费计划内，关闭查询缓存）连接 Supabase，以免草稿/发布状态过期。
- 管理员在正式开放后台前创建，不提供公开注册。凭据不进 Git，机密只保存在本机钥匙串与 Cloudflare Secrets。
- 现有 GitHub Pages 保留静态镜像，通过 Cloudflare 公开 API 读取文章，阅读与写作链接指向 Cloudflare。

## 验证

验证草稿隔离、未来发布时间、匿名写入拒绝、管理员登录、上传与删除、发布后读取、已发布版本和草稿版本分离、导入幂等性、前台输出安全。
执行 TypeScript、已有测试、新增行为测试、OpenNext 构建和生产端接口检查，并用浏览器检查后台编辑与响应式阅读。
不自动开通任何付费计划。
