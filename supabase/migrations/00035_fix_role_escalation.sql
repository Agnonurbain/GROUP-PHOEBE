-- Correction de deux elevations de privileges sur public.users, plus la
-- desactivation de compte qui echouait silencieusement.
--
-- Rappel du modele de menace : NEXT_PUBLIC_SUPABASE_ANON_KEY est publique et
-- PostgREST est expose. Un utilisateur peut donc emettre des UPDATE directs
-- sans passer par les Server Actions. Toute la defense repose sur RLS.
--
-- Rappel PostgreSQL : les policies PERMISSIVE d'une meme commande sont
-- combinees avec un OU. Il suffit qu'une seule accepte pour que l'UPDATE
-- passe. Chaque policy UPDATE doit donc verrouiller `role` independamment.

-- ============================================================
-- 1. Helper : role stocke d'une ligne arbitraire, sans recursion RLS
-- ============================================================
-- Meme motif que public.own_role() (migration 00013) : SECURITY DEFINER pour
-- lire public.users sans re-declencher les policies de public.users.

create or replace function public.stored_role(target uuid)
returns text
language sql
security definer
stable
set search_path = ''
as $$
  select role from public.users where id = target;
$$;

-- ============================================================
-- 2. users_submit_documents : n'encadrait que statut_verification
-- ============================================================
-- Faille : le WITH CHECK n'encadrait que statut_verification, jamais `role`.
-- Combine en OU avec les autres policies, cela permettait a un utilisateur
-- authentifie de modifier son propre role via un UPDATE direct sur PostgREST.
-- La migration 00013 avait durci users_update_own_profile mais oublie
-- celle-ci, qui n'a jamais ete supprimee.

drop policy if exists "users_submit_documents" on public.users;

create policy "users_submit_documents"
  on public.users for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and statut_verification = 'documents_soumis'
    and role = public.own_role()
  );

-- ============================================================
-- 3. users_update_verification_staff : aucun WITH CHECK
-- ============================================================
-- Faille : sans WITH CHECK, PostgreSQL reutilise l'expression USING pour
-- valider la nouvelle ligne. Or is_staff() n'examine pas la ligne, seulement
-- auth.uid() : elle vaut donc true quelles que soient les valeurs ecrites, ce
-- qui laissait un compte staff modifier n'importe quelle colonne de n'importe
-- quel utilisateur, `role` compris.
--
-- La policy reste necessaire : validerVerification et rejeterVerification
-- (app/actions/admin.ts) ecrivent statut_verification via le client RLS, pas
-- via le service role. On la contraint donc au lieu de la supprimer.

drop policy if exists "users_update_verification_staff" on public.users;

create policy "users_update_verification_staff"
  on public.users for update
  using (public.is_staff())
  with check (
    public.is_staff()
    and role = public.stored_role(id)
  );

-- ============================================================
-- 4. Verrou en profondeur : trigger sur la colonne role
-- ============================================================
-- Les points 2 et 3 corrigent les policies existantes. Ce trigger garantit
-- qu'aucune policy permissive ajoutee plus tard ne pourra rouvrir la breche :
-- seul le service role peut changer un role, ce qui correspond aux deux seuls
-- appels legitimes de l'application (creerCompteInterne et
-- desactiverCompteInterne, tous deux en service role).
--
-- Equivalent UPDATE du verrou pose sur l'INSERT en migration 00003.

-- IMPORTANT : SECURITY INVOKER (defaut), surtout pas SECURITY DEFINER.
-- Sous SECURITY DEFINER, current_user vaut le proprietaire de la fonction
-- (postgres) et non le role de l'appelant : le test serait toujours faux et le
-- trigger ne bloquerait rien. La fonction n'a besoin d'aucun privilege eleve.
create or replace function public.lock_role_column()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.role is distinct from old.role
     and current_user not in ('service_role', 'supabase_admin', 'postgres')
  then
    raise exception
      'Modification directe de users.role interdite (role courant: %). Passer par une Server Action en service role.',
      current_user
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists users_lock_role on public.users;

create trigger users_lock_role
  before update on public.users
  for each row
  execute function public.lock_role_column();

-- Note : le role 'desactive' manquait au CHECK de users.role, ce qui faisait
-- echouer desactiverCompteInterne. Corrige par la migration 00033, appliquee
-- directement en production puis rapatriee dans le depot.
