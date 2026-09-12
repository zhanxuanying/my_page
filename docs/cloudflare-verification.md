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

构建时多个 Next.js 子进程可能同时打开本地持久数据库，产生 SQLite 锁冲突。除为模板自己的代理关闭构建期持久化外，还需让构建子进程使用相同代理，避免 OpenNext 的自动回退重新启用持久存储。验证项目通过仅构建时设置的 `CF_COMPAT_BUILD=1` 完成区分，构建标记未进入生成的运行环境文件。Next.js 构建、类型检查与 OpenNext 打包通过。

Wrangler 模拟部署通过：总包体约 15.3 MiB，gzip 后约 3.52 MiB。这是基础认证与媒体模板的大小，不代表加入完整博客后的大小。

在本地 Workers 运行环境执行官方模板自带迁移后，使用一次性测试账号验证：

- `POST /api/users/first-register`：200。
- `POST /api/users/login`：200，返回有效会话令牌。
- `GET /api/users/me`：200，正确识别测试账号。
- 匿名 `GET /api/users`：403。

这些检查只覆盖当前模板的基本运行和认证接口。未验证完整后台编辑器的浏览器交互或 Supabase PostgreSQL 适配。

## 正式 Cloudflare 部署

用户完成 Wrangler 授权后，`npm run deploy:cloudflare` 成功发布了当前主页。

- 正式地址：https://xuanying-homepage.xuanying-personal-homepage.workers.dev/
- Worker：`xuanying-homepage`。
- 部署版本：`90fb6fcf-d3e6-4af7-a54b-e308bfaf9e54`。
- 8 个非隐藏公开文件 HTTPS 返回 200，内容逐字节匹配 `_site/`。
- 环境文件、源码说明及 SQL 路径返回 404。
- 使用正式站点 Origin 请求 Supabase，得到 3 篇文章，CORS 正确返回该 Origin。
- 初始新域名出现 TLS 握手失败，域名生效后恢复。Python 默认客户端标识收到 Cloudflare 1010；明确设置 `Xuanying-Homepage-Deployment-Check/1.0` 后检查通过，没有更改站点安全配置。
- 浏览器自动化导航超时，本次线上验证采用实际 HTTPS 响应与 API 检查；没有宣称完成线上浏览器视觉验收。

## Payload 云端验证

在当前 Cloudflare 账号创建临时 Worker 和临时 D1，移除 R2 绑定并禁用媒体写入。入口要求私有验证请求头，缺失时返回 404；真实站点和 Supabase 数据未接入临时环境。

- 部署包体：15,615.62 KiB，gzip 后 3,597.90 KiB。
- Wrangler 报告启动时间：32 ms。
- 无私有验证头的请求：404。
- 云端首次注册、登录、会话识别：200。
- 匿名用户列表读取：403。
- 额外 3 次登录检查：均返回 200。
- Cloudflare API 在尝试显式设置 10 ms CPU 上限时返回 `100328`，提示 Free 计划不支持自定义 CPU 限额，由此确认当前账号使用 Workers Free。该配置未部署成功，也未升级套餐；上述接口检查发生于默认平台限额下。
- 检查后已删除临时 Worker、临时 D1、一次性凭据和原始请求日志。正式主页继续使用原 Supabase。

上述结果说明基本兼容性可用，不能等同于完整博客在免费额度内可长期稳定运行。正式站点目前仍是已有主页加 Supabase，完整 Next.js / Payload 博客尚未实施。
