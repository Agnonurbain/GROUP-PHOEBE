-- Ajoute la policy UPDATE manquante sur vehicle-documents
-- Le code utilise upsert:true pour les fichiers d'assurance, ce qui nécessite UPDATE

create policy "vehicle_documents_update_staff"
  on storage.objects for update
  using (
    bucket_id = 'vehicle-documents'
    and exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role in ('operateur', 'proprietaire')
    )
  )
  with check (
    bucket_id = 'vehicle-documents'
    and exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role in ('operateur', 'proprietaire')
    )
  );
