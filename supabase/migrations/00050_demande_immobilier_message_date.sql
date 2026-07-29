-- demandes_immobilier : stocker le message et la date souhaitée du client.
-- Créée le 2026-07-29.
--
-- Ces deux informations étaient saisies par le client dans le formulaire du bien
-- puis... perdues. Aucune colonne ne les portait : elles n'existaient que dans
-- le texte de la notification admin, laquelle n'était de toute façon jamais
-- créée (la requête listant le staff tournait avec la session du client, que la
-- policy users_select_own limite à sa propre ligne). Un client demandant une
-- visite pour une date précise n'était donc lu par personne.
alter table public.demandes_immobilier
  add column if not exists message text,
  add column if not exists date_souhaitee date;

comment on column public.demandes_immobilier.message is
  'Message libre saisi par le client à la création de la demande.';
comment on column public.demandes_immobilier.date_souhaitee is
  'Date de visite souhaitée par le client (type visite). Indicative : le créneau ferme est porté par visites.creneau.';
