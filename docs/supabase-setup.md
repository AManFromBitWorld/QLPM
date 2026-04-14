# 协作同步配置

要启用多人协作、自动保存和实时同步，请在 Supabase 中创建 `qlmp_meetings` 表，并在站点构建环境中配置以下变量：

```bash
VITE_SUPABASE_URL=你的 Supabase 项目地址
VITE_SUPABASE_ANON_KEY=你的 Supabase 匿名公钥
```

## 建表 SQL

```sql
create table if not exists public.qlmp_meetings (
  id text primary key,
  title text not null default '',
  project text not null default '',
  status text not null default '草稿',
  meeting_date date null,
  regions text[] not null default '{}',
  provinces text[] not null default '{}',
  updated_at timestamptz not null default now(),
  payload jsonb not null
);

alter table public.qlmp_meetings replica identity full;

create index if not exists qlmp_meetings_updated_at_idx
  on public.qlmp_meetings (updated_at desc);

create index if not exists qlmp_meetings_regions_idx
  on public.qlmp_meetings using gin (regions);

create index if not exists qlmp_meetings_provinces_idx
  on public.qlmp_meetings using gin (provinces);
```

## 公开协作策略

如果这个站点面向不登录用户的协作填写，可以先使用下面的宽松策略：

```sql
alter table public.qlmp_meetings enable row level security;

create policy "public read qlmp meetings"
on public.qlmp_meetings
for select
to anon
using (true);

create policy "public insert qlmp meetings"
on public.qlmp_meetings
for insert
to anon
with check (true);

create policy "public update qlmp meetings"
on public.qlmp_meetings
for update
to anon
using (true)
with check (true);

create policy "public delete qlmp meetings"
on public.qlmp_meetings
for delete
to anon
using (true);
```

## Realtime

在 Supabase 控制台中为 `public.qlmp_meetings` 开启 Realtime。
