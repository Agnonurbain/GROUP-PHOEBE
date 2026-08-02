-- Test : la contrainte d'exclusion gist rejette les chevauchements de période
-- Exécuter manuellement sur une instance Supabase avec les migrations appliquées.

begin;

-- Crée un véhicule de test
insert into vehicules (id, categorie, marque, modele, statut)
values ('00000000-0000-0000-0000-000000000001', 'leger', 'Test', 'Exclusion', 'disponible');

-- Premier blocage : 15-20 juillet 2026
insert into disponibilites_vehicule (vehicule_id, periode, type)
values (
  '00000000-0000-0000-0000-000000000001',
  '[2026-07-15, 2026-07-20)'::tstzrange,
  'maintenance'
);

-- Deuxième blocage chevauchant : 18-25 juillet 2026
-- Doit échouer avec : conflicting key value violates exclusion constraint
do $$
begin
  insert into disponibilites_vehicule (vehicule_id, periode, type)
  values (
    '00000000-0000-0000-0000-000000000001',
    '[2026-07-18, 2026-07-25)'::tstzrange,
    'reservation'
  );
  raise exception 'TEST FAILED: overlapping insert should have been rejected';
exception
  when exclusion_violation then
    raise notice 'TEST PASSED: overlapping period correctly rejected by exclusion constraint (code %)' , sqlstate;
end;
$$;

-- Vérification : période adjacente non chevauchante (20-25) doit passer
insert into disponibilites_vehicule (vehicule_id, periode, type)
values (
  '00000000-0000-0000-0000-000000000001',
  '[2026-07-20, 2026-07-25)'::tstzrange,
  'bloque'
);

raise notice 'TEST PASSED: adjacent non-overlapping period accepted';

-- Test chauffeur
insert into chauffeurs (id, nom, telephone)
values ('00000000-0000-0000-0000-000000000002', 'Test Chauffeur', '+2250000000');

insert into disponibilites_chauffeur (chauffeur_id, periode)
values (
  '00000000-0000-0000-0000-000000000002',
  '[2026-07-15, 2026-07-20)'::tstzrange
);

do $$
begin
  insert into disponibilites_chauffeur (chauffeur_id, periode)
  values (
    '00000000-0000-0000-0000-000000000002',
    '[2026-07-17, 2026-07-22)'::tstzrange
  );
  raise exception 'TEST FAILED: overlapping chauffeur insert should have been rejected';
exception
  when exclusion_violation then
    raise notice 'TEST PASSED: overlapping chauffeur period correctly rejected by exclusion constraint';
end;
$$;

-- Nettoyage
rollback;
