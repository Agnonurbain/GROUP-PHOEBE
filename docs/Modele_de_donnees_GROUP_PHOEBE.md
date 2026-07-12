# Modèle de données — GROUP PHOEBE

## Schéma PostgreSQL / Supabase, couvrant les quatre modules du cahier des charges

> Ce document traduit le cahier des charges unifié en schéma de base de données directement exploitable (DDL PostgreSQL). Chaque bloc SQL est accompagné du raisonnement qui le sous-tend. Là où le cahier des charges laisse un point en attente de réponse de GROUP PHOEBE (§17), le champ correspondant est posé de façon volontairement flexible plutôt que figé sur une hypothèse.

## Conventions générales

- Clés primaires en `uuid`, générées par `gen_random_uuid()`.
- Toutes les tables ont `created_at timestamptz default now()` ; les tables mutables ont aussi `updated_at`.
- Les statuts sont en `text` avec contrainte `CHECK`, plutôt qu'en `ENUM` Postgres natif — un `CHECK` s'altère par une simple migration, un `ENUM` est plus rigide à faire évoluer.
- Extension requise pour empêcher nativement les chevauchements de créneaux (déjà mentionnée au chapitre 12 du cahier des charges) :

```sql
create extension if not exists btree_gist;
create extension if not exists pgcrypto;
```

## 0. Préparation multi-site

Un champ `agence_id` est posé dès maintenant sur les tables concernées, avec une seule agence par défaut — décision déjà actée au chapitre 10 du cahier des charges MVP, pour éviter une migration lourde le jour où un deuxième site ouvre.

```sql
create table agences (
  id uuid primary key default gen_random_uuid(),
  nom text not null default 'Agence principale',
  ville text,
  created_at timestamptz not null default now()
);

insert into agences (nom) values ('Agence principale');
```

## 1. Utilisateurs et rôles

Distinction volontaire entre deux familles : les personnes qui se connectent (`users`, avec un rôle) et les chauffeurs, qui n'ont pas de compte utilisateur au périmètre initial (§4.6 du cahier des charges) — seulement une fiche interne.

```sql
create table users (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('client', 'operateur', 'proprietaire', 'livreur', 'agent_immobilier')),
  nom text not null,
  telephone text not null unique,
  email text unique,
  agence_id uuid references agences(id),

  -- Vérification d'identité (§4.4 / §4.10 du cahier des charges) : s'applique aux clients,
  -- mais la colonne reste sur users pour permettre son extension future à d'autres rôles.
  statut_verification text not null default 'non_verifie'
    check (statut_verification in ('non_verifie', 'documents_soumis', 'verifie', 'rejete')),
  piece_identite_url text,
  permis_conduire_url text,
  date_naissance date,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Chauffeur : fiche interne, pas de compte (voir §4.6). Rattaché à une agence pour la même
-- raison de préparation multi-site que les véhicules.
create table chauffeurs (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  telephone text not null,
  permis_professionnel_url text,
  agence_id uuid references agences(id),
  actif boolean not null default true,
  created_at timestamptz not null default now()
);
```

🔶 `conducteurs_secondaires` est créée en §2.3, une fois `demandes_transport` définie — l'ordre du fichier suit l'ordre réel de création des tables plutôt que l'ordre logique du cahier des charges, pour rester exécutable tel quel du début à la fin.

## 2. Module Transport

### 2.1 Catalogue véhicules

```sql
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

  -- Documents requis pour une annonce de vente (§4.2 et §6 du cahier des charges)
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
```

### 2.2 Disponibilités — le point technique le plus important de tout le schéma

Les contraintes d'exclusion empêchent Postgres lui-même d'accepter deux réservations chevauchantes, sans logique applicative supplémentaire — directement lié à la règle de gestion « un véhicule ne peut pas être réservé sur une période déjà occupée » (chapitre 6 du cahier des charges).

```sql
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
```

### 2.3 Demandes (réservation directe et devis)

Une seule table couvre les deux parcours identifiés en §4.3 du cahier des charges (réservation directe et demande de devis), distingués par la colonne `type`.

```sql
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
  -- Un devis non accepté expire après 14 jours par défaut (§4.3)
  devis_expire_at timestamptz,

  etat_lieux_depart_photos text[],
  etat_lieux_retour_photos text[],

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Un conducteur secondaire est déclaré sur une demande précise, pas au niveau du compte :
-- il n'a pas besoin d'être client lui-même (§4 du cahier des charges). Placée ici, juste
-- après demandes_transport, pour respecter l'ordre réel des dépendances.
create table conducteurs_secondaires (
  id uuid primary key default gen_random_uuid(),
  demande_transport_id uuid not null references demandes_transport(id) on delete cascade,
  nom text not null,
  permis_conduire_url text not null,
  statut_verification text not null default 'documents_soumis'
    check (statut_verification in ('documents_soumis', 'verifie', 'rejete')),
  created_at timestamptz not null default now()
);

-- Contrats récurrents (scolaire, personnel d'entreprise) — §4.1 et §17 : fréquence de
-- facturation et pénalités de résiliation restent en attente de réponse de GROUP PHOEBE,
-- les colonnes existent mais restent nullable jusque-là.
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
```

## 3. Module Livraison de colis

```sql
create table livreurs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),  -- accès mobile terrain, voir §9 du cahier des charges
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
  valeur_declaree numeric(12,2),  -- utile si un plafond de compensation est défini (§17)

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

-- Traçabilité horodatée exigée par la règle de gestion §5.6 : chaque changement de statut
-- est historisé plutôt qu'écrasé.
create table expedition_statut_historique (
  id uuid primary key default gen_random_uuid(),
  expedition_id uuid not null references expeditions(id) on delete cascade,
  statut text not null,
  horodatage timestamptz not null default now()
);
```

## 4. Module Immobilier

```sql
create table agents_immobiliers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),  -- accès mobile terrain, voir §9 du cahier des charges
  zone_couverture text  -- sert de base à l'attribution automatique d'un bien, §6.3
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

-- Cycle de vie proposé en §6.4 du cahier des charges. Le paiement (dépôt de garantie,
-- commission d'agence) reste en attente de réponse de GROUP PHOEBE (§17) : la table est
-- prête à recevoir ces colonnes sans modification de structure une fois la réponse connue.
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
```

## 5. Module Assistance Voyages et Études

🔶 Ce module reste au stade « cadrage minimal » dans le cahier des charges (§7) : le schéma ci-dessous couvre la structure proposée, pas une version définitive — à revoir une fois les questions juridiques de §17 tranchées (qui porte l'expertise réglementaire).

```sql
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
```

## 6. Tables transverses

### 6.1 Paiements
Une table unique pour les quatre modules plutôt qu'une par module : les paiements se ressemblent techniquement (webhook, méthode, statut) même quand ce qu'ils financent diffère.

```sql
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
```

### 6.2 Notifications

```sql
create table notifications_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  canal text not null check (canal in ('whatsapp', 'sms', 'push', 'email')),
  evenement text not null,
  contenu text,
  statut_envoi text not null default 'envoye' check (statut_envoi in ('envoye', 'echoue', 'lu')),
  created_at timestamptz not null default now()
);
```

### 6.3 Journal d'audit
Exigé par la règle de sécurité « chaque action sensible doit être historisée » (§11 du cahier des charges), particulièrement utile une fois plusieurs rôles internes actifs.

```sql
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  action text not null,
  cible_table text,
  cible_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);
```

## Ce que ce schéma ne couvre pas encore

- **Paiement Immobilier** (§17, point 2) — les colonnes de `demandes_immobilier` sont prêtes à recevoir dépôt de garantie et commission d'agence, la logique n'est pas modélisée tant que le fonctionnement exact n'est pas connu.
- **Politique colis perdu/endommagé** (§17, point 3) — `valeur_declaree` existe sur `expeditions`, mais aucune table de compensation n'est créée tant que la politique n'est pas définie.
- **Row Level Security** — chaque table devra recevoir ses politiques RLS (qui peut lire/écrire quoi) une fois ce schéma validé ; non détaillé ici pour rester lisible, mais s'appuie directement sur la matrice de permissions du chapitre 2 du cahier des charges.
- **Index de performance** — au-delà des clés primaires/étrangères, des index spécifiques (recherche par ville, par statut) seront ajoutés une fois les patterns de requêtes réels observés, plutôt qu'anticipés à ce stade.
