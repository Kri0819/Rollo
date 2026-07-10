-- Rollo｜滾滾 cloud schema
-- Run this once in Supabase: Dashboard -> SQL Editor -> paste -> Run.

create extension if not exists "pgcrypto";

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null,
  tag_id uuid references public.tags (id) on delete set null,
  due_date date,
  due_time text,
  note text,
  checked_at timestamptz,
  is_completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tags_user_id_idx on public.tags (user_id);
create index if not exists tasks_user_id_idx on public.tasks (user_id);

alter table public.tags enable row level security;
alter table public.tasks enable row level security;

-- Everyone can only ever see/change their own rows.
create policy "tags: owner select" on public.tags
  for select using (auth.uid() = user_id);

create policy "tags: owner insert" on public.tags
  for insert with check (auth.uid() = user_id);

create policy "tags: owner update" on public.tags
  for update using (auth.uid() = user_id);

create policy "tags: owner delete" on public.tags
  for delete using (auth.uid() = user_id);

create policy "tasks: owner select" on public.tasks
  for select using (auth.uid() = user_id);

create policy "tasks: owner insert" on public.tasks
  for insert with check (auth.uid() = user_id);

create policy "tasks: owner update" on public.tasks
  for update using (auth.uid() = user_id);

create policy "tasks: owner delete" on public.tasks
  for delete using (auth.uid() = user_id);
