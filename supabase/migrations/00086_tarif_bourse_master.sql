-- ─────────────────────────────────────────────────────────────────────────────
-- 00086 — Le tarif de la bourse Master
--
-- 00080 a créé la bourse Master au tarif de la Licence, faute d'un montant
-- communiqué — c'était une hypothèse, signalée comme telle.
--
-- GROUP PHOEBE a tranché : 2 000 000 FCFA.
--
-- Ce montant est pilotable depuis /admin/tarifs, et le corriger là aurait suffi
-- pour la production. Mais il vivrait alors dans une seule base : une
-- reconstruction repartirait de l'hypothèse. Une valeur donnée par l'exploitant
-- appartient aux migrations, pas seulement à la ligne qu'elle a corrigée.
-- ─────────────────────────────────────────────────────────────────────────────

update public.tarifs_assistance
   set prix = 2000000, updated_at = now()
 where pays_slug = 'chine' and prestation_key = 'bourse_master';

-- Filet : si la ligne manquait — base reconstruite dans un ordre inattendu, ou
-- 00080 rejoué sur une base vide — elle est créée au bon montant plutôt que
-- laissée absente, ce qui afficherait « Sur devis » au client.
insert into public.tarifs_assistance (pays_slug, prestation_key, prix)
values ('chine', 'bourse_master', 2000000)
on conflict (pays_slug, prestation_key) do nothing;
