-- =============================================================================
-- CampusCircle — initial schema
-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query).
-- It is idempotent enough to re-run safely.
-- =============================================================================

create extension if not exists "pgcrypto";

do $$
begin
  create type public.user_role as enum ('user', 'admin');
exception
  when duplicate_object then null;
end
$$;

-- -----------------------------------------------------------------------------
-- Profiles
-- One row per auth user, created automatically by the trigger below.
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null default '',
  full_name text not null default '',
  avatar_url text,
  age integer check (age is null or (age between 13 and 100)),
  college text,
  course text,
  skills text[] not null default '{}'::text[],
  music_interests text[] not null default '{}'::text[],
  bio text check (bio is null or char_length(bio) <= 400),
  role public.user_role not null default 'user',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_created_at_idx on public.profiles (created_at desc);

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------
-- SECURITY DEFINER so the RLS policies can ask "is the caller an admin?"
-- without recursively hitting the profiles policies.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated;

-- Auto-create a profile on first sign-in.
-- The admin email below gets the admin role automatically. Change it if needed.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'),
    case
      when lower(coalesce(new.email, '')) = 'shravankumawat817@gmail.com' or 'shravankumawat212@gmail.com'
        then 'admin'::public.user_role
      else 'user'::public.user_role
    end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Keep housekeeping fields consistent and stop non-admins from changing
-- their role, email or join date. Column grants below provide a second layer.
create or replace function public.handle_profile_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.id := old.id;
    new.email := old.email;
    new.role := old.role;
    new.created_at := old.created_at;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists on_profile_updated on public.profiles;
create trigger on_profile_updated
  before update on public.profiles
  for each row
  execute function public.handle_profile_update();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "Members can read their own profile" on public.profiles;
create policy "Members can read their own profile"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Admins can read every profile" on public.profiles;
create policy "Admins can read every profile"
  on public.profiles
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Members can update their own profile" on public.profiles;
create policy "Members can update their own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Admins can update every profile" on public.profiles;
create policy "Admins can update every profile"
  on public.profiles
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Only expose the columns members are allowed to edit. In particular, role,
-- email, id and timestamps cannot be written from the browser.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, age, college, course, skills, music_interests, bio, onboarding_completed)
  on public.profiles to authenticated;

-- -----------------------------------------------------------------------------
-- Admin: delete a member (profile + auth account) in one transaction.
-- Deleting from auth.users cascades to public.profiles.
-- -----------------------------------------------------------------------------
create or replace function public.admin_delete_user(target_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_role public.user_role;
  admin_count integer;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Only campus admins can delete members.';
  end if;

  if target_id = auth.uid() then
    raise exception 'You cannot delete your own account from the admin console.';
  end if;

  select role into target_role
  from public.profiles
  where id = target_id;

  if target_role is null then
    raise exception 'That member no longer exists.';
  end if;

  if target_role = 'admin' then
    select count(*) into admin_count from public.profiles where role = 'admin';
    if admin_count <= 1 then
      raise exception 'You cannot delete the last remaining admin.';
    end if;
  end if;

  delete from auth.users where id = target_id;
end;
$$;

revoke all on function public.admin_delete_user(uuid) from public, anon;
grant execute on function public.admin_delete_user(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- Backfill profiles for users who signed in before this migration ran.
-- -----------------------------------------------------------------------------
insert into public.profiles (id, email, full_name, avatar_url, role)
select
  u.id,
  coalesce(u.email, ''),
  coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', ''),
  coalesce(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture'),
  case
    when lower(coalesce(u.email, '')) = 'shravankumawat817@gmail.com'
      then 'admin'::public.user_role
    else 'user'::public.user_role
  end
from auth.users u
on conflict (id) do nothing;
