-- ─────────────────────────────────────────────────────────────────────────────
-- 00072 — `finalisee` ne veut plus dire deux choses
--
-- Le statut portait deux sens selon le type de demande :
--
--   sur une demande `visite` → « la visite a eu lieu »
--   sur une demande `offre`  → « la vente est conclue », et le bien sort du
--                              catalogue en `vendu` ou `loue`
--
-- Le discriminant `type` évitait la collision aujourd'hui, et le code était
-- correctement cloisonné. Mais c'est exactement la classe d'erreur rencontrée
-- sur la livraison, où une annulation réutilisait `echec_livraison` : un statut
-- qui porte deux règles finit par en hériter une qui ne s'applique pas. Il a
-- suffi d'un changement de statut libre pour que ça morde.
--
-- `visite_realisee` sépare les deux. `finalisee` ne désigne plus qu'une chose :
-- une transaction conclue.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.demandes_immobilier drop constraint if exists demandes_immobilier_statut_check;

alter table public.demandes_immobilier add constraint demandes_immobilier_statut_check
  check (statut in (
    'en_attente', 'en_cours_traitement', 'visite_programmee', 'visite_realisee',
    'offre_soumise', 'contre_offre', 'acceptee', 'refusee', 'annulee', 'finalisee'
  ));

comment on column public.demandes_immobilier.statut is
  'Cycle de la demande. `visite_realisee` = la visite a eu lieu (la demande de visite est servie) ; `finalisee` = la transaction est conclue et le bien quitte le catalogue. Les confondre faisait sortir un bien du catalogue pour une simple visite.';

-- Reprise : les demandes de visite marquées `finalisee` désignaient une visite
-- effectuée, jamais une vente.
update public.demandes_immobilier
   set statut = 'visite_realisee'
 where type = 'visite'
   and statut = 'finalisee';
