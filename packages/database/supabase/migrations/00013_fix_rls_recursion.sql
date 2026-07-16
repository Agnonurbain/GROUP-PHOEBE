-- Fix infinite recursion in users RLS policies
-- Staff-check policies query public.users which triggers the same RLS policies

-- Helper: bypasses RLS to check if caller is staff
create or replace function public.is_staff()
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid()
      and role in ('operateur', 'proprietaire')
  );
$$;

-- Helper: get own role without triggering RLS
create or replace function public.own_role()
returns text
language sql
security definer
set search_path = ''
as $$
  select role from public.users where id = auth.uid();
$$;

-- Helper: get own verification status without triggering RLS
create or replace function public.own_statut_verification()
returns text
language sql
security definer
set search_path = ''
as $$
  select statut_verification from public.users where id = auth.uid();
$$;

-- Drop old recursive policies
drop policy if exists "users_select_staff" on public.users;
drop policy if exists "users_update_own_profile" on public.users;
drop policy if exists "users_update_verification_staff" on public.users;

-- Recreate without recursion
create policy "users_select_staff"
  on public.users for select
  using (public.is_staff());

create policy "users_update_own_profile"
  on public.users for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = public.own_role()
    and statut_verification = public.own_statut_verification()
  );

create policy "users_update_verification_staff"
  on public.users for update
  using (public.is_staff());
