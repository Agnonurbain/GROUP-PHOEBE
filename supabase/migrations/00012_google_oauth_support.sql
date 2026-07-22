-- Allow Google OAuth users (no phone number)
-- 1. Make telephone nullable for OAuth users
-- 2. Update trigger to handle Google OAuth data

-- Allow NULL telephone (Google users don't have one)
alter table public.users alter column telephone drop not null;

-- Drop unique constraint, re-add as partial (exclude NULLs)
alter table public.users drop constraint if exists users_telephone_key;
create unique index users_telephone_unique on public.users (telephone) where telephone is not null and telephone != '';

-- Update trigger to handle Google OAuth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Remove orphaned public.users entry if email exists with different ID
  delete from public.users where email = new.email and id != new.id;

  insert into public.users (id, role, nom, telephone, email, date_naissance)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'client'),
    coalesce(
      new.raw_user_meta_data->>'nom',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      ''
    ),
    case
      when new.phone is not null and new.phone != '' then new.phone
      else null
    end,
    new.email,
    case
      when new.raw_user_meta_data->>'date_naissance' is not null
      then (new.raw_user_meta_data->>'date_naissance')::date
      else null
    end
  )
  on conflict (id) do update set
    nom = excluded.nom,
    email = excluded.email,
    telephone = coalesce(excluded.telephone, public.users.telephone);
  return new;
end;
$$ language plpgsql security definer;
