-- Prompt 4 — Catalogue véhicules : RLS + Storage

-- ============================================================
-- 1. RLS sur vehicules (lecture publique, écriture staff)
-- ============================================================

alter table public.vehicules enable row level security;

create policy "vehicules_select_all"
  on public.vehicules for select
  using (true);

create policy "vehicules_insert_staff"
  on public.vehicules for insert
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role in ('operateur', 'proprietaire')
    )
  );

create policy "vehicules_update_staff"
  on public.vehicules for update
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role in ('operateur', 'proprietaire')
    )
  );

create policy "vehicules_delete_staff"
  on public.vehicules for delete
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role in ('operateur', 'proprietaire')
    )
  );

-- ============================================================
-- 2. RLS sur vehicule_photos
-- ============================================================

alter table public.vehicule_photos enable row level security;

create policy "vehicule_photos_select_all"
  on public.vehicule_photos for select
  using (true);

create policy "vehicule_photos_insert_staff"
  on public.vehicule_photos for insert
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role in ('operateur', 'proprietaire')
    )
  );

create policy "vehicule_photos_update_staff"
  on public.vehicule_photos for update
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role in ('operateur', 'proprietaire')
    )
  );

create policy "vehicule_photos_delete_staff"
  on public.vehicule_photos for delete
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role in ('operateur', 'proprietaire')
    )
  );

-- ============================================================
-- 3. Storage — photos véhicules (public) + documents (privé)
-- ============================================================

insert into storage.buckets (id, name, public)
values ('vehicle-photos', 'vehicle-photos', true);

insert into storage.buckets (id, name, public)
values ('vehicle-documents', 'vehicle-documents', false);

-- vehicle-photos : upload/delete staff, lecture publique (bucket public)
create policy "vehicle_photos_upload_staff"
  on storage.objects for insert
  with check (
    bucket_id = 'vehicle-photos'
    and exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role in ('operateur', 'proprietaire')
    )
  );

create policy "vehicle_photos_delete_staff"
  on storage.objects for delete
  using (
    bucket_id = 'vehicle-photos'
    and exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role in ('operateur', 'proprietaire')
    )
  );

-- vehicle-documents : upload/lecture/delete staff uniquement
create policy "vehicle_documents_upload_staff"
  on storage.objects for insert
  with check (
    bucket_id = 'vehicle-documents'
    and exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role in ('operateur', 'proprietaire')
    )
  );

create policy "vehicle_documents_read_staff"
  on storage.objects for select
  using (
    bucket_id = 'vehicle-documents'
    and exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role in ('operateur', 'proprietaire')
    )
  );

create policy "vehicle_documents_delete_staff"
  on storage.objects for delete
  using (
    bucket_id = 'vehicle-documents'
    and exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role in ('operateur', 'proprietaire')
    )
  );
