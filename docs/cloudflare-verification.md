# Cloudflare 验证记录

日期：2026-09-12。

## 当前主页

- Wrangler 4.131.1，Node.js 25.8.0。
- `npm test`：7 项通过，覆盖 Supabase 读取、分页、错误处理、文本转义，以及真实 PostgreSQL 引擎中的 RLS / 访客写入限制。
- `npm run build`：成功生成 `_site/`，与原 GitHub Pages 工作流使用相同公开文件清单。
- `npx wrangler deploy --dry-run`：通过，资源目录读取成功。
- `wrangler dev --local`：本机 Cloudflare 运行环境正常启动。
- 通过本地 HTTP 读取全部 8 个非隐藏公开文件，并逐字节与构建文件比较，全部一致。
- `.env`、`.dev.vars`、`package.json`、`README.md` 和 Supabase 迁移文件路径均返回 404。
- 这次修改没有改变页面内容或交互；验证侧重部署输出和资源路由。

## Payload 兼容性调查

在仓库外的临时目录使用 Payload 官方 `with-cloudflare-d1` 模板制作一次性验证项目，没有迁移或修改现有 Supabase 数据。

依赖：Payload 3.89.0、Next.js 16.3.5、OpenNext Cloudflare 1.20.6、Wrangler 4.131.1。D1 / R2 绑定均使用本地模拟，未创建云端资源。

首次构建在多个 Next.js 构建进程同时打开本地持久数据库时发生 SQLite 锁冲突。为构建进程关闭模拟数据库的文件持久化后，Next.js 构建、类型检查与 OpenNext 打包通过。本地开发仍保留持久存储供迁移及接口验证使用。

Wrangler 模拟部署通过：总包体约 15.3 MiB，gzip 后约 3.52 MiB。这是基础认证与媒体模板的大小，不代表加入完整博客后的大小。

在本地 Workers 运行环境执行官方模板自带迁移后，使用一次性测试账号验证：

- `POST /api/users/first-register`：200。
- `POST /api/users/login`：200，返回有效会话令牌。
- `GET /api/users/me`：200，正确识别测试账号。
- 匿名 `GET /api/users`：403。

这只能证明当前模板的基本运行和认证接口可用。尚未验证完整后台编辑器的浏览器交互、Supabase PostgreSQL 适配、真实 Cloudflare 的启动时间和 CPU 配额。

## 尚待完成

Wrangler 的 `whoami` 仍提示未认证。浏览器中的 Cloudflare 登录不会自动授权 Wrangler。完成 `npx wrangler login` 后，需要确认目标账号、执行真实部署、检查 HTTPS 地址和真实博客请求。

当前没有成功发布到 Cloudflare，也没有确认 Payload 可以在免费计划下稳定运行。新增部署配置仅覆盖已有主页；完整 Next.js / Payload 博客仍需单独实施。
