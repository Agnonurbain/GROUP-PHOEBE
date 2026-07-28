-- Biens immobiliers de test — à exécuter après les migrations
-- Utilisation : psql -f seed-immobilier.sql
-- Ou dans le dashboard SQL de Supabase

-- Nettoyage préalable (optionnel)
-- delete from public.bien_medias where bien_id in (select id from public.biens where localisation like '%Test%');
-- delete from public.biens where localisation like '%Test%';

-- ── VENTES ──────────────────────────────────────────────────────────────────

with inserted as (
  insert into public.biens (type, transaction, prix, nb_chambres, surface_m2, localisation, description, statut)
  values
    ('appartement', 'vente', 45000000, 3, 85, 'Cocody, Abidjan',
     'Superbe appartement lumineux au cœur de Cocody. Salon traversant, cuisine équipée, climatisation centralisée, parking sécurisé. Résidence avec piscine et gardiennage 24h/7.',
     'disponible'),
    ('appartement', 'vente', 65000000, 4, 120, 'Plateau, Abidjan',
     'Appartement de standing au Plateau. Vue imprenable sur la lagune. Trois chambres en suite, grand salon, terrasse aménagée. Cuisine américaine entièrement équipée.',
     'disponible'),
    ('maison', 'vente', 85000000, 5, 200, 'Riviera Palmeraie, Abidjan',
     'Villa contemporaine avec piscine. 5 chambres dont une suite parentale avec dressing. Grand jardin arboré, garage pour 3 véhicules. Quartier résidentiel calme et sécurisé.',
     'disponible'),
    ('maison', 'vente', 120000000, 6, 350, 'Angré, Abidjan',
     'Magnifique villa de luxe. Piscine, jacuzzi, salle de cinéma, salle de sport. Toit terrasse avec vue panoramique. Domaine fermé avec surveillance électronique.',
     'disponible'),
    ('terrain', 'vente', 25000000, null, 500, 'Bingerville',
     'Terrain constructible de 500 m². Viabilisé, accès goudronné, à proximité des écoles et commerces. Idéal pour construction villa.',
     'disponible'),
    ('terrain', 'vente', 40000000, null, 800, 'Grand-Bassam',
     'Grand terrain de 800 m² dans la zone en plein essor de Grand-Bassam. Vue mer partielle, accès direct à la plage à 500 m. Permis de construire disponible.',
     'disponible'),
    ('bureau', 'vente', 35000000, null, 60, 'Zone 4, Marcory',
     'Bureau meublé de 60 m² en Zone 4. Open space ou 2 pièces. Climatisation, fibre optique, groupe électrogène, parking visiteur. Idéal start-up ou PME.',
     'disponible'),
    ('bureau', 'vente', 95000000, null, 150, 'II Plateaux, Abidjan',
     'Plateau de bureaux 150 m² entièrement rénové. 5 bureaux fermés + open space, salle de réunion, kitchenette. Accès PMR, parking souterrain.',
     'disponible')
  returning id, type, localisation
)
insert into public.bien_medias (bien_id, type, url, ordre)
select
  inserted.id,
  'photo',
  case inserted.type
    when 'appartement' then 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80'
    when 'maison' then 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80'
    when 'terrain' then 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80'
    when 'bureau' then 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80'
    else 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80'
  end,
  0
from inserted;

-- ── LOCATIONS ───────────────────────────────────────────────────────────────

with inserted as (
  insert into public.biens (type, transaction, prix, nb_chambres, surface_m2, localisation, description, statut)
  values
    ('appartement', 'location', 350000, 1, 30, 'Yopougon, Abidjan',
     'Studio meublé idéal pour étudiant ou jeune actif. Cuisine équipée, douche italienne, climatisation, wifi inclus. Proximité université et commerces.',
     'disponible'),
    ('appartement', 'location', 650000, 2, 55, 'Cocody Angré, Abidjan',
     'Appartement 2 pièces meublé. Salon avec canapé, chambre avec lit queen size, cuisine équipée, balcon. Résidence sécurisée avec ascenseur.',
     'disponible'),
    ('appartement', 'location', 1200000, 3, 90, 'Marcory, Abidjan',
     'Bel appartement 3 pièces haut standing. Chambres climatisées, cuisine américaine, grande terrasse. Résidence avec piscine, salle de sport et parking.',
     'disponible'),
    ('maison', 'location', 800000, 3, 130, 'Abobo, Abidjan',
     'Maison de ville 3 chambres. Cour intérieure, cuisine séparée, garage. Quartier calme, proche des axes principaux. Idéal famille.',
     'disponible'),
    ('maison', 'location', 2000000, 4, 250, 'Cocody, Abidjan',
     'Villa 4 chambres avec piscine. Grande salle à manger, salon double séjour, cuisine professionnelle. Jardin paysager avec terrasse couverte. Personnel de maison inclus.',
     'disponible'),
    ('bureau', 'location', 400000, null, 35, 'Treichville, Abidjan',
     'Bureau meublé 35 m². Climatisation, connexion fibre, accès 24h/7, salle de réunion partagée. Idéal pour indépendant ou petite équipe.',
     'disponible'),
    ('bureau', 'location', 1500000, null, 110, 'Cocody, Abidjan',
     'Étage entier de bureaux 110 m². 4 bureaux + salle de réunion + espace détente. Terrasse panoramique. Parking privatif 2 places.',
     'disponible')
  returning id, localisation
)
insert into public.bien_medias (bien_id, type, url, ordre)
select
  inserted.id,
  'photo',
  case
    when inserted.localisation like '%Yopougon%' then 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80'
    when inserted.localisation like '%Angré%' then 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80'
    when inserted.localisation like '%Marcory%' then 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80'
    when inserted.localisation like '%Abobo%' then 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80'
    when inserted.localisation like '%Cocody%' then 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80'
    when inserted.localisation like '%Treichville%' then 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80'
    else 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80'
  end,
  0
from inserted;
