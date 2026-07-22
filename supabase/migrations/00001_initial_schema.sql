-- GROUP PHOEBE — Schema initial complet
-- Reproduit intégralement le Modele_de_donnees_GROUP_PHOEBE.md

-- Extensions requises
create extension if not exists btree_gist;
create extension if not exists pgcrypto;

-- ============================================================
-- 0. Préparation multi-site
-- ============================================================

create table agences (
  id uuid primary key default gen_random_uuid(),
  nom text not null default 'Agence principale',
  ville text,
  created_at timestamptz not null default now()
);

insert into agences (nom) values ('Agence principale');

-- ============================================================
-- 1. Utilisateurs et rôles
-- ============================================================

create table users (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('client', 'operateur', 'proprietaire', 'livreur', 'agent_immobilier')),
  nom text not null,
  telephone text not null unique,
  email text unique,
  agence_id uuid references agences(id),

  statut_verification text not null default 'non_verifie'
    check (statut_verification in ('non_verifie', 'documents_soumis', 'verifie', 'rejete')),
  piece_identite_url text,
  permis_conduire_url text,
  date_naissance date,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table chauffeurs (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  telephone text not null,
  permis_professionnel_url text,
  agence_id uuid references agences(id),
  actif boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 2. Module Transport
-- ============================================================

-- 2.1 Catalogue véhicules

create table vehicules (
  id uuid primary key default gen_random_uuid(),
  agence_id uuid references agences(id),
  categorie text not null check (categorie in ('leger', 'car', 'minibus')),
  marque text not null,
  modele text not null,
  annee int,
  nb_places int,
  climatisation boolean not null default false,
  boite text check (boite in ('automatique', 'manuelle')),
  carburant text,
  kilometrage int,
  localisation text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  prix_journalier numeric(12,2),
  prix_mensuel numeric(12,2),
  prix_vente numeric(12,2),
  chauffeur_disponible boolean not null default false,
  description text,

  carte_grise_url text,
  certificat_non_gage_url text,

  statut text not null default 'disponible'
    check (statut in ('disponible', 'reserve', 'loue', 'vendu', 'indisponible')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table vehicule_photos (
  id uuid primary key default gen_random_uuid(),
  vehicule_id uuid not null references vehicules(id) on delete cascade,
  url text not null,
  ordre int not null default 0
);

-- 2.2 Disponibilités

create table disponibilites_vehicule (
  id uuid primary key default gen_random_uuid(),
  vehicule_id uuid not null references vehicules(id) on delete cascade,
  periode tstzrange not null,
  type text not null default 'reservation' check (type in ('reservation', 'maintenance', 'bloque')),
  exclude using gist (vehicule_id with =, periode with &&)
);

create table disponibilites_chauffeur (
  id uuid primary key default gen_random_uuid(),
  chauffeur_id uuid not null references chauffeurs(id) on delete cascade,
  periode tstzrange not null,
  exclude using gist (chauffeur_id with =, periode with &&)
);

-- 2.3 Demandes (réservation directe et devis)

create table demandes_transport (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references users(id),
  vehicule_id uuid references vehicules(id),

  type text not null check (type in ('reservation_directe', 'devis')),
  categorie text not null check (categorie in ('classique', 'evenementiel', 'scolaire', 'personnel')),

  periode tstzrange,
  ville_depart text,
  destination text,

  avec_chauffeur boolean not null default false,
  chauffeur_id uuid references chauffeurs(id),

  montant numeric(12,2),
  caution numeric(12,2),
  methode_paiement text check (methode_paiement in ('cinetpay', 'stripe', 'agence')),

  statut text not null default 'en_attente_paiement' check (statut in (
    'en_attente_paiement', 'en_attente_validation', 'acceptee',
    'refusee', 'annulee', 'terminee'
  )),
  devis_expire_at timestamptz,

  etat_lieux_depart_photos text[],
  etat_lieux_retour_photos text[],

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table conducteurs_secondaires (
  id uuid primary key default gen_random_uuid(),
  demande_transport_id uuid not null references demandes_transport(id) on delete cascade,
  nom text not null,
  permis_conduire_url text not null,
  statut_verification text not null default 'documents_soumis'
    check (statut_verification in ('documents_soumis', 'verifie', 'rejete')),
  created_at timestamptz not null default now()
);

create table contrats_recurrents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references users(id),
  categorie text not null check (categorie in ('scolaire', 'personnel')),
  vehicule_id uuid references vehicules(id),
  date_debut date not null,
  date_fin date,
  frequence_facturation text check (frequence_facturation in ('mensuelle', 'trimestrielle', 'annuelle')),
  montant_periodique numeric(12,2),
  statut text not null default 'actif' check (statut in ('actif', 'suspendu', 'resilie')),
  created_at timestamptz not null default now()
);

create table avis_transport (
  id uuid primary key default gen_random_uuid(),
  demande_id uuid not null references demandes_transport(id) on delete cascade,
  note int not null check (note between 1 and 5),
  commentaire text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 3. Module Livraison de colis
-- ============================================================

create table livreurs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  zone_couverture text,
  capacite_max_par_jour int not null default 10,
  actif boolean not null default true
);

create table expeditions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references users(id),
  numero_suivi text not null unique,

  expediteur_nom text not null,
  expediteur_contact text not null,
  destinataire_nom text not null,
  destinataire_contact text not null,
  adresse_collecte text not null,
  adresse_livraison text not null,

  poids_kg numeric(6,2),
  dimensions text,
  nature_colis text,
  valeur_declaree numeric(12,2),

  mode text not null check (mode in ('standard', 'express', 'meme_jour', 'programmee')),
  zone text not null check (zone in ('intracommunale', 'intercommunale', 'nationale')),
  prix numeric(12,2),

  livreur_id uuid references livreurs(id),
  statut text not null default 'creee' check (statut in (
    'creee', 'prise_en_charge', 'en_transit', 'livree', 'echec_livraison'
  )),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table expedition_statut_historique (
  id uuid primary key default gen_random_uuid(),
  expedition_id uuid not null references expeditions(id) on delete cascade,
  statut text not null,
  horodatage timestamptz not null default now()
);

-- ============================================================
-- 4. Module Immobilier
-- ============================================================

create table agents_immobiliers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  zone_couverture text
);

create table biens (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('terrain', 'maison', 'appartement', 'bureau')),
  transaction text not null check (transaction in ('vente', 'location')),
  prix numeric(14,2) not null,
  nb_chambres int,
  surface_m2 numeric(8,2),
  localisation text not null,
  latitude numeric(9,6),
  longitude numeric(9,6),
  description text,

  agent_id uuid references agents_immobiliers(id),
  statut text not null default 'disponible'
    check (statut in ('disponible', 'reserve', 'loue', 'vendu', 'indisponible')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table bien_medias (
  id uuid primary key default gen_random_uuid(),
  bien_id uuid not null references biens(id) on delete cascade,
  type text not null check (type in ('photo', 'video')),
  url text not null,
  ordre int not null default 0
);

create table visites (
  id uuid primary key default gen_random_uuid(),
  bien_id uuid not null references biens(id),
  client_id uuid not null references users(id),
  agent_id uuid not null references agents_immobiliers(id),
  creneau timestamptz not null,
  statut text not null default 'proposee'
    check (statut in ('proposee', 'confirmee', 'realisee', 'annulee')),
  created_at timestamptz not null default now()
);

create table demandes_immobilier (
  id uuid primary key default gen_random_uuid(),
  bien_id uuid not null references biens(id),
  client_id uuid not null references users(id),
  agent_id uuid references agents_immobiliers(id),
  type text not null check (type in ('information', 'visite', 'offre')),
  montant_offre numeric(14,2),
  statut text not null default 'en_attente' check (statut in (
    'en_attente', 'en_cours_traitement', 'visite_programmee',
    'offre_soumise', 'acceptee', 'refusee', 'annulee', 'finalisee'
  )),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 5. Module Assistance Voyages et Études
-- ============================================================

create table dossiers_voyage (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references users(id),
  type text not null check (type in ('etudes', 'tourisme_visa')),
  pays_cible text not null,
  conseiller_id uuid references users(id),
  statut text not null default 'soumis' check (statut in (
    'soumis', 'en_cours_traitement', 'pieces_complementaires_requises', 'finalise'
  )),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table documents_dossier_voyage (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references dossiers_voyage(id) on delete cascade,
  type_document text not null,
  url text not null,
  statut text not null default 'soumis' check (statut in ('soumis', 'valide', 'rejete')),
  created_at timestamptz not null default now()
);

-- ============================================================
-- 6. Tables transverses
-- ============================================================

-- 6.1 Paiements

create table paiements (
  id uuid primary key default gen_random_uuid(),
  module text not null check (module in ('transport', 'livraison', 'immobilier', 'voyage')),
  reference_table text not null,
  reference_id uuid not null,
  type text not null check (type in ('montant', 'caution', 'acompte', 'commission')),
  montant numeric(14,2) not null,
  methode text not null check (methode in ('cinetpay', 'stripe', 'agence', 'virement')),
  statut text not null default 'en_attente'
    check (statut in ('en_attente', 'capture', 'echoue', 'rembourse')),
  webhook_reference text,
  created_at timestamptz not null default now()
);

-- 6.2 Notifications

create table notifications_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  canal text not null check (canal in ('whatsapp', 'sms', 'push', 'email')),
  evenement text not null,
  contenu text,
  statut_envoi text not null default 'envoye' check (statut_envoi in ('envoye', 'echoue', 'lu')),
  created_at timestamptz not null default now()
);

-- 6.3 Journal d'audit

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  action text not null,
  cible_table text,
  cible_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);
