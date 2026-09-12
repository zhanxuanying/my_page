begin;

create table public.blog_posts (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 100),
  title text not null check (char_length(btrim(title)) between 1 and 120),
  excerpt text not null default '' check (char_length(excerpt) <= 300),
  category text not null default '记录日常' check (char_length(btrim(category)) between 1 and 30),
  cover_theme text not null default 'journal' check (cover_theme in ('office', 'music', 'journal')),
  body text not null check (char_length(btrim(body)) between 1 and 50000),
  reading_minutes integer not null default 2 check (reading_minutes between 1 and 120),
  is_sample boolean not null default false,
  published boolean not null default false,
  published_at timestamptz not null default now(),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.blog_posts is '主页博客。通过 Supabase Table Editor 编辑；访客只能读取已到发布时间的公开文章。';
comment on column public.blog_posts.body is '纯文本正文；支持 ## 标题、- 列表、> 引用，空行分段。不执行 HTML。';
comment on column public.blog_posts.published is 'true 发布，false 草稿或下架。';
comment on column public.blog_posts.published_at is '只有此时间已到且 published=true 的文章才会公开。';
comment on column public.blog_posts.is_sample is '初始示例为 true。替换为自己的文章后设为 false。';

create index blog_posts_public_order on public.blog_posts (sort_order, published_at desc, slug) where published = true;

create function public.set_blog_post_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function public.set_blog_post_updated_at() from public, anon, authenticated;

create trigger blog_posts_updated_at
before update on public.blog_posts
for each row execute function public.set_blog_post_updated_at();

alter table public.blog_posts enable row level security;

revoke all on table public.blog_posts from public, anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select on table public.blog_posts to anon, authenticated;
grant all on table public.blog_posts to service_role;

create policy "Visitors can read published blog posts"
on public.blog_posts for select to anon, authenticated
using (published = true and published_at <= now());

-- Existing public sample articles are inserted below; account and personal data are not migrated.

insert into public.blog_posts (slug, title, excerpt, category, cover_theme, body, reading_minutes, is_sample, published, sort_order) values
('office', '给忙碌的一天，一点秩序感', '从一份清单开始，让琐碎的工作变得清晰。', '办公小记', 'office', '工作中的很多事情并不复杂，只是容易同时涌过来。给它们安排一个位置，心里也会轻松一点。这是一份可以直接参考的日常整理方法。

## 01 · 先写下来，再开始

开始工作前，花五分钟列出今天的事项。先标记有明确截止时间的任务，再选出一到三件需要优先完成的事。临时收到的安排也放进同一张清单里。

## 02 · 让文件名替你记忆

试试「日期_事项_版本」的命名方式。例如「2026-09-11_会议纪要_v1」。一个项目放在同一个文件夹，已确认的版本再单独归档，减少反复查找。

## 03 · 发出前，多看一眼

- 收件人、日期和时间是否正确？
- 需要的附件是否已经附上？
- 文件中的姓名、数字与版本是否一致？

## 04 · 留五分钟给明天

结束工作前，勾掉已完成的事项，把未完成事项的下一步写具体。比起「处理文件」，「核对表格中本周的三条新增记录」更容易开始。

> 有条不紊，不是把每一分钟填满，而是知道下一步要做什么。', 3, true, true, 1),
('music', '在音乐里，给自己一个休息', '偶尔停一停，安安静静地听完一首歌。', '生活灵感', 'music', '休息不一定要等到一个完整的周末。一首歌的时间，也可以成为忙碌日常中的一小块留白。

## 把这一首歌听完

选一首喜欢的歌，先把手边的消息放一放。让音乐成为此刻唯一要做的事，不急着切换，也不用同时完成其他任务。

## 留一个轻松的听歌角落

找个舒服的位置，把音量调到舒适的程度，给自己倒一杯水。可以听王菲，也可以换一首今天刚好想听的歌。喜欢就是足够好的理由。

## 给当下留一个词

听完以后，用一个词记下此刻的感觉：轻盈、平静、想念，或者什么也不写。音乐不需要交作业，这个小小的停顿也不用有什么成果。

> 有时候，把生活的声音调小一点，就更容易听见自己。', 2, true, true, 2),
('journal', '不用很特别，也值得被记住', '用三行小日记，收藏生活里的小小幸福。', '记录日常', 'journal', '日记并不一定要写很长，也不用等到发生一件大事才开始。一句随手记下的话，就能替今天留一扇小小的窗。

## 从三行开始

- 今天看到的小美好：一束光、一片好看的云，或一只可爱的小兔子。
- 今天做成的一件事：再小也可以，它是你认真生活的痕迹。
- 想对自己说的一句话：温柔一点，不用急着评价。

## 不追求连续打卡

有空就写，想起来就记录。忘了一天不需要补上，停了一阵也可以从今天重新开始。记录是为了保存生活里的感受，不是给自己增加一份任务。

## 偶尔回头看看

翻开以前留下的只言片语，会发现那些当时很普通的片刻也有自己的光。原来，小小的日子一直在认真地往前走。

> 把一点美好留在纸上，平凡的一天就有了自己的书签。', 2, true, true, 3)
on conflict (slug) do nothing;

commit;
