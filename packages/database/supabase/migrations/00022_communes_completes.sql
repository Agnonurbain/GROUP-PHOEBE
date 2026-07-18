-- Corriger le classement des communes et compléter la liste
-- Bingerville, Songon, Anyama sont dans le District mais pas dans Abidjan-ville

-- Déplacer Bingerville, Songon, Anyama vers Grand Abidjan
update communes set zone_id = (select id from zones_tarifaires where nom = 'Grand Abidjan')
  where nom in ('Bingerville', 'Songon', 'Anyama')
    and zone_id = (select id from zones_tarifaires where nom = 'Abidjan');

-- Déplacer Yamoussoukro vers Intérieur du pays (c'est la capitale politique, pas le Grand Abidjan)
update communes set zone_id = (select id from zones_tarifaires where nom = 'Intérieur du pays')
  where nom = 'Yamoussoukro'
    and zone_id = (select id from zones_tarifaires where nom = 'Grand Abidjan');

-- Ajouter les communes manquantes du Grand Abidjan
insert into communes (nom, zone_id)
select v.nom, (select id from zones_tarifaires where nom = 'Grand Abidjan')
from (values
  ('Alépé'),
  ('Azaguié'),
  ('Bonoua')
) as v(nom)
where not exists (select 1 from communes c where c.nom = v.nom);

-- Déplacer Assinie, Aboisso, Agboville, Adzopé, Tiassalé vers Intérieur du pays
-- (ces villes ne font pas partie du Grand Abidjan administratif)
update communes set zone_id = (select id from zones_tarifaires where nom = 'Intérieur du pays')
  where nom in ('Assinie', 'Aboisso', 'Agboville', 'Adzopé', 'Tiassalé')
    and zone_id = (select id from zones_tarifaires where nom = 'Grand Abidjan');

-- Ajouter les communes manquantes de l'Intérieur du pays
insert into communes (nom, zone_id)
select v.nom, (select id from zones_tarifaires where nom = 'Intérieur du pays')
from (values
  ('Abengourou'),
  ('Dimbokro'),
  ('Guiglo'),
  ('Sassandra'),
  ('Soubré'),
  ('Touba')
) as v(nom)
where not exists (select 1 from communes c where c.nom = v.nom);
