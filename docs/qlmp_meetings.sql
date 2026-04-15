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
