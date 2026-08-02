-- ─────────────────────────────────────────────────────────────────────────────
-- 00075 — Décompter les délais en heures ouvrées
--
-- Allonger un délai ne faisait que déplacer le problème : une demande arrivée
-- le samedi soir expirait toujours sans réponse, quelle que soit la valeur.
--
-- Les trois délais n'appellent pourtant pas la même réponse, parce qu'ils ne
-- mesurent pas la même chose.
--
--   • Réponse à une demande de prix — mesure la réactivité de L'ÉQUIPE, qui ne
--     répond pas à trois heures du matin.                    → heures ouvrées
--
--   • Retard au retrait — mesure une présence PHYSIQUE en agence. Le compter en
--     heures calendaires retiendrait une caution parce que l'agence était
--     fermée : une pénalité pour un empêchement qu'on a créé soi-même.
--                                                            → heures ouvrées
--
--   • Demande acceptée sans suite — mesure la réactivité du CLIENT, qui règle
--     en ligne. Le paiement en ligne, lui, est ouvert la nuit : le décompte
--     calendaire y est correct.                              → calendaire
--
-- Chacun reste réglable indépendamment : ce sont des choix d'exploitation, pas
-- des vérités techniques.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.parametres_transport
  -- 1 = lundi … 7 = dimanche. Lundi-samedi par défaut, usage courant à Abidjan.
  add column if not exists jours_ouvres smallint[] not null default '{1,2,3,4,5,6}',
  add column if not exists heure_ouverture time not null default '08:00',
  add column if not exists heure_fermeture time not null default '18:00',
  add column if not exists delai_negociation_ouvre boolean not null default true,
  add column if not exists delai_non_presentation_ouvre boolean not null default true,
  add column if not exists delai_sans_reponse_ouvre boolean not null default false;

comment on column public.parametres_transport.jours_ouvres is
  'Jours d''ouverture, 1 = lundi … 7 = dimanche. Vide, ou horaires inversés, rend le décompte insoluble : le code retombe alors sur un calcul calendaire plutôt que de ne jamais expirer.';

comment on column public.parametres_transport.delai_negociation_ouvre is
  'Décompter la fenêtre de réponse en heures ouvrées. Une demande du vendredi 17 h expire alors le lundi matin, pas pendant le week-end.';

comment on column public.parametres_transport.delai_non_presentation_ouvre is
  'Décompter le retard au retrait en heures ouvrées. Sans cela, une caution serait retenue parce que l''agence était fermée.';

comment on column public.parametres_transport.delai_sans_reponse_ouvre is
  'Faux par défaut : ce délai mesure le client, qui règle en ligne — et le paiement en ligne ne ferme pas la nuit.';

-- L'ouverture doit précéder la fermeture, sinon aucune plage n'existe et le
-- décompte ne s'épuiserait jamais.
alter table public.parametres_transport
  drop constraint if exists parametres_transport_horaires_check;
alter table public.parametres_transport
  add constraint parametres_transport_horaires_check
  check (heure_ouverture < heure_fermeture);
