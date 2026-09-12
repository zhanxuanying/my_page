-- Run against the configured project. Temporary verification rows are rolled back.
begin;
insert into public.blog_posts (slug, title, body, published, published_at)
values
  ('codex-check-private-draft', 'Private verification', 'Private verification', false, now()),
  ('codex-check-future-post', 'Future verification', 'Future verification', true, now() + interval '1 day');

set local role anon;
do $$
begin
  if exists (select 1 from public.blog_posts where slug in ('codex-check-private-draft', 'codex-check-future-post')) then
    raise exception 'Anonymous visitors can see unpublished articles';
  end if;
end;
$$;
reset role;

set local role authenticated;
do $$
begin
  if exists (select 1 from public.blog_posts where slug in ('codex-check-private-draft', 'codex-check-future-post')) then
    raise exception 'Authenticated visitors can see unpublished articles';
  end if;
end;
$$;
reset role;
rollback;

select
  c.relrowsecurity as rls_enabled,
  has_table_privilege('anon', 'public.blog_posts', 'SELECT') as anon_can_read,
  has_table_privilege('anon', 'public.blog_posts', 'INSERT, UPDATE, DELETE, TRUNCATE') as anon_can_write,
  has_table_privilege('authenticated', 'public.blog_posts', 'INSERT, UPDATE, DELETE, TRUNCATE') as authenticated_can_write,
  (select count(*) from public.blog_posts where slug like 'codex-check-%') as leftover_verification_rows
from pg_class c
where c.oid = 'public.blog_posts'::regclass;
