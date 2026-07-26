-- GROUP PHOEBE — Immobilier : RLS sur bien_medias + bucket photos de biens
-- Prérequis à l'admin des biens (création/gestion du catalogue immobilier).
-- Aligné sur le pattern véhicules (00004) : lecture publique, écriture staff.

-- ============================================================
-- 1. RLS sur bien_medias (jusqu'ici sans RLS → écriture ouverte)
-- ============================================================
alter table public.bien_medias enable row level security;

create policy "bien_medias_select_public"
  on public.bien_medias for select
  using (true);

create policy "bien_medias_staff_manage"
  on public.bien_medias for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role in ('operateur', 'proprietaire')
    )
  )
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role in ('operateur', 'proprietaire')
    )
  );

-- ============================================================
-- 2. Storage — photos de biens (bucket public)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('bien-photos', 'bien-photos', true)
on conflict (id) do nothing;

-- Upload / suppression réservés au staff ; lecture publique (bucket public).
create policy "bien_photos_upload_staff"
  on storage.objects for insert
  with check (
    bucket_id = 'bien-photos'
    and exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role in ('operateur', 'proprietaire')
    )
  );

create policy "bien_photos_delete_staff"
  on storage.objects for delete
  using (
    bucket_id = 'bien-photos'
    and exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role in ('operateur', 'proprietaire')
    )
  );
