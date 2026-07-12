-- GROUP PHOEBE — Auth trigger, RLS, Storage
-- Lié au Prompt 2 : inscription client, vérification d'identité, back-office

-- ============================================================
-- 1. Trigger : création automatique de public.users à l'inscription
-- ============================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, role, nom, telephone, date_naissance)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'client'),
    coalesce(new.raw_user_meta_data->>'nom', ''),
    coalesce(new.phone, ''),
    case
      when new.raw_user_meta_data->>'date_naissance' is not null
      then (new.raw_user_meta_data->>'date_naissance')::date
      else null
    end
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- 2. RLS sur la table users
-- ============================================================

alter table public.users enable row level security;

create policy "users_select_own"
  on public.users for select
  using (auth.uid() = id);

create policy "users_select_staff"
  on public.users for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role in ('operateur', 'proprietaire')
    )
  );

create policy "users_update_own_profile"
  on public.users for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select role from public.users where id = auth.uid())
    and statut_verification = (select statut_verification from public.users where id = auth.uid())
  );

create policy "users_update_verification_staff"
  on public.users for update
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role in ('operateur', 'proprietaire')
    )
  );

-- Un client peut passer son propre statut à 'documents_soumis' uniquement
create policy "users_submit_documents"
  on public.users for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and statut_verification = 'documents_soumis'
  );

-- ============================================================
-- 3. Storage bucket pour les documents d'identité
-- ============================================================

insert into storage.buckets (id, name, public)
values ('identity-documents', 'identity-documents', false);

create policy "identity_docs_upload"
  on storage.objects for insert
  with check (
    bucket_id = 'identity-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "identity_docs_read_own"
  on storage.objects for select
  using (
    bucket_id = 'identity-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "identity_docs_read_staff"
  on storage.objects for select
  using (
    bucket_id = 'identity-documents'
    and exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role in ('operateur', 'proprietaire')
    )
  );
