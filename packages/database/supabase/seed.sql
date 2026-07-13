-- Véhicule de test — à exécuter après les migrations

insert into public.vehicules (
  categorie, marque, modele, annee, nb_places, climatisation,
  boite, carburant, kilometrage, localisation,
  prix_journalier, prix_mensuel, chauffeur_disponible,
  description, statut
) values (
  'leger',
  'Toyota',
  'Corolla Cross',
  2024,
  5,
  true,
  'automatique',
  'Essence',
  12000,
  'Abidjan, Cocody',
  35000,
  650000,
  true,
  'Toyota Corolla Cross 2024 en excellent état. Climatisation, boîte automatique, intérieur cuir. Idéal pour vos déplacements professionnels et personnels à Abidjan.',
  'disponible'
);
