# 旧版 Supabase 表维护记录

> 2026-09-13 已升级为 Payload 在线写作后台。日常写作请使用 [新后台说明](writing-guide.md)。下文仅记录迁移前 `public.blog_posts` 表；该旧表仍保留，修改它不会更新新站点。

主页：[轩颖的小世界](https://zhanxuanying.github.io/my_page/)

后台：[Supabase 项目 my-page](https://supabase.com/dashboard/project/bclkpczvgzmraytxqdfv/editor)

项目位于新加坡（`ap-southeast-1`），文章表为 `public.blog_posts`。页面每次打开或刷新时读取数据库；修改文章无需重新发布 GitHub Pages。

## 编辑、发布和下架

1. 登录后台，打开 **Table Editor → blog_posts**。
2. 双击相应单元格修改内容并保存；新增文章选择 **Insert row**。
3. 将 `published` 设为 `true`，且 `published_at` 不晚于当前时间，文章即公开。页面刷新后显示更新。
4. 将 `published` 设为 `false` 即可下架，文章仍保留在后台。
5. 把示例改成自己的文章后，将 `is_sample` 设为 `false`，主页就不再显示“示例笔记”标记。

| 字段                        | 填写方式                                                                      |
| --------------------------- | ----------------------------------------------------------------------------- |
| `slug`                      | 唯一标识，如 `my-first-note`；小写英文字母、数字及中间的短横线，最多 100 字符 |
| `title`                     | 文章标题，最多 120 字符                                                       |
| `excerpt`                   | 卡片上的摘要，最多 300 字符                                                   |
| `category`                  | 如“办公小记”“生活灵感”“记录日常”，最多 30 字符                                |
| `cover_theme`               | `office` 米色、`music` 淡紫色、`journal` 粉色；默认 `journal`                 |
| `body`                      | 正文，必填，最多 50,000 字符，格式见下方                                      |
| `reading_minutes`           | 预计阅读分钟数，1–120，默认 2                                                 |
| `published`                 | `false` 草稿，`true` 公开；新文章默认草稿                                     |
| `published_at`              | 发布时间，默认创建时刻；设置未来时间可预约发布，注意后台显示的时区            |
| `sort_order`                | 数字越小越靠前；相同数字按发布时间从新到旧排序                                |
| `is_sample`                 | 是否示例，新文章默认 `false`                                                  |
| `created_at` / `updated_at` | 自动维护，无须填写                                                            |

## 正文格式

使用空行分段，支持标题、列表和引用。例如：

```text
今天想记录一件开心的小事。

## 一个小标题

这里写正文，回车可以换行。

- 第一件小事
- 第二件小事

> 温柔地记录，慢慢地生活。
```

正文中的 HTML 会作为普通文字显示，不执行脚本。当前不支持 Markdown 图片、链接、粗体或附件上传。

## 数据和权限

- 匿名访客和普通登录用户只能查询 `published = true` 且发布时间已到的文章，不能新增、修改或删除。
- 文章在 Supabase 控制台中由项目管理员管理。本次没有增加站内登录系统。
- `supabase-config.js` 只包含项目 URL 与公开的 publishable key。数据权限由 PostgreSQL grants 与 RLS 共同控制。
- 数据库密码保存在这台 Mac 的“钥匙串访问”中，项目名称为 **Supabase my_page database**，账户为 `postgres`；没有写入源码。日常在 Supabase 控制台编辑文章不需要使用数据库密码。
- 数据库为空时显示空状态；连接失败时显示重试按钮。配置完成后不会用本地示例替代数据库结果。
- 每批加载 6 篇，超过后显示“再翻几篇笔记”。页面已打开期间的数据不会自动刷新，修改后请刷新页面。

公开过的内容可能已被访客保存。下架会停止数据库后续公开读取，不会撤回别人已取得的副本。

## 维护与验证

安装开发依赖后运行自动检查（网站运行本身不需要这些依赖）：

```sh
npm ci --ignore-scripts
npm test
```

迁移文件 `supabase/migrations/20260912000100_blog_posts.sql` 已应用到当前项目。它是一次性建表迁移，不要再次对已有表执行。三篇种子文章保留了原来主页的示例内容。

可再次核对云端权限；检查产生的临时记录会在同一个事务中回滚：

```sh
npx --yes supabase@2.117.0 db query --linked \
  --project-ref bclkpczvgzmraytxqdfv \
  --file supabase/verify.sql --output json
```

预期：`rls_enabled` 和 `anon_can_read` 为 `true`，两个 `can_write` 字段均为 `false`，`leftover_verification_rows` 为 0。

如需为另一个新项目建立相同后台，在新项目的 SQL Editor 运行迁移一次，然后将新项目 URL 和 publishable key 填入 `supabase-config.js`。不要填写 secret key、`service_role`、数据库密码或账号管理令牌。

官方参考：[API 密钥](https://supabase.com/docs/guides/getting-started/api-keys)、[RLS 权限](https://supabase.com/docs/guides/database/postgres/row-level-security)、[免费额度](https://supabase.com/pricing)。免费项目长期不活跃可能暂停，需要在控制台恢复。
