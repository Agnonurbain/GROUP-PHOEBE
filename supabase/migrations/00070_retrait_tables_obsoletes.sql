-- ─────────────────────────────────────────────────────────────────────────────
-- 00070 — Retrait de `avis_transport` et `audit_logs`
--
-- Deux tables remplacées mais jamais supprimées, qui cohabitaient avec leur
-- successeur. Le coût n'est pas le stockage — elles sont vides — mais la
-- lecture : deux tables au nom presque identique laissent croire à deux
-- systèmes vivants, et le prochain qui écrit un journal d'audit a une chance
-- sur deux de viser la mauvaise. `audit_log` et `audit_logs` ne diffèrent que
-- par un « s ».
--
--   avis_transport → avis      (00059 : polymorphique, couvre les cinq modules)
--   audit_logs     → audit_log (00025 posait la seconde, jamais utilisée)
--
-- Vérifié avant écriture : les deux sont vides en production, et aucun code
-- applicatif ne les référence — seuls les artefacts générés de
-- `packages/database/dist` en portaient encore la trace.
-- ─────────────────────────────────────────────────────────────────────────────

-- Les policies et index disparaissent avec la table ; `cascade` couvre les
-- dépendances éventuelles (clés étrangères des migrations initiales).
drop table if exists public.avis_transport cascade;
drop table if exists public.audit_logs cascade;

comment on table public.avis is
  'Avis clients, polymorphique (reference_table + reference_id) : couvre les cinq modules. Remplace avis_transport, retirée en 00070.';

comment on table public.audit_log is
  'Journal d''audit — table unique. `audit_logs` (pluriel), posée en 00025 et jamais utilisée, a été retirée en 00070 : deux noms à un « s » près invitaient à écrire dans la mauvaise.';
