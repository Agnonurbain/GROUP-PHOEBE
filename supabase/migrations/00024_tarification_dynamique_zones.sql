-- Tarification dynamique par zone : coefficients, caution, km, chauffeur

-- ============================================================
-- 1. Enrichir zones_tarifaires avec les règles de tarification
-- ============================================================

alter table zones_tarifaires
  add column if not exists coefficient_majoration numeric(4,2) not null default 1.00,
  add column if not exists caution_multiplicateur numeric(4,2) not null default 1.00,
  add column if not exists km_inclus_par_jour int not null default 150,
  add column if not exists supplement_km_fcfa int not null default 200,
  add column if not exists chauffeur_statut text not null default 'optionnel'
    check (chauffeur_statut in ('optionnel', 'recommande', 'obligatoire')),
  add column if not exists tarif_chauffeur_journalier int not null default 10000;

-- ============================================================
-- 2. Caution de base par véhicule (montant fixe en FCFA)
-- ============================================================

alter table vehicules
  add column if not exists caution_base_fcfa int;

-- ============================================================
-- 3. Seed : coefficients par zone (spec métier)
-- ============================================================

update zones_tarifaires set
  coefficient_majoration = 1.00,
  caution_multiplicateur = 1.00,
  km_inclus_par_jour = 150,
  supplement_km_fcfa = 200,
  chauffeur_statut = 'optionnel',
  tarif_chauffeur_journalier = 10000
where nom = 'Abidjan';

update zones_tarifaires set
  coefficient_majoration = 1.20,
  caution_multiplicateur = 1.50,
  km_inclus_par_jour = 200,
  supplement_km_fcfa = 200,
  chauffeur_statut = 'recommande',
  tarif_chauffeur_journalier = 15000
where nom = 'Grand Abidjan';

update zones_tarifaires set
  coefficient_majoration = 1.50,
  caution_multiplicateur = 2.00,
  km_inclus_par_jour = 400,
  supplement_km_fcfa = 150,
  chauffeur_statut = 'obligatoire',
  tarif_chauffeur_journalier = 25000
where nom = 'Intérieur du pays';
