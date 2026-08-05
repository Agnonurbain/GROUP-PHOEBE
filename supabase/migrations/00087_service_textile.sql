-- ─────────────────────────────────────────────────────────────────────────────
-- 00087 — Nouveau service : Textile (vente de pagnes)
--
-- Cinquième métier de GROUP PHOEBE, après transport, livraison, immobilier et
-- assistance.
--
-- ─── Pourquoi AUCUN prix n'est affiché ───────────────────────────────────────
-- Retour de l'exploitant (`docs/retours/2026-08-04-textile.md`) :
--
--   « Il y a tellement de fournisseurs qui les vendent à leur prix. Les gens
--     prennent chez Uniwax, il y a des fournisseurs qui prennent chez Uniwax et
--     qui vendent au prix qu'ils veulent. Donc ON NE PEUT PAS AFFICHER UN PRIX
--     comme ça. Tu mets plutôt des devis. »
--
--   « On ne peut pas imposer un prix fixe. Donc, des devis, c'est tout. »
--
-- Ce n'est pas un tarif manquant qu'on finira par renseigner — c'est la nature
-- du marché. Le pagne n'a pas de prix de référence tenable : chaque revendeur
-- fixe le sien. La table des types ne porte donc AUCUNE colonne de prix, et
-- c'est délibéré : en ajouter une inviterait à la remplir, et le site
-- annoncerait un montant que l'équipe ne pourrait pas tenir.
--
-- Le montant naît sur la demande, une fois que l'équipe a consulté ses
-- fournisseurs. Même mécanisme que le devis d'un billet d'avion.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. Les types de pagne ───────────────────────────────────────────────────
-- Uniwax (Print, Block, Tabs) et Hollandais. La marque est un champ libre :
-- l'exploitant en ajoutera d'autres sans déploiement, comme pour les moyens de
-- livraison.

create table if not exists public.types_pagne (
  cle text primary key check (cle ~ '^[a-z0-9_]+$'),
  marque text not null check (length(trim(marque)) between 1 and 60),
  gamme text not null check (length(trim(gamme)) between 1 and 60),
  description text,
  ordre int not null unique,
  actif boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.types_pagne (cle, marque, gamme, description, ordre) values
  ('uniwax_print', 'Uniwax', 'Print',
   'Wax imprimé Uniwax, fabriqué à Abidjan. La gamme la plus courante.', 1),
  ('uniwax_block', 'Uniwax', 'Block',
   'Wax Block Uniwax : une à trois couleurs supplémentaires appliquées sur le motif de base.', 2),
  ('uniwax_tabs',  'Uniwax', 'Tabs', null, 3),
  ('hollandais',   'Hollandais', 'Wax hollandais',
   'Wax d''origine hollandaise.', 4)
on conflict (cle) do nothing;

comment on table public.types_pagne is
  'Types de pagne proposés. AUCUNE colonne de prix, et c''est délibéré : le marché du pagne n''a pas de prix de référence tenable, chaque revendeur fixe le sien. Le montant naît sur la demande, après consultation des fournisseurs.';

comment on column public.types_pagne.marque is
  'Champ libre : d''autres marques s''ajoutent sans déploiement.';

comment on column public.types_pagne.actif is
  'Un type retiré du catalogue passe à faux, il ne se supprime pas : des demandes passées le référencent.';

alter table public.types_pagne enable row level security;

create policy "types_pagne_select_public"
  on public.types_pagne for select using (true);

create policy "types_pagne_manage_proprietaire"
  on public.types_pagne for all
  using (public.is_proprietaire()) with check (public.is_proprietaire());

-- ─── 2. Les demandes de devis ────────────────────────────────────────────────

create table if not exists public.demandes_textile (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.users(id) on delete cascade,

  type_pagne text not null references public.types_pagne(cle),

  -- Ce que le client cherche. Le motif est décrit en toutes lettres : sans
  -- catalogue de références, c'est le seul moyen de le désigner.
  motif text,
  couleurs text,
  quantite int not null check (quantite between 1 and 10000),
  unite text not null default 'pagne' check (unite in ('pagne', 'yard', 'piece')),

  message text,

  statut text not null default 'soumise' check (statut in (
    'soumise', 'en_cours_traitement', 'devis_envoye', 'confirmee', 'livree', 'annulee'
  )),

  -- Le montant est écrit par le PROPRIÉTAIRE seul, comme partout dans ce
  -- projet : c'est un montant facturé.
  montant_propose numeric(14,2) check (montant_propose is null or montant_propose > 0),
  devis_valable_jusqu_a timestamptz,

  conseiller_id uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists demandes_textile_client_idx on public.demandes_textile (client_id);
create index if not exists demandes_textile_statut_idx on public.demandes_textile (statut);

comment on table public.demandes_textile is
  'Demandes de devis pour du pagne. Le prix n''est jamais affiché au catalogue : il est arrêté ici, demande par demande, après consultation des fournisseurs.';

comment on column public.demandes_textile.unite is
  'pagne (6 yards, l''usage courant) | yard | piece. Le client dit dans quelle unité il compte.';

comment on column public.demandes_textile.motif is
  'Le motif recherché, en toutes lettres. Sans catalogue de références, c''est le seul moyen de le désigner.';

alter table public.demandes_textile enable row level security;

create policy "demandes_textile_select_own"
  on public.demandes_textile for select
  using (client_id = auth.uid() or public.is_staff());

create policy "demandes_textile_insert_own"
  on public.demandes_textile for insert
  with check (client_id = auth.uid());

create policy "demandes_textile_staff_manage"
  on public.demandes_textile for all
  using (public.is_staff()) with check (public.is_staff());

-- ─── 3. La garde sur le montant ──────────────────────────────────────────────
-- La policy `staff_manage` laisse un opérateur écrire n'importe quelle colonne
-- via l'API REST, montant compris. Le trigger est le seul rempart sur ce
-- chemin — même construction qu'en 00047 et 00049.
--
-- `security invoker` est délibéré : en `security definer`, `current_user`
-- vaudrait le propriétaire de la fonction et la garde bloquerait TOUS les
-- chemins, server actions incluses.

create or replace function public.garde_montant_textile()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- Ne cible que les rôles de bout de chaîne PostgREST : la clé de service des
  -- server actions passe par un autre rôle, et ces actions ont leur propre
  -- garde applicative.
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  if new.montant_propose is distinct from old.montant_propose
     and not public.is_proprietaire() then
    raise exception 'Seul le proprietaire peut chiffrer une demande textile';
  end if;

  return new;
end;
$$;

drop trigger if exists garde_montant_textile on public.demandes_textile;
create trigger garde_montant_textile
  before update on public.demandes_textile
  for each row execute function public.garde_montant_textile();
