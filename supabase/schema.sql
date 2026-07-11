-- Rollo｜滾滾 cloud schema (完整修正版)
-- Run this once in Supabase: Dashboard -> SQL Editor -> paste -> Run.

create extension if not exists "pgcrypto";

-- 【安全清理】如果之前有建立不完整的資料表，先清除它們
drop table if exists public.rollo_tasks cascade;
drop table if exists public.rollo_tags cascade;

-- 1. 建立 tags 資料表
create table public.rollo_tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

-- 2. 建立 tasks 資料表
create table public.rollo_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null,
  tag_id uuid references public.rollo_tags (id) on delete set null,
  due_date date,
  due_time text,
  note text,
  checked_at timestamptz,
  is_completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. 建立索引
create index if not exists rollo_tags_user_id_idx on public.rollo_tags (user_id);
create index if not exists rollo_tasks_user_id_idx on public.rollo_tasks (user_id);

-- 4. 啟用 RLS
alter table public.rollo_tags enable row level security;
alter table public.rollo_tasks enable row level security;

-- 5. 設定 Tags RLS 政策
create policy "rollo_tags: owner select" on public.rollo_tags
  for select using (auth.uid() = user_id);

create policy "rollo_tags: owner insert" on public.rollo_tags
  for insert with check (auth.uid() = user_id);

create policy "rollo_tags: owner update" on public.rollo_tags
  for update using (auth.uid() = user_id);

create policy "rollo_tags: owner delete" on public.rollo_tags
  for delete using (auth.uid() = user_id);

-- 6. 設定 Tasks RLS 政策
create policy "rollo_tasks: owner select" on public.rollo_tasks
  for select using (auth.uid() = user_id);

create policy "rollo_tasks: owner insert" on public.rollo_tasks
  for insert with check (auth.uid() = user_id);

create policy "rollo_tasks: owner update" on public.rollo_tasks
  for update using (auth.uid() = user_id);

create policy "rollo_tasks: owner delete" on public.rollo_tasks
  for delete using (auth.uid() = user_id);
