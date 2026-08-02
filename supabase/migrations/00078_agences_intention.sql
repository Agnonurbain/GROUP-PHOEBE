-- ─────────────────────────────────────────────────────────────────────────────
-- 00078 — `agences` est vide par intention, pas par oubli
--
-- La table date du schéma initial, ne contient qu'une ligne (« Agence
-- principale »), et les trois colonnes `agence_id` qui la référencent —
-- `users`, `chauffeurs`, `vehicules` — sont vides. Aucun code ne la lit.
--
-- Elle a donc toutes les apparences d'une table morte, et un audit la
-- proposera à la suppression aussi souvent qu'on la regardera. Décision de
-- l'exploitant le 02/08/2026 : elle est CONSERVÉE, le multi-agences étant au
-- programme quand la société s'étendra. On l'écrit ici pour que l'intention
-- survive à la mémoire de ceux qui l'ont prise.
-- ─────────────────────────────────────────────────────────────────────────────

comment on table public.agences is
  'Points de vente. Volontairement dormante : une seule ligne, et les colonnes agence_id de users, chauffeurs et vehicules sont vides. Conservée pour le multi-agences à venir (décision du 02/08/2026) — ne pas supprimer au motif qu''elle est inutilisée.';

comment on column public.agences.ville is
  'Vide tant que GROUP PHOEBE opère depuis un seul point. À renseigner à l''ouverture d''une seconde agence.';
