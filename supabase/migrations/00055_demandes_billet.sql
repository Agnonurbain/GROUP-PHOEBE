-- Vente de billets d'avion : demandes de réservation.
-- Créée le 2026-07-29.
--
-- Table distincte de `dossiers_voyage` à dessein : un dossier visa et une
-- réservation de billet n'ont ni les mêmes champs, ni les mêmes statuts, ni le
-- même interlocuteur. Les fondre aurait imposé une table dont la moitié des
-- colonnes est nulle selon le cas.
--
-- Le vol n'est pas cherché en direct : il n'y a pas de connexion GDS. Le client
-- décrit son besoin, l'équipe cherche puis répond avec un prix. D'où
-- `montant_propose`, soumis à la même règle que tous les montants du projet :
-- écriture réservée au propriétaire (garde applicative + trigger ci-dessous).

create table public.demandes_billet (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.users(id) on delete cascade,

  -- Trajet. « Multi-destinations », présent sur les comparateurs, est hors
  -- périmètre : il demanderait une liste de segments, donc une table fille.
  type_trajet text not null check (type_trajet in ('aller_simple', 'aller_retour')),
  depart text not null,
  destination text not null,
  date_depart date not null,
  date_retour date,

  -- Ventilation des voyageurs, telle que la pratiquent les compagnies : le tarif
  -- diffère par tranche d'âge, et un bébé sans siège n'est pas un enfant.
  nb_adultes int not null default 1 check (nb_adultes >= 1),
  nb_enfants int not null default 0 check (nb_enfants >= 0),
  nb_bebes int not null default 0 check (nb_bebes >= 0),

  classe text not null default 'economique'
    check (classe in ('economique', 'premium', 'affaires', 'premiere')),

  -- Passeport du voyageur principal. Le nom doit être celui du passeport : une
  -- divergence avec le billet le rend inutilisable à l'embarquement.
  passeport_nom text not null,
  passeport_numero text not null,
  passeport_expiration date not null,

  message text,

  statut text not null default 'soumise' check (statut in (
    'soumise', 'en_cours_traitement', 'devis_envoye', 'emise', 'annulee'
  )),

  -- Prix proposé par l'équipe. Null jusqu'au devis.
  montant_propose numeric(14,2) check (montant_propose is null or montant_propose > 0),

  conseiller_id uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Un aller-retour a une date de retour, un aller simple n'en a pas. Sans cette
-- contrainte, un aller-retour sans retour serait accepté et l'équipe chercherait
-- un vol qu'elle ne peut pas définir.
alter table public.demandes_billet
  add constraint demandes_billet_retour_coherent
  check (
    (type_trajet = 'aller_simple' and date_retour is null)
    or (type_trajet = 'aller_retour' and date_retour is not null and date_retour >= date_depart)
  );

create index demandes_billet_client_idx on public.demandes_billet (client_id);
create index demandes_billet_statut_idx on public.demandes_billet (statut);

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.demandes_billet enable row level security;

create policy "demandes_billet_select_own"
  on public.demandes_billet for select
  using (client_id = auth.uid() or public.is_staff());

create policy "demandes_billet_staff_manage"
  on public.demandes_billet for all
  using (public.is_staff())
  with check (public.is_staff());

-- ── Garde sur le montant proposé ────────────────────────────────────────────
-- Même dispositif que `garde_montants` (00047) et `garde_prix` (00049) : la
-- policy staff_manage laisse un opérateur écrire toutes les colonnes via l'API
-- REST avec la clé anon, publique par nature. Seul le propriétaire chiffre.
--
-- SECURITY INVOKER volontaire : en security definer, `current_user` vaudrait le
-- propriétaire de la fonction et la garde bloquerait aussi les server actions.
create or replace function public.garde_montant_billet()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  if (tg_op = 'INSERT' and new.montant_propose is not null)
     or (tg_op = 'UPDATE' and new.montant_propose is distinct from old.montant_propose) then
    if not public.is_proprietaire() then
      raise exception 'Seul le proprietaire peut chiffrer un billet'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

create trigger garde_montant
  before insert or update on public.demandes_billet
  for each row
  execute function public.garde_montant_billet();
