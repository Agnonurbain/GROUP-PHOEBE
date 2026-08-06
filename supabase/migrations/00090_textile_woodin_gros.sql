-- ─────────────────────────────────────────────────────────────────────────────
-- 00090 — Woodin, et la vente en gros
--
-- Retour de l'exploitant du 05/08/2026 (`docs/retours/2026-08-05-textile-woodin.md`) :
--
--   « Maintenant, on va vendre en gros et puis vendre en balles. Très moins
--     cher. […] Nous, on est grossiste. Ceux qui veulent revendre les pagnes,
--     on peut les fournir à un bon coût. »
--
-- Deux choses, donc : une marque de plus, et un métier de plus — celui de
-- fournisseur des revendeurs, à côté de la vente au particulier.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. Woodin ───────────────────────────────────────────────────────────────
-- Marque ghanéenne du groupe Vlisco, largement distribuée en Côte d'Ivoire.
-- Même forme que le hollandais : une marque, une gamme du même nom — l'exploitant
-- n'a pas détaillé de sous-gammes, et en inventer reviendrait à annoncer un
-- catalogue qu'on n'a pas.

insert into public.types_pagne (cle, marque, gamme, description, ordre) values
  ('woodin', 'Woodin', 'Wax Woodin',
   'Wax Woodin, marque du groupe Vlisco, largement distribuée en Côte d''Ivoire.',
   5)
on conflict (cle) do nothing;

-- ─── 2. La balle ─────────────────────────────────────────────────────────────
-- L'unité du grossiste. « Vendre en balles » n'est pas une façon de parler :
-- c'est le conditionnement dans lequel le pagne se négocie entre professionnels,
-- et une demande exprimée en balles ne se chiffre pas comme une demande en
-- pagnes.

alter table public.demandes_textile drop constraint if exists demandes_textile_unite_check;
alter table public.demandes_textile
  add constraint demandes_textile_unite_check
  check (unite in ('pagne', 'yard', 'piece', 'balle'));

comment on column public.demandes_textile.unite is
  'pagne (6 yards, l''usage courant) | yard | piece | balle. La balle est l''unité du grossiste : une demande exprimée ainsi ne se chiffre pas comme une demande au détail.';

-- ─── 3. L'intention de revente ───────────────────────────────────────────────
-- Un revendeur et un particulier n'achètent pas la même chose au même prix.
-- L'équipe doit le savoir AVANT de consulter ses fournisseurs, sinon elle
-- chiffre au détail une demande qui attendait un tarif de gros.
--
-- C'est une déclaration du client, pas un statut vérifié : rien ne l'empêche de
-- cocher la case. Ce n'est pas un problème — la case n'ouvre aucun droit, elle
-- oriente un devis que l'équipe établit de toute façon à la main.
--
-- AUCUN taux de marge n'est stocké ni affiché. Le retour en annonce un, mais les
-- deux transcriptions n'en donnent pas le même chiffre, et surtout : annoncer une
-- marge revient à annoncer un prix, ce que ce service ne fait pas (00087).

alter table public.demandes_textile
  add column if not exists pour_revente boolean not null default false;

comment on column public.demandes_textile.pour_revente is
  'Le client déclare acheter pour revendre. Oriente le devis vers le tarif de gros. Déclaratif, non vérifié : la case n''ouvre aucun droit, elle informe celui qui chiffre.';

create index if not exists demandes_textile_revente_idx
  on public.demandes_textile (pour_revente) where pour_revente;
