# 在线写作后台验证记录

日期：2026-09-13。

## 实现与部署

- 正式站点：[轩颖的小世界](https://xuanying-homepage.xuanying-personal-homepage.workers.dev/)，后台 `/admin`，阅读 `/blog`。
- Next.js 16.3.5 / Payload 3.89.0 / OpenNext 1.20.6 / Wrangler 4.131.1。
- Worker 版本：`1fb6f486-d374-45ef-974a-96429f259f4a`。
- Worker 包体 16,527.18 KiB，gzip 3,830.73 KiB；Wrangler 报告启动时间 34 ms，当前账号部署成功，未升级付费方案。
- Hyperdrive 使用专用 Supabase 数据库角色，关闭查询缓存；图片使用 Supabase Storage。

## 代码与构建

`npm test` 的 12 项检查全部通过，覆盖主页 CMS 接口、旧 Supabase 接口、内容转义、图片魔数和大小、URL 安全、发布权限及真实 PGlite 数据库 RLS。`npm run typecheck`、静态构建与完整 OpenNext 构建通过。

独立代码检查发现并修复：中文图片文件名不兼容存储键、首个管理员注册路由的大小写变体、文章前后篇顺序和清空排序数字时的默认值。清空排序值的真实 API 回归检查先在修复前失败，再在修复后通过。

扫描全部 2,117 个 OpenNext 输出文件，没有发现配置中的数据库密码、签名密钥或 service role key。构建脚本去除 OpenNext 自动复制的私有 `.env` 文件和环境值，使用 Worker secrets 提供运行时凭据。

构建工具输出了第三方打包代码的 `typeof null`、动态 `eval` 与 Node 弃用提醒；这些提醒未阻止构建、部署或下列线上功能验证。

## 真实数据库与接口

本地与正式 Cloudflare 站点均完成 29 项 API 检查：

- 管理员登录成功；匿名管理员列表与四种首个管理员注册 URL 均拒绝访问。
- 旧笔记可读，前后篇与公开列表排序一致，空排序值归零。
- 草稿创建、发布、私密修改、公开版本保留、版本历史、恢复、未来发布时间判断正常。
- 匿名用户不能读草稿或版本，不能新建、修改或删除文章。
- 带中文、空格和特殊字符的 PNG 文件名可以上传，文件持久保存在 Supabase 并可读取。
- 阅读页渲染正式内容和 JSON-LD，RSS 可读取。
- 验证文章及图片在结束后删除。

检查结束后数据库仅保留一个正式管理员、三篇原始文章和零张测试图片；用于 UI 验证的临时账号和草稿也已删除。逐字段核对原 `public.blog_posts` 与迁移前备份，内容未改变。`anon` 和 `authenticated` 没有 `payload` schema 访问权，CMS 角色不具备 superuser / createdb / createrole 权限。

## 页面检查

本地浏览器实际验证了中文后台登录、富文本录入、自动保存、私密预览、桌面布局以及 390 px 宽手机阅读页。文章目录跳转与字号切换正常，没有横向溢出。

正式站点通过实际 HTTPS 检查主页、博客、阅读页、后台页面、RSS 和 sitemap；主页与公开静态文件一致，旧路径的 `.env`、`package.json`、`README.md` 均返回 404。后台登录界面在客户端渲染，不以服务端 HTML 是否含密码输入框作为可用性标准。

线上浏览器自动化连接超时，因此没有把本地视觉验收表述为线上浏览器验收。线上写作流程的证据是实际 Cloudflare API 读写、持久图片读取以及 12 个脚本/样式文件的逐字节产物校验。GitHub Pages 来源的主页 API 请求也通过 CORS 检查。

## 已知边界

没有配置发信服务；修改密码可在登录后的个人资料中完成，遗忘密码使用本机管理员恢复工具。图片库为公开素材库，草稿中的图片也可能通过已知链接访问。免费平台的持续额度和项目暂停规则仍适用，本轮检查不等同于长期负载测试。

---

# 2026-09-12 历史验证记录

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

上述结果说明基本兼容性可用，不能等同于完整博客在免费额度内可长期稳定运行。该历史记录时站点仍为静态主页；2026-09-13 已完成下述在线写作升级。
