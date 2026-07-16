-- Fix storage RLS: add UPDATE for upsert, fix staff recursion

-- Add UPDATE policy for upsert support
create policy "identity_docs_update_own"
  on storage.objects for update
  using (
    bucket_id = 'identity-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'identity-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Fix recursion in staff read policy
drop policy if exists "identity_docs_read_staff" on storage.objects;
create policy "identity_docs_read_staff"
  on storage.objects for select
  using (
    bucket_id = 'identity-documents'
    and public.is_staff()
  );
