-- GROUP PHOEBE — Durcissement RLS des données client
--
-- Plusieurs tables sensibles n'avaient NI RLS activée NI politique : demandes_transport,
-- demandes_immobilier, dossiers_voyage, documents_dossier_voyage, paiements, biens.
-- Le rôle `authenticated` ayant les droits d'accès PostgREST, tout utilisateur connecté
-- pouvait lire/écrire TOUTES les lignes via l'API (données personnelles + paiements).
--
-- Modèle appliqué :
--   • Le client lit SES propres lignes (client_id = auth.uid()).
--   • Le staff (operateur/proprietaire) a tous les droits (les pages admin utilisent le
--     client authentifié, donc soumis à la RLS ; public.is_staff() est SECURITY DEFINER).
--   • Les écritures « client » de l'app passent toutes par le service-role (qui contourne
--     la RLS) : aucune politique d'écriture client n'est donc nécessaire.
--   • biens = catalogue immobilier public → lecture publique.
--   • paiements = propriété vérifiée via l'entité référencée (helper SECURITY DEFINER
--     pour éviter la RLS imbriquée).

-- ── Helper : le paiement appartient-il à l'utilisateur courant ? ──────────────
create or replace function public.owns_paiement(ref_id uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select
    exists (select 1 from public.demandes_transport where id = ref_id and client_id = auth.uid())
    or exists (select 1 from public.demandes_immobilier where id = ref_id and client_id = auth.uid())
    or exists (select 1 from public.dossiers_voyage where id = ref_id and client_id = auth.uid())
    or exists (select 1 from public.expeditions where id = ref_id and client_id = auth.uid());
$$;

-- ── demandes_transport ───────────────────────────────────────────────────────
alter table public.demandes_transport enable row level security;

create policy "demandes_transport_select_own"
  on public.demandes_transport for select
  using (client_id = auth.uid() or public.is_staff());

create policy "demandes_transport_staff_manage"
  on public.demandes_transport for all
  using (public.is_staff())
  with check (public.is_staff());

-- ── demandes_immobilier ──────────────────────────────────────────────────────
alter table public.demandes_immobilier enable row level security;

create policy "demandes_immobilier_select_own"
  on public.demandes_immobilier for select
  using (client_id = auth.uid() or public.is_staff());

create policy "demandes_immobilier_staff_manage"
  on public.demandes_immobilier for all
  using (public.is_staff())
  with check (public.is_staff());

-- ── dossiers_voyage ──────────────────────────────────────────────────────────
alter table public.dossiers_voyage enable row level security;

create policy "dossiers_voyage_select_own"
  on public.dossiers_voyage for select
  using (client_id = auth.uid() or public.is_staff());

create policy "dossiers_voyage_staff_manage"
  on public.dossiers_voyage for all
  using (public.is_staff())
  with check (public.is_staff());

-- ── documents_dossier_voyage (pièces jointes — PII) ──────────────────────────
alter table public.documents_dossier_voyage enable row level security;

create policy "documents_dossier_voyage_select_own"
  on public.documents_dossier_voyage for select
  using (
    public.is_staff()
    or exists (
      select 1 from public.dossiers_voyage d
      where d.id = dossier_id and d.client_id = auth.uid()
    )
  );

create policy "documents_dossier_voyage_staff_manage"
  on public.documents_dossier_voyage for all
  using (public.is_staff())
  with check (public.is_staff());

-- ── paiements ────────────────────────────────────────────────────────────────
alter table public.paiements enable row level security;

create policy "paiements_select_own"
  on public.paiements for select
  using (public.is_staff() or public.owns_paiement(reference_id));

create policy "paiements_staff_manage"
  on public.paiements for all
  using (public.is_staff())
  with check (public.is_staff());

-- ── biens (catalogue immobilier public) ──────────────────────────────────────
alter table public.biens enable row level security;

create policy "biens_select_public"
  on public.biens for select
  using (true);

create policy "biens_staff_manage"
  on public.biens for all
  using (public.is_staff())
  with check (public.is_staff());
