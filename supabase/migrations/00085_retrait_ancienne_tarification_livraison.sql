-- ─────────────────────────────────────────────────────────────────────────────
-- 00085 — Retrait de l'ancienne tarification de livraison
--
-- `tarifs_livraison` (grille zone × mode) et `paliers_poids` ne pilotent plus
-- aucun prix depuis 00084 : le moyen — le véhicule — a remplacé le poids, et le
-- mode s'applique en coefficient.
--
-- Elles avaient été conservées le temps que le nouveau chemin tourne en
-- production, pour ne pas casser un déploiement en cours. C'est fait : plus une
-- ligne de code ne les lit.
--
-- Les laisser plus longtemps produirait exactement ce que ce dépôt a passé la
-- journée à corriger — deux endroits qui décrivent la même chose, dont un seul
-- est vrai. Le prochain qui chercherait « les tarifs de livraison » tomberait
-- sur la table périmée, qui a le meilleur nom.
-- ─────────────────────────────────────────────────────────────────────────────

drop table if exists public.tarifs_livraison;
drop table if exists public.paliers_poids;
