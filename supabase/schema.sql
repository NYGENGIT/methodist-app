-- ============================================================================
--  Donewell Methodist Hub — Supabase schema
--  Run this once in your Supabase project: SQL Editor → New query → paste → Run.
--  It creates the tables, the security rules (managers edit; only admins delete),
--  and the storage for the dashboard dataset.
-- ============================================================================

-- 1. PROFILES — one row per user, holds their role and assigned branches.
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  role        text not null default 'manager' check (role in ('admin','manager')),
  branches    text[] not null default '{}'
);
alter table public.profiles enable row level security;

create policy "profiles readable by signed-in users"
  on public.profiles for select to authenticated using (true);
create policy "users update own profile"
  on public.profiles for update to authenticated using (auth.uid() = id);

-- Auto-create a profile row when a new user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- 2. ENGAGEMENTS — the shared engagement log.
create table if not exists public.engagements (
  id                uuid primary key default gen_random_uuid(),
  date              date not null,
  branch            text,
  manager_name      text,
  institution_name  text,
  institution_type  text,
  region            text,
  engagement_type   text,
  contact_person    text,
  contact_role      text,
  contact_phone     text,
  outcome           text,
  pipeline_value    numeric default 0,
  won_premium       numeric default 0,
  next_action       text,
  next_action_date  date,
  status            text default 'Open',
  priority          text default 'Medium',
  notes             text,
  created_by        text,
  created_at        timestamptz default now()
);
alter table public.engagements enable row level security;

-- Any signed-in user can read and add; anyone signed-in can edit (update);
-- ONLY admins can delete.
create policy "read engagements"   on public.engagements for select to authenticated using (true);
create policy "insert engagements" on public.engagements for insert to authenticated with check (true);
create policy "update engagements" on public.engagements for update to authenticated using (true);
create policy "admin delete only"  on public.engagements for delete to authenticated using (public.is_admin());

-- 3. DASHBOARD DATASET — the aggregated Methodist figures (one row, id = 1).
--    Public read so the dashboard is viewable without login; only admins write.
create table if not exists public.methodist_dataset (
  id         int primary key default 1,
  data       jsonb,
  updated_at timestamptz default now()
);
create table if not exists public.methodist_raw (
  id         int primary key default 1,
  rows       jsonb,
  updated_at timestamptz default now()
);
alter table public.methodist_dataset enable row level security;
alter table public.methodist_raw enable row level security;

create policy "dataset public read" on public.methodist_dataset for select using (true);
create policy "dataset admin write" on public.methodist_dataset for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "raw admin only"       on public.methodist_raw for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
--  AFTER running this: create your users (Authentication → Users → Add user),
--  then run seed_managers.sql to set their names, roles and branches.
-- ============================================================================
