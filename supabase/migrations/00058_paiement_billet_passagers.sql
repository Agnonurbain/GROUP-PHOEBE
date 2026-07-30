-- Paiement des billets d'avion : devis avec date de validité, encaissement en
-- ligne, et table des passagers pour l'émission. Créée le 2026-07-30.
--
-- Le cycle devient : soumise → en_cours_traitement → devis_envoye → payee → emise
-- Le devis expire à `devis_valable_jusqu_a` : au-delà, le client ne peut plus payer.

-- ─── Validité du devis ───────────────────────────────────────────────────────

alter table public.demandes_billet
  add column if not exists devis_valable_jusqu_a timestamptz default null;

comment on column public.demandes_billet.devis_valable_jusqu_a is
  'Date d expiration du devis. Calculee a l envoi du devis : maintenant + validite_devis_heures.';

drop constraint if exists demandes_billet_statut_check on public.demandes_billet;

alter table public.demandes_billet
  add constraint demandes_billet_statut_check
  check (statut in (
    'soumise', 'en_cours_traitement', 'devis_envoye', 'payee', 'emise', 'annulee'
  ));

comment on column public.demandes_billet.statut is
  'soumise → en_cours_traitement → devis_envoye → payee → emise | annulee';

-- ─── Paramètre : durée de validité du devis ──────────────────────────────────
-- Ajouté à la table singleton existante.

alter table public.parametres_billet
  add column if not exists validite_devis_heures int not null default 48
    check (validite_devis_heures >= 1 and validite_devis_heures <= 720);

comment on column public.parametres_billet.validite_devis_heures is
  'Duree de validite du devis en heures. Le client ne peut pas payer apres expiration.';

-- ─── Passagers du billet ─────────────────────────────────────────────────────
-- Pour émettre des billets, la compagnie exige le nom exact, le passeport et la
-- date de naissance de chaque passager. Le formulaire initial capture le voyageur
-- principal ; les passagers supplémentaires sont collectés au moment du paiement.

create table public.passagers_billet (
  id uuid primary key default gen_random_uuid(),
  demande_id uuid not null references public.demandes_billet(id) on delete cascade,
  nom text not null,
  date_naissance date not null,
  passeport_numero text not null,
  passeport_expiration date not null,
  created_at timestamptz not null default now()
);

alter table public.passagers_billet enable row level security;

create policy "passagers_billet_select_own" on public.passagers_billet for select
  using (exists (
    select 1 from public.demandes_billet
    where id = demande_id and client_id = auth.uid()
  ) or public.is_staff());

create policy "passagers_billet_staff_manage" on public.passagers_billet for all
  using (public.is_staff()) with check (public.is_staff());

comment on table public.passagers_billet is
  'Passagers d une demande de billet. Le voyageur principal est dans demandes_billet.*, les autres ici.';

comment on column public.passagers_billet.demande_id is
  'Demande de billet parente.';

comment on column public.passagers_billet.nom is
  'Nom et prenoms exacts du passager, tels qu inscrits sur le passeport.';

comment on column public.passagers_billet.date_naissance is
  'Date de naissance exigee par la compagnie pour l emission du billet.';

comment on column public.passagers_billet.passeport_numero is
  'Numero du passeport du passager.';

comment on column public.passagers_billet.passeport_expiration is
  'Date d expiration du passeport du passager.';
