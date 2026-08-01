-- ─────────────────────────────────────────────────────────────────────────────
-- 00068 — Gestion des chauffeurs
--
-- Le module transport vend l'option « avec chauffeur » depuis l'origine, mais
-- aucun chemin ne permettait d'en créer un : les deux pages admin qui touchent
-- la table ne font que la lire, et `/admin/comptes` ne crée que des comptes.
-- Avec zéro chauffeur en base, `assignerVehiculesGroupe` ne trouvait aucun
-- candidat, libérait le véhicule et l'écartait — le client lisait « Ce véhicule
-- n'est pas disponible » alors que le véhicule l'était, et que c'est le
-- chauffeur qui manquait.
--
-- Les policies existent déjà (`chauffeurs_staff_manage`, 00048) : il ne manquait
-- que l'interface. Cette migration ne pose que les garanties d'intégrité qui
-- l'accompagnent.
-- ─────────────────────────────────────────────────────────────────────────────

-- Un numéro identifie une personne. Sans cette contrainte, le même chauffeur
-- saisi deux fois devient deux ressources concurrentes : l'affectation le
-- croirait libre sur une course alors qu'il conduit déjà sur l'autre, et
-- `disponibilites_chauffeur` — dont l'exclusion GiST protège les chevauchements
-- — ne verrait aucun conflit entre deux identifiants distincts.
create unique index if not exists chauffeurs_telephone_unique
  on public.chauffeurs (telephone);

comment on column public.chauffeurs.actif is
  'Un chauffeur inactif ne reçoit plus de nouvelle affectation (filtre appliqué dans assignerVehiculesGroupe), mais reste porté par ses courses en cours.';

comment on column public.chauffeurs.permis_professionnel_url is
  'Permis de conduire professionnel. Renseigné à la main aujourd''hui : aucun circuit de vérification ne l''exploite.';
