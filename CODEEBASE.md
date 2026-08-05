# CODEBASE — GROUP PHOEBE

> Fichier vivant, mis à jour à chaque évolution significative du code.

---

## 1. VUE D'ENSEMBLE

**GROUP PHOEBE** : plateforme multi-services basée à Abidjan, Côte d'Ivoire.
4 verticales : **Transport** (location véhicules), **Livraison** (colis),
**Immobilier** (vente/location), **Assistance Voyages & Études** (visas, dossiers).

---

## 2. STACK TECHNIQUE

| Couche | Technologie |
|---|---|
| Framework | Next.js 16.2 (App Router, Turbopack) |
| React | 19.2 |
| Langage | TypeScript ^5 |
| CSS | Tailwind CSS v4 + shadcn/ui + tw-animate-css |
| Base de données | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/phone OTP, Google OAuth) |
| Paiements | Stripe (international) + CinetPay (Mobile Money, Wave, OM, cartes locales) |
| Monitoring | @sentry/nextjs ^10 |
| Analytics | GA4 (@next/third-parties/google) |
| Notifications | Twilio (WhatsApp + SMS) + Push + Resend (email) |
| Cartes/Géo | Mapbox + Leaflet |
| PDF | pdf-lib |
| Charts | Recharts 3.8 |
| Tables | @tanstack/react-table |
| Formulaires | @base-ui/react |
| Icônes | lucide-react |
| UI Kit | shadcn/ui (base-nova, style v4) |
| CVA | class-variance-authority |
| Package manager | pnpm ^10 |
| Monorepo | Turborepo (turbo ^2) |
| CI | GitHub Actions |
| Hébergement | Vercel |

---

## 3. STRUCTURE DU MONOREPO

```
group-phoebe/
├── apps/web/                    # Application Next.js
│   ├── src/
│   │   ├── app/                 # Routes App Router
│   │   ├── components/          # Composants React
│   │   │   ├── public/          # Site public (header, footer, etc.)
│   │   │   ├── effects/         # Animations (ScrollReveal, TiltCard, etc.)
│   │   │   ├── shadcn/          # Composants shadcn/ui
│   │   │   ├── ui/              # Composants UI custom
│   │   │   └── analytics/       # Tracking GA4
│   │   ├── lib/                 # Logique métier
│   │   │   ├── supabase/        # Clients Supabase (browser, server, admin, public)
│   │   │   ├── payments/        # CinetPay, Stripe, webhooks
│   │   │   └── notifications/   # Templates et envoi
│   │   ├── hooks/               # Custom hooks
│   │   └── types/               # Type declarations globales
│   └── e2e/                     # Tests Playwright
│
├── packages/database/           # Package partagé
│   └── src/
│       ├── client.ts            # Factory Supabase (anon + service_role)
│       ├── types.ts             # Types auto-générés (supabase gen types)
│       └── index.ts             # Exports
│
├── supabase/                    # Projet Supabase — UNIQUE source de vérité
│   ├── migrations/              # 89 migrations SQL
│   ├── tests/                   # SQL de vérification (contrainte d'exclusion)
│   ├── config.toml              # Ports de la pile locale
│   └── seed*.sql                # Jeux de données de développement
├── docs/                        # Documentation
│   ├── Cahier_des_charges_GROUP_PHOEBE.md
│   ├── Modele_de_donnees_GROUP_PHOEBE.md
│   └── Charte_graphique_officielle_GROUP_PHOEBE.pdf
│
├── assis/                       # Notes vocales WhatsApp (décisions)
├── graphify-out/                # Graphe de code (AST cache + graph.html)
├── design.md                    # Système de design verrouillé
├── design-system.dsl            # Design system (format OpenPencil)
└── ga4-ecommerce-events.js      # Events GA4 e-commerce
```

---

## 4. ROUTAGE (App Router)

### 4.1 Groupes de routes

- `(public)` — Site public, sombre par défaut, [data-vertical] pour les accents
- `(auth)` — Pages d'authentification, thème clair/sombre libre
- `(admin)` — Back-office, rôles `operateur` / `proprietaire` / `agent_immobilier`
- `terrain/` — Espace terrain, rôles `livreur` / `agent_immobilier`. Hors groupe de routes : ni en-tête marchand, ni panier, ni pied de page. Pensé pour un téléphone tenu à une main, dehors

### 4.2 Routes publiques

| Route | Page | Description |
|---|---|---|
| `/` | `page.tsx` → `page-client.tsx` | Accueil : slideshow, services, stats |
| `/transport/catalogue` | `page.tsx` + `filtres.tsx` | Catalogue véhicules avec filtres |
| `/transport/vehicule/[slug]` | `page.tsx` | Fiche véhicule, galerie, booking |
| `/transport/catalogue/groupe/[key]/choix` | `page.tsx` | Choix variantes d'un groupe |
| `/livraison` | `page.tsx` | Page service livraison |
| `/livraison/commander` | `page.tsx` + `commander-client.tsx` | Formulaire commande colis |
| `/livraison/confirmation` | `page.tsx` | Confirmation livraison |
| `/immobilier` | `page.tsx` | Catalogue biens immobiliers |
| `/immobilier/[id]` | `page.tsx` | Fiche bien immobilier |
| `/immobilier/confirmation` | `page.tsx` | Confirmation immo |
| `/assistance` | `page.tsx` | Page service assistance voyages |
| `/assistance/pays/[slug]` | `page.tsx` | Détail pays cible |
| `/assistance/confirmation` | `page.tsx` | Confirmation assistance |
| `/panier` | `page.tsx` + `page-client.tsx` | Panier d'achat |
| `/panier/paiement` | `page.tsx` + `page-client.tsx` | Paiement |
| `/reservation/confirmation` | `page.tsx` + `confirmation-client.tsx` | Confirmation réservation |
| `/reservation/echec` | `page.tsx` | Échec réservation |
| `/compte/profil` | `page.tsx` | Profil utilisateur |
| `/compte/favoris` | `page.tsx` | Favoris |
| `/compte/verification` | `page.tsx` | Vérification identité |
| `/compte/reservations` | `page.tsx` | Historique réservations |
| `/avis` | `page.tsx` + `page-client.tsx` | Avis clients publiés |
| `/blog` | `page.tsx` + `page-client.tsx` | Blog / Guides |
| `/blog/[slug]` | `page.tsx` | Article blog |
| `/contact` | `page.tsx` | Contact |
| `/legal/[slug]` | Mentions légales, CGV, politique de confidentialité. **Textes d'exemple** : les passages `[À COMPLÉTER]` attendent des données que seule l'entreprise détient, et la page est `noindex` tant qu'il en reste |
| `/suivi` | `page.tsx` | Suivi expédition |
| `/offline` | `page.tsx` | Page hors-ligne |
| `/design-system` | `page.tsx` | Galerie des composants (hors groupe de routes) |

### 4.2b Espace terrain

| Route | Description |
|---|---|
| `/terrain/livreur` | Courses du livreur : colis affectés, avancement du statut, preuve de remise, signalement d'échec |

### 4.3 Routes authentification

| Route | Description |
|---|---|
| `/connexion` | Connexion (email/téléphone + Google OAuth) |
| `/inscription` | Inscription |
| `/verifier-otp` | Vérification OTP |
| `/mot-de-passe-oublie` | Mot de passe oublié |
| `/nouveau-mot-de-passe` | Nouveau mot de passe |
| `/callback` | Callback OAuth Google |

### 4.4 Routes back-office

| Route | Description |
|---|---|
| `/admin` | Dashboard (KPI, graphiques CA/activité, alertes, top véhicules, tables) |
| `/admin/demandes` | Gestion demandes transport |
| `/admin/demandes/[id]/etat-lieux` | État des lieux |
| `/admin/vehicules` | Catalogue véhicules |
| `/admin/vehicules/nouveau` | Ajout véhicule |
| `/admin/vehicules/[id]` | Édition véhicule |
| `/admin/vehicules/[id]/disponibilites` | Planning disponibilités |
| `/admin/biens` | Gestion biens immobiliers |
| `/admin/biens/nouveau` | Ajout bien |
| `/admin/biens/[id]` | Édition bien |
| `/admin/expeditions` | Gestion expéditions |
| `/admin/pages-legales` | Pages légales et régime d'indemnisation — propriétaire seul. Une page ne se publie pas tant qu'elle contient un `[À COMPLÉTER]` |
| `/admin/contrats` | Abonnements — propriétaire seul : créneau desservi, facturation, échéances, suspension/résiliation |
| `/admin/chauffeurs` | Chauffeurs — staff : création, téléphone, activation, véhicules rattachés et courses en cours. Alerte sur les véhicules qui vendent l'option « avec chauffeur » sans chauffeur actif rattaché |
| `/admin/livreurs` | Livreurs — propriétaire seul : communes desservies, capacité quotidienne, charge en cours, activation |
| `/admin/demandes-immobilier` | Demandes immobilières (statuts, visites, agent, contre-offre) |
| `/admin/transactions-immobilier` | Registre : qui a loué / acheté quel bien, à quel prix et quand (cumul des sommes réservé au propriétaire) |
| `/admin/parametres-immobilier` | Paramétrage immobilier — propriétaire uniquement (frais de visite, remise max, quota d'offres) |
| `/admin/dossiers-voyage` | Dossiers voyage/études |
| `/admin/billets` | Demandes de billet d'avion : recherche, devis (propriétaire), émission |
| `/admin/propositions` | Propositions de prix |
| `/admin/comptes` | Comptes internes — propriétaire seul : opérateur, livreur, agent immobilier (avec sa zone de couverture) |
| `/admin/verifications` | Vérifications documents |
| `/admin/verifications/historique` | Historique vérifications |
| `/admin/tarifs` | Tarifs et zones — onglets Coefficients, Cartographie, Prix & Communes, Livraison, Assistance, **Billets d'avion**, Contact |
| `/admin/planning` | Planning |
| `/admin/audit` | Journal d'audit |
| `/admin/avis` | Modération des avis clients |
| `/admin/avis/[id]` | Modération d'un avis |
| `/admin/blog` | Liste des articles blog/guides |
| `/admin/blog/nouveau` | Nouvel article |
| `/admin/blog/[id]` | Édition article |
| `/admin/blog/categories` | Gestion catégories articles |
| `/admin/factures` | Facturation — propriétaire seul : TVA, préfixe de numérotation, registre des factures émises |
| `/admin/remboursements` | Gestion remboursements |
| `/admin/reserver-pour-client` | Réservation par opérateur |

### 4.5 API Routes

| Route | Méthode | Description |
|---|---|---|
| `/api/webhooks/stripe` | POST | Webhook Stripe |
| `/api/webhooks/cinetpay` | POST | Webhook CinetPay |
| `/api/health` | GET | Healthcheck |
| `/api/contrat-pdf` | GET | Génération PDF contrat |
| `/api/etat-lieux-pdf` | GET | Génération PDF état des lieux |
| `/api/push-subscribe` | POST | Souscription push notifications |
| `/api/cron/expiration` | GET | Expiration demande (cron) |
| `/api/cron/expirer-demandes-sans-reponse` | GET | Expiration propositions sans réponse (cron) |
| `/api/cron/expirer-negociations` | GET | Expiration négociations (cron) |
| `/api/cron/expirer-non-presentations` | GET | Expiration non-présentations (cron) |
| `/api/cron/expirer-demandes-immobilier` | GET | Expiration demandes et contre-offres immobilières à 7 j (cron) |
| `/api/test-login` | GET | Login de test (dev) |

Toutes les routes `cron/*` exigent l'en-tête `Authorization: Bearer $CRON_SECRET`.

---

## 5. SCHÉMA DE BASE DE DONNÉES

89 migrations Supabase (00001 → 00089), toutes dans `supabase/migrations/`.

### 5.1 Tables

La liste ci-dessous est celle des `Tables` de `packages/database/src/types.ts`,
généré depuis la base distante (`pnpm -F @group-phoebe/database generate-types`) —
c'est la référence en cas de doute.

| Table | Module | Description |
|---|---|---|
| `agences` | Transverse | Multi-site |
| `users` | Auth | 5 rôles, vérification identité |
| `chauffeurs` | Transport | Ressource, pas un compte : géré depuis `/admin/chauffeurs` comme un véhicule. `telephone` unique — deux identifiants pour une même personne rendraient l'exclusion GiST de `disponibilites_chauffeur` inopérante. `actif` filtre l'affectation automatique |
| `vehicules` | Transport | Catalogue avec prix, statut |
| `vehicule_photos` | Transport | Photos par véhicule |
| `vehicule_chauffeurs` | Transport | Affectation chauffeur ↔ véhicule |
| `disponibilites_vehicule` | Transport | Planning avec exclusion GiST, colonne `periode` (`tstzrange`) |
| `disponibilites_chauffeur` | Transport | Planning chauffeurs, colonne `periode` (`tstzrange`) |
| `demandes_transport` | Transport | Réservations + devis, cycle de vie complet. Porte la négociation (`prix_negocie`, `negociation_note`, statut `en_negociation`) |
| `lignes_demande` | Transport | Lignes de demande (multi-véhicules) |
| `conducteurs_secondaires` | Transport | Vérifiés depuis `/admin/demandes` : nom, permis (bucket privé, URL signée au clic) et décision `verifie`/`rejete` |
| `contrats_recurrents` | Transport | Abonnements scolaire / chauffeur personnel. Le contrat porte un **créneau** (`jours_semaine`, `heure_debut`, `heure_fin`) confronté à la demande, et non une réservation posée : sinon neuf mois d'école immobiliseraient le véhicule en bloc |
| `echeances_contrat` | Transport | Échéances de facturation d'un abonnement. L'unicité `(contrat_id, periode_debut)` rend la génération par cron rejouable sans double facturation |
| `propositions_prix` | Transport | Propositions de prix (opérateur → propriétaire) |
| `intervalles_prix` | Transport | Grille de prix par intervalle |
| `langues` | Transverse | Langues disponibles (fr, en), i18n infrastructure |
| `zones_tarifaires` | Transport | Zones et km inclus par jour |
| `propositions_tarifs` | Transport | Propositions de modification tarifaire |
| `livreurs` | Livraison | Livreurs. `zone_couverture` = **communes desservies séparées par des virgules**, comparées à `expeditions.commune_collecte` ; vide = dessert tout. À ne pas confondre avec `agents_immobiliers.zone_couverture` (sous-chaîne de localisation) ni avec `expeditions.zone` (classe de trajet). `charge_max_simultanee` borne l'affectation automatique : ce n'est **pas** un quota journalier, un colis clôturé libère aussitôt sa place. Les deux sont pilotables depuis `/admin/livreurs` |
| `expeditions` | Livraison | Colis avec suivi. `commune_collecte` / `commune_livraison` (l'affectation automatique en dépend), `date_souhaitee` (exigée pour le mode `programmee`, interdite ailleurs). Preuve de remise : `preuve_chemin` (bucket **privé** `livraison-preuves`, URL signée à la demande), `preuve_latitude`/`longitude`, `recu_par`, `livree_at`, `echec_motif`. Paiement à la livraison : `paiement_encaisse_at` / `paiement_encaisse_par`. `valeur_declaree` est **indicative** — aucune indemnisation ne s'y rattache |
| `expedition_statut_historique` | Livraison | Timeline statuts |
| `communes` | Livraison | Communes rattachées à une zone |
| `propositions_zones_tarifaires` | Livraison | Propositions de modification de zone |
| `tarifs_livraison` | Livraison | Grille zone × mode, pilotable |
| `paliers_poids` | Livraison | Paliers de poids. **Plus utilisés dans le prix** depuis 00084 : conservés le temps de la reprise d'historique |
| `moyens_livraison` | Livraison | Moto, tricycle, camionnette, camion… `famille` est un **champ libre** : l'exploitant ajoute un moyen sans déploiement. `charge_max_kg` borne ce qu'on accepte, `actif` le retire du choix sans l'effacer |
| `tarifs_livraison_moyen` | Livraison | Grille **zone × moyen**, pilotable. Remplace le couple zone × poids : c'est le véhicule mobilisé qui fait le coût, pas la masse |
| `coefficients_mode_livraison` | Livraison | Coefficient par mode (standard, express, programmée), pilotable. Prix = tarif(zone × moyen) × coefficient(mode) |
| `parametres_livraison` | Livraison | Singleton : paramètres du module |
| `parametres_transport` | Transport | Singleton : paramètres du module. Les heures d'ouverture l'ont **quitté** en 00083 — elles valent pour toute la maison |
| `categories_article` | Contenu | Catégories du blog (slug, nom, ordre) |
| `biens` | Immobilier | Types, transactions, géolocalisation |
| `bien_medias` | Immobilier | Photos/vidéos |
| `agents_immobiliers` | Immobilier | Agents et `zone_couverture`. La zone pilote `autoAssignAgent()` : **correspondance par sous-chaîne**, premier agent trouvé, sans ordre défini — deux zones qui matchent un même bien rendent l'affectation arbitraire (cf. TEST_ACCOUNTS.md) |
| `visites` | Immobilier | Visites programmées (proposée → confirmée → réalisée) |
| `demandes_immobilier` | Immobilier | Demandes info/visite/offre. Négociation (`montant_offre`, `montant_contre_offre`), prix arrêté (`montant_convenu`) et part GROUP PHOEBE (`taux_commission`, `montant_commission`) — ces quatre montants sont **figés dès l'acceptation**. Plus `message` et `date_souhaitee` du client, `location_debut` / `location_duree_mois` pour une location, `agent_id` hérité du bien. Chaque ligne acceptée est une entrée du registre des transactions |
| `parametres_immobilier` | Immobilier | Singleton : frais de visite, remise max, quota d'offres, **taux de commission** |
| `dossiers_voyage` | Assistance | Dossiers études/visa |
| `demandes_billet` | Assistance | Demandes de billet d'avion : trajet, dates, ventilation des voyageurs, passeport, devis (`montant_propose`) et frais de service figés (`frais_service`). Documents : certificat fièvre jaune (`certificat_fievre_jaune` + vérif admin), autorisation parentale mineurs (`mineur_autorisation_parentale` + vérif admin). Devis valable jusqu'à (`devis_valable_jusqu_a`). Statuts : soumise → en_cours_traitement → devis_envoye → **payee** → emise |
| `parametres_billet` | Assistance | Singleton : frais de service, validité de passeport exigée, plafond de voyageurs, délai de réponse annoncé, **validité du devis** (heures) |
| `passagers_billet` | Assistance | Passagers d'une demande de billet : nom, date naissance, passeport — collectés au paiement pour l'émission |
| `documents_dossier_voyage` | Assistance | Pièces d'un dossier : `url` porte un **chemin** dans le bucket privé `dossiers-documents`, jamais une URL. Unicité `(dossier_id, type_document)` — redéposer une pièce rejetée la remplace |
| `tarifs_assistance` | Assistance | Tarifs pilotables |
| `messages_dossier` | Assistance | Fil de discussion sur un dossier : le client écrit à l'équipe, l'équipe répond. Sans lui, une question sur un dossier n'avait pas d'endroit où aller |
| `rendez_vous_dossier` | Assistance | Rendez-vous pris sur un créneau, à partir des jours ouvrés |
| `parametres_rendez_vous` | Assistance | Singleton : durée du créneau, préavis, horizon de réservation |
| `types_pagne` | Textile | Uniwax (Print, Block, Tabs) et hollandais. `marque` est un champ libre. **Aucune colonne de prix**, délibérément (00087) |
| `articles_pagne` | Textile | Le catalogue photo : nom, référence fabricant, couleurs en toutes lettres, photos (bucket **public** `catalogue-pagnes`). **Aucun prix** non plus. `disponible` retire un article de la vitrine sans l'effacer — des demandes passées le désignent |
| `demandes_textile` | Textile | Demandes de devis. `article_id` est **nullable**, et c'est le point : le client désigne un modèle du catalogue **ou** décrit ce qu'il cherche. `montant_propose` réservé au propriétaire (action + trigger) |
| `paiements` | Transverse | Multi-module, multi-méthode (`stripe` \| `cinetpay` \| `a_la_livraison` \| `agence` \| `virement`), remboursements. Types : `montant`, `caution`, `acompte`, `commission`, `frais` — `frais` porte les frais de visite immobiliers, non remboursables |
| `webhook_idempotency` | Transverse | Anti-rejeu des webhooks de paiement |
| `notifications_log` | Transverse | Log multi-canal |
| `push_subscriptions` | Transverse | Subscriptions push |
| `articles` | Contenu | Articles du blog / guides, avec SEO metadata, catégorie, publication |
| `audit_log` | Transverse | Journalisation (`action`, `cible_table`, `cible_id`, `details`) |
| `avis` | Transverse | Avis clients cross-vertical (polymorphique : `reference_table` + `reference_id`), modération avant publication |
| `factures` | Transverse | Factures PDF générées automatiquement après paiement. Le bucket `factures` est **privé** : `pdf_chemin` porte le chemin de l'objet, jamais une URL — elle est signée à la demande, après contrôle du demandeur |
| `favoris` | Transverse | Favoris utilisateur — une ligne cible un véhicule **ou** un bien (contrainte `favoris_une_seule_cible`, 00052) |
| `paniers` | Transverse | Panier serveur |
| `parametres_avis` | Transverse | Singleton : modération obligatoire, délai après terme |
| `parametres_contact` | Transverse | Coordonnées (WhatsApp, tel, email, réseau) |
| `parametres_facturation` | Transverse | Singleton : TVA, numérotation factures, préfixe |
| `parametres_ouverture` | Transverse | Singleton : jours ouvrés et heures d'ouverture de **toute la maison**. Vivait dans `parametres_transport` jusqu'en 00083, où ces heures servaient déjà à l'assistance |
| `fermetures_agence` | Transverse | Jours fermés à la date près (fêtes, congés), en plus des jours ouvrés hebdomadaires |
| `pages_legales` | Transverse | CGU, mentions légales, confidentialité — éditables sans déploiement |

### 5.2 RLS et sécurité

- RLS activée sur les 62 tables. Ce n'était pas le cas avant la migration 00048 :
  10 tables en étaient dépourvues tout en portant `GRANT ALL TO anon`, donc
  lisibles et modifiables par quiconque détenait la clé anon (`visites`,
  `agents_immobiliers`, `audit_log`, `notifications_log`, `chauffeurs`,
  `livreurs`, `agences`, `conducteurs_secondaires`, `contrats_recurrents`,
  `webhook_idempotency`). **Vérifier l'état réel avec `supabase db dump`, pas le
  SQL versionné : les deux avaient divergé.**
- `webhook_idempotency` a la RLS activée et **aucune** policy : c'est voulu,
  seule la clé de service doit toucher l'anti-rejeu.
- `audit_log` n'a qu'une policy de lecture staff. Aucune policy d'écriture :
  la piste n'est donc pas altérable depuis l'API REST.
- Politiques par rôle (`client`, `operateur`, `proprietaire`, etc.)
- Helpers `security definer` pour éviter la récursion des policies qui
  interrogent `public.users` : `is_staff()`, `is_proprietaire()`, `own_role()`,
  `own_statut_verification()`
- Trigger `handle_new_user()` pour création auto profil + assignation rôle
- Trigger `lock_role_on_insert()` pour sécuriser le rôle
- Trigger `garde_montants` sur `demandes_immobilier` : refuse l'écriture d'un
  montant par un non-propriétaire. Ne s'applique qu'aux rôles `anon` et
  `authenticated`, c'est-à-dire l'appel REST direct avec la clé publique — les
  server actions écrivent en `service_role` et sont gardées côté application.
  Volontairement en `security invoker` : en `security definer`, `current_user`
  vaudrait le propriétaire de la fonction et la garde bloquerait tous les chemins.
- Politiques storage pour uploads photos/documents
- Webhooks sécurisés avec signature HMAC + table d'idempotence
- Rate limiting sur certaines routes API

**Garde « prix = propriétaire seul »** — aucune écriture de montant facturé par
un opérateur. Elle est double : `requireProprietaireAvecId()` dans les server
actions (verrouillé par `__tests__/prix-proprietaire.test.ts`, qui lit le source
et casse si une garde est relâchée), et un trigger en base pour le chemin REST.
Une garde purement applicative serait contournable : les policies `*_staff_manage`
sont `for all using (is_staff())` et la clé anon est publique par nature.

Champs couverts, et par quoi :

| Champ | Garde applicative | Trigger base |
|---|---|---|
| `vehicules.prix_*`, `taux_caution`, `caution_base_fcfa` | `retirerChampsPrix` (vehicules.ts) | — |
| `tarifs_livraison`, `paliers_poids`, `tarifs_assistance`, `parametres_contact` | `requireProprietaireAvecId` (tarifs.ts) | — |
| `parametres_immobilier.frais_visite` | `requireProprietaireAvecId` (immobilier.ts) | policy `is_proprietaire()` |
| `demandes_immobilier.montant_offre`, `montant_contre_offre`, `montant_convenu`, `montant_commission` | `proposerContreOffre` | `garde_montants` (00047, gel en 00053, commission en 00054) |
| `demandes_billet.montant_propose`, `frais_service` | `proposerDevisBillet` | `garde_montant` (00055, frais en 00056) |
| `parametres_billet.frais_service` | `modifierParametresBillet` | policy `is_proprietaire()` |
| `parametres_facturation.taux_tva`, `prefixe_facture` | `modifierParametresFacturation` | policy `is_staff()` |
| `biens.prix` | `retirerChampsPrix` + création propriétaire (biens.ts) | `garde_prix` (00049) |

Créer un bien est réservé au propriétaire : `biens.prix` est NOT NULL, il n'y a
pas de création « sans montant » comme pour un véhicule. Un opérateur édite tout
le reste, prix en lecture seule dans le formulaire.

---

## 6. COMPOSANTS CLÉS

### 6.1 Composants publics (`components/public/`)

`section-head.tsx` : `PageHero` accepte désormais un prop `bgImage` pour afficher une image de fond en plein écran avec animation Ken Burns (zoom lent 20s) et voile sombre dégradé. Utilisé sur les 4 services (Transport, Livraison, Immobilier, Assistance).

| Composant | Rôle |
|---|---|
| `section-head.tsx` (PageHero) | Hero de page service avec option `bgImage` (zoom Ken Burns), eyebrow, titre, lede, actions, aside logo |
| `smart-header.tsx` | Header adaptatif (logo par verticale, menu mobile, auth, thème) |
| `footer.tsx` | Footer avec colonnes services/contact/legal |
| `section-head.tsx` | En-tête de section (eyebrow + h2 + lede) |
| `vehicle-booking.tsx` | Réservation véhicule (dates, options, panier) |
| `vehicle-purchase.tsx` | Achat véhicule |
| `vehicle-gallery.tsx` | Galerie photos véhicule |
| `contact-form.tsx` | Formulaire de contact |
| `bien-interaction-form.tsx` | Interaction bien immobilier |
| `payer-acompte.tsx` | Paiement acompte |
| `contre-offre-reponse.tsx` | Réponse du client à une contre-offre (accepter / refuser, refus confirmé) |
| `billet-form.tsx` | Demande de billet d'avion : trajet, dates, voyageurs par tranche d'âge, classe, passeport |
| `garantie-documents.tsx` | Garantie documentaire affichée sur chaque bien : pièces en règle, présentables devant notaire à la finalisation. Variantes bloc (fiche) et ligne (carte catalogue) |
| `locale-switcher.tsx` | Sélecteur de langue (fr/en) avec drapeaux, i18n |
| `deposer-avis.tsx` | Dépôt d'un avis (note, titre, commentaire) sur une prestation terminée, tous modules |
| `preuve-livraison.tsx` | Preuve de remise : « Reçu par X le Y », URL signée demandée au clic |
| `demander-prix.tsx` | Demande de prix sur une location. Deux entrées, même chemin serveur : un véhicule depuis sa fiche, un lot depuis le panier |
| `telecharger-facture.tsx` | Téléchargement d'une facture : l'URL signée est demandée **au clic**, pas au rendu — signée à l'affichage, elle expirerait avant que le client ne clique |
| `back-link.tsx` | Lien retour |

### 6.2 Composants effets (`components/effects/`)

| Composant | Rôle |
|---|---|
| `scroll-reveal.tsx` | Révélation au scroll (fade-up) |
| `stagger-container.tsx` | Conteneur pour animations staggered (inclus dans scroll-reveal) |
| `tilt-card.tsx` | Effet tilt + éclat au survol (max 4°) |
| `animated-counter.tsx` | Compteur animé |
| `hero-slideshow.tsx` | Slideshow plein écran accueil (Ken Burns) |
| `gold-trail.tsx` | Trainée dorée au curseur |
| `sparkle-hero.tsx` | Particles étincelles hero |
| `parallax-image.tsx` | Image parallax |
| `service-cards.tsx` | Cartes services animées |

### 6.3 Composants UI (`components/ui/` et `components/shadcn/`)

| Package | Composants |
|---|---|
| `ui/` (shadcn) | Button (brand variants: default/gold, orange, green, blue, outline-white, admin*), Input, Badge (variants: default/gold, orange, green, blue, outline, admin*), Card (+Header, Content, Footer, Title, Description), Select, Chip, Dialog, HoverCard, Command, Textarea, InputGroup |
| `ui/` (shadcn addons) | Pagination (+Content, Item, Link, Previous, Next, Ellipsis) |
| `shadcn/` | Sidebar, Table, Tabs, Chart, Avatar, Skeleton, Tooltip, Breadcrumb, Separator, Label, Sheet, DropdownMenu |

Les composants `ui/` sont basés sur **shadcn/ui** (base-nova) avec `@base-ui/react` primitives, étendus avec les variants de marque GROUP PHOEBE (accent-gold, accent-orange, accent-green, accent-blue). Ces variants sont définis via `class-variance-authority` (CVA) et utilisent les jetons CSS du thème public (`--color-public-*`, `--color-accent-*`).

### 6.4 Composants divers

| Composant | Rôle |
|---|---|
| `cart-context.tsx` | Contexte panier (localStorage + sync serveur) |
| `panier-stepper.tsx` | Stepper processus achat |
| `whatsapp-float.tsx` | Bouton WhatsApp flottant |
| `theme-provider.tsx` | Provider next-themes |
| `theme-toggle.tsx` | Bascule thème clair/sombre |
| `notifications-dropdown.tsx` | Dropdown notifications admin |
| `offline-banner.tsx` | Bannière hors-ligne |
| `push-notification-setup.tsx` | Setup push notifications |
| `gps-capture.tsx` | Capture GPS mobile |
| `photo-lightbox.tsx` | Lightbox photos |
| `disponibilite-checker.tsx` | Vérificateur disponibilité |
| `favori-button.tsx` | Bouton favori (cœur) |
| `commune-search.tsx` | Recherche communes |

---

## 7. LOGIQUE MÉTIER (`lib/`)

### 7.1 Supabase

| Fichier | Client | Usage |
|---|---|---|
| `supabase/client.ts` | createBrowserClient (anon) | Côté navigateur |
| `supabase/server.ts` | createServerClient (anon) | Server Components, Server Actions |
| `supabase/admin.ts` | createClient (service_role) | Opérations admin (webhooks, cron) |
| `supabase/public.ts` | createClient (anon, stateless) | Cache public, pages non-auth |

### 7.2 Paiements

| Fichier | Description |
|---|---|
| `payments/cinetpay.ts` | API CinetPay (paiement, statut, vérification) |
| `payments/stripe.ts` | API Stripe (PaymentIntent, webhook) |
| `payments/traitement.ts` | Logique commune traitement paiement |
| `payments/webhook-utils.ts` | Utilitaires webhook (signature, parsing) |
| `payments/expiration.ts` | Gestion expiration paiements |
| `payments/expiration-demandes.ts` | Expiration demandes impayées |
| `payments/expiration-immobilier.ts` | Expiration demandes et contre-offres immobilières (7 j) |

### 7.3 Notifications

| Fichier | Description |
|---|---|
| `notifications/index.ts` | Envoi multi-canal (WhatsApp, SMS, push, email) |
| `notifications/templates.ts` | Templates de messages |

### 7.4 Services

| Fichier | Description |
|---|---|
| `auth.ts` | Fonctions auth (vérification téléphone, OTP) |
| `pricing.ts` | Calcul tarifs (location, livraison, assistance) |
| `livraison.ts` | Logique livraison (tarifs zones, communes) |
| `billets.ts` | Billets d'avion : types de trajet, classes, statuts, `validerDemandeBillet` (dates, voyageurs, validité du passeport) |
| `immobilier.ts` | Logique immobilière : libellés, statuts, validation de contre-offre (`plancherContreOffre`, `validerContreOffre`) |
| `assistance.ts` | Logique assistance voyage |
| `avis.ts` | Utilitaires avis : cache public, libellés statuts, helpers |
| `contact.ts` | Fonctions contact |
| `facture-pdf.ts` | Génération PDF facture avec pdf-lib + upload Storage |
| `langues.ts` | Infrastructure i18n : langues disponibles, détection, cookie |
| `langue-context.tsx` | Contexte React LangueProvider, hook useLangue |
| `analytics.ts` | Tracking GA4 (page_view, add_to_cart, purchase, etc.) |
| `telephone.ts` | Formatage téléphone (Côte d'Ivoire) |
| `periode.ts` | Parsing des ranges Postgres `tstzrange` (colonnes `periode`, typées `unknown` par `supabase gen types`) |
| `cache.ts` | Cache simple in-memory |
| `public-cache.ts` | Cache public avec revalidation |
| `tarifs-cache.ts` | Cache tarifs |
| `rate-limit.ts` | Rate limiting |
| `json-ld.ts` | Génération JSON-LD structured data |
| `upload-validation.ts` | Validation fichiers upload |
| `compress-image.ts` | Compression images (compressorjs) |
| `audit.ts` | Écriture dans `audit_log` (action, cible, valeurs avant/après, IP) |
| `storage.ts` | Upload et URLs Supabase Storage |
| `constants.ts` | Délais et seuils métier (expiration, non-présentation, négociation) |
| `fetch-with-timeout.ts` | `fetch` avec `AbortSignal.timeout` |
| `vehicle-group.ts` | Regroupement des véhicules par modèle pour le catalogue |
| `utils.ts` | `cn()` (clsx + tailwind-merge) |

### 7.5 Cycle immobilier

Le module ayant le cycle le plus long, voici qui écrit quoi. Reconstituer cette
table depuis le code coûte cher — elle est la référence.

| Statut de la demande | Posé par | Effets |
|---|---|---|
| `en_attente` | `creerDemandeImmobilier` (info, visite) | Agent hérité du bien, staff notifié |
| `offre_soumise` | `creerDemandeImmobilier` (offre) | Compte dans le quota `max_offres_client` |
| `en_cours_traitement` | webhook de paiement, frais de visite encaissés | Le bien sort du catalogue |
| `visite_programmee` | `creerVisite` | Visite créée, **client notifié du créneau** |
| `contre_offre` | `proposerContreOffre` — **propriétaire seul** | Client notifié ; borné par `taux_max_reduction` |
| `acceptee` | `repondreContreOffre` (client) ou sélecteur admin | Bien réservé, **montants figés**, commission calculée, **offres concurrentes refusées et notifiées** |
| `refusee` | cron 7 j, refus client, ou acceptation d'un concurrent | Bien libéré s'il était réservé |
| `finalisee` | sélecteur admin, ou visite passée à « réalisée » | Bien `vendu` / `loue` |
| `annulee` | paiement échoué, visite annulée | Bien libéré s'il était réservé |

Trois règles qui ne se devinent pas :

1. **Le catalogue masque un bien** tant qu'une visite y est engagée — mais seulement
   sur des frais **encaissés**, et seulement tant que le créneau est à venir
   (`GRACE_APRES_CRENEAU_MS`). Les deux bornes viennent de deux défauts réels :
   sans la première, un tunnel de paiement abandonné suffisait à vider la vitrine ;
   sans la seconde, un agent oubliant de clôturer masquait le bien définitivement.
2. **Le cron d'expiration à 7 j** couvre tous les statuts d'attente
   (`en_attente`, `offre_soumise`, `en_cours_traitement`, `contre_offre`) mais **pas**
   `visite_programmee`, dont l'échéance se juge sur le créneau. Ajouter un statut
   d'attente sans l'ajouter au cron laisse la demande en suspens : le cas est
   verrouillé par `immobilier-flux.test.ts`.
3. **Pour une location**, `montant_convenu` est le **loyer mensuel**, et la période
   vit dans `location_debut` / `location_duree_mois`.

### 7.6 Cycle d'un billet d'avion

Il n'y a **aucune connexion GDS** : rien n'est cherché en direct. Le client décrit
son besoin, l'équipe cherche puis chiffre. L'interface le dit — « Demander mon
billet », pas « Rechercher » — et le vocabulaire du code suit : `demandes_billet`,
jamais « réservations ».

| Statut | Posé par | Effets |
|---|---|---|
| `soumise` | `creerDemandeBillet` | Frais de service figés au barème du jour, staff notifié |
| `en_cours_traitement` | sélecteur admin | L'équipe cherche le vol |
| `devis_envoye` | `proposerDevisBillet` — **propriétaire seul** | `montant_propose` écrit, client notifié du total (vol + frais) |
| `emise` | sélecteur admin | Billet émis, demande close |
| `annulee` | sélecteur admin | Demande close |

Deux règles portées par la validation applicative, pas par la base :

1. **La validité du passeport se juge après la date de départ**, pas à la date de
   la demande — le nombre de mois exigé est piloté depuis `/admin/tarifs`.
   L'admin signale en rouge une validité insuffisante avant l'émission.
2. **Un bébé ne voyage pas sans adulte** pour le porter : pas plus de bébés que
   d'adultes.

Et deux règles portées par la base : un aller simple n'a pas de date de retour,
un aller-retour en a une postérieure au départ.

### 7.7 Server Actions (`app/actions/`)

30 fichiers : `auth.ts`, `avis.ts`, `blog.ts`, `cart.ts`, `vehicules.ts`, `reservation.ts`,
`livraison.ts`, `immobilier.ts`, `assistance.ts`, `biens.ts`, `demandes.ts`,
`disponibilites.ts`, `propositions.ts`, `factures.ts`, `favoris.ts`, `contact.ts`,
`admin.ts`, `verification.ts`, `etat-lieux.ts`, `achat.ts`, `checkout.ts`, `tarifs.ts`,
`negociation.ts`, `propositions-zones.ts`, `vehicle-assignment.ts`, `remboursements.ts`,
`notifications-admin.ts`, `reservation-operateur.ts`, `billets.ts`, `langues.ts`.

---

## 8. DESIGN SYSTEM

Verrouillé dans `design.md` — **toute refonte de page le lit avant d'écrire du code**.

### 8.1 Principes

- Genre : **Éditorial premium**, sombre + or, typographie affirmée
- Le contenu porte la page, la décoration ne la sauve pas
- Thème clair disponible via sélecteur (variante additive, pas de flicker)

### 8.2 Palette (sombre)

| Rôle | Token | Valeur |
|---|---|---|
| Fond | `public-bg` | `#141312` |
| Carte | `public-bg-card` | `#1C1A18` |
| Surélevé | `public-bg-elevated` | `#262320` |
| Bordure | `public-border` | `#423C35` |
| Texte | `public-text` | `#EDE9E3` |
| Texte atténué | `public-text-muted` | `#A79F95` |
| Texte faible | `public-text-faint` | `#8A8279` |
| Accent or | `accent-gold` | `#C9A84C` |

### 8.3 Accents par verticale (`[data-vertical]`)

| Verticale | Couleur | CSS |
|---|---|---|
| Accueil / Livraison | Or | `#C9A84C` |
| Transport | Orange | `#F97316` |
| Immobilier | Vert | `#059669` |
| Assistance | Bleu | `#2563EB` |

### 8.4 Typographie

- **Display** : Fraunces (serif), weight 500, `tracking-tight`. Réservé h1/h2 + montants.
- **Corps** : Inter (sans-serif), 400/600.
- Pairing obligatoire : toute page service a `font-display` sur ses titres.
- Échelle : h1 = `text-5xl` → `md:text-7xl`, h2 = `text-4xl` → `md:text-5xl`.

### 8.5 Rythme des sections

```
eyebrow (uppercase, tracking-[0.25em], accent, filet 2rem)
h2 font-display
lede (max-w-xl, ink-2)
```

### 8.6 Motion

- Révélation : `ScrollReveal` (fade-up, 0.7s, cubic-bezier personnalisé)
- Séries : `StaggerContainer` (100ms)
- Survol : `TiltCard` (max 4°, halo or, désactivé au tactile)
- Interdits : bounce, élastique, glow-pulse sur logo hero
- `prefers-reduced-motion` respecté

### 8.7 CTA

- Primaire : fond accent, `btn-premium`, texte `#0A0A0A` ou blanc, libellé = verbe + objet
- Secondaire : contour
- Tertiaire : lien accent avec `→`
- **Un seul CTA primaire visible par écran**
- Budget accent : ≤ 5% du viewport

### 8.8 Interdits (anti-slop)

1. Hero centré pleine hauteur (sauf accueil — imposé par le slideshow)
2. Deux sections consécutives avec le même traitement de carte
3. Tuile-icône au-dessus du titre
4. Tout centrer
5. Bande CTA générique centrée
6. Logo de hero centré qui pulse
7. Nombre codé dans un titre
8. LCP en lazy
9. Noir/blanc purs

---

## 9. ENVIRONNEMENT ET CONFIGURATION

### 9.1 Variables d'environnement

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Site
NEXT_PUBLIC_SITE_URL=

# Paiements
CINETPAY_API_KEY=
CINETPAY_SITE_ID=
CINETPAY_SECRET_KEY=
CINETPAY_WEBHOOK_SECRET=
STRIPE_PUBLIC_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Notifications
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
TWILIO_WHATSAPP_NUMBER=
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# Géolocalisation
NEXT_PUBLIC_MAPBOX_TOKEN=

# Monitoring
SENTRY_DSN=
SENTRY_AUTH_TOKEN=
SENTRY_ORG=
SENTRY_PROJECT=

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=
```

### 9.2 Scripts principaux

```json
{
  "dev": "next dev --turbopack",
  "build": "next build",
  "lint": "eslint",
  "type-check": "tsc --noEmit",
  "test": "vitest run",
  "e2e": "playwright test",
  "db:generate-types": "supabase gen types typescript --local"
}
```

---

## 10. ARCHITECTURE REMARQUABLE

### 10.1 Thème sombre par défaut

- Root layout: `color-scheme` non figé (next-themes gère)
- `VerticalLayout` pose `data-vertical` → `color-scheme: dark` sur le public
- Mode clair : classe `.light` additive, tokens inversés dans `globals.css`
- Stockage séparé (`theme-public`) pour ne pas impacter l'admin

### 10.2 Panier client

- `CartProvider` React Context
- Stockage localStorage + sync serveur (table `paniers`)
- Merge automatique localStorage → serveur à la connexion
- Mécanisme anti-doublon avec clé `groupKey`
- Tracking GA4 add_to_cart / remove_from_cart

### 10.3 Cache public

- `getParametresContact()`, `getStatsAccueil()` : cache in-memory avec revalidation
- Données peu changeantes (coordonnées, stats véhicules)
- **Attention** : `unstable_cache` sérialise en JSON → les types non sérialisables (`Map`, `Set`) deviennent `{}`. Utiliser `Record<string, string>` à la place.

### 10.4 Back-office

- Sidebar shadcn/ui avec badges de comptage
- Dashboard propriétaire : CA, demandes, taux conversion, délai moyen, top véhicules
- Graphiques Recharts avec séries temporelles (7/30/90 jours)
- Notifications non lues en temps réel
- Opérateur redirigé vers `/admin/demandes` si pas propriétaire

### 10.5 Workflows GitHub

- `db-drift.yml` : Détection dérive schema Supabase
- `cron.yml` : Tâches planifiées (ex: expiration demandes)

---

## 11. TESTS

- **Unitaires** : Vitest — 855 tests dans 46 fichiers, dans `apps/web/__tests__/`
- **E2E** : Playwright (dans apps/web/e2e/)
- **Coverage** : @vitest/coverage-v8

Tests qui verrouillent une règle métier plutôt qu'une implémentation — les
casser doit être un choix conscient, pas un effet de bord :

| Test | Ce qu'il verrouille |
|---|---|
| `prix-proprietaire.test.ts` | Aucune écriture de montant par un opérateur. Lit le source des server actions et le SQL de la migration 00047 : casse si une garde est relâchée ou si le trigger repasse en `security definer` |
| `billets.test.ts` | Validation d'une demande de billet : cohérence aller simple / aller-retour, dates passées, bébés vs adultes, validité du passeport jugée **après le départ** |
| `contre-offre.test.ts` | Bornes de la contre-offre (plancher de remise, offre client, prix affiché) et statuts du cycle |
| `immobilier-flux.test.ts` | Cohérence du parcours immobilier : statuts d'attente tous couverts par le cron, exclusion catalogue bornée, client notifié de son créneau |
| `role-guards.test.ts`, `permissions.test.ts` | Cloisonnement des rôles |
| `exclusion.test.ts` | Non-chevauchement des périodes (contrainte GiST) |
| `annulation-48h.test.ts` | Rétention de caution sous 48 h |
| `i18n.test.ts` | Les deux dictionnaires portent les mêmes clés, aucune valeur vide, aucune chaîne restée en français côté anglais. Résolution de la langue (cookie puis Accept-Language, repli fr), et vérification que l'interface consomme réellement le dictionnaire |
| `assistance-cycle.test.ts` | Cycles dossier et billet, facturation d'un dossier (montant lu en base et non du formulaire), pièces justificatives (bucket privé, redépôt qui remplace, rejet motivé) et vérifications de billet enfin écrivables |
| `immobilier-cycle.test.ts` | Cycle d'une demande immobilière : une demande refusée ne se ré-accepte pas (double engagement sur un même bien), acceptée ne retourne pas en négociation, `visite_realisee` distinct de `finalisee`. Cycle d'une visite et réponse du client à son créneau |
| `legal-indemnisation.test.ts` | Indemnisation : rien tant que le régime n'est pas activé, plafond à 0 = pas de plafond, montant figé à la clôture. Pages légales : édition propriétaire, publication refusée s'il reste un `[À COMPLÉTER]`, brouillon `noindex`. Couverture d'article déposée dans le bucket |
| `actions-branchees.test.ts` | **Règle de dépôt** : toute action serveur a un appelant. Les exceptions sont listées nommément avec leur raison, et un second test vérifie qu'elles sont encore réellement orphelines — une exception périmée couvrirait une régression |
| `avis-garde.test.ts` | Un avis ne se dépose que sur SA prestation, terminée, et dans la fenêtre. Lit le SQL de 00077 : les cinq services et leur statut terminal propre, la propriété vérifiée, « introuvable » qui ne distingue pas l'inexistant du non-possédé, et la fenêtre qui part du plus tardif entre fin réelle et clôture — le client ne paie pas notre lenteur |
| `logos.test.ts` | Les dimensions déclarées à `next/image` sont celles du fichier — sinon le navigateur étire l'image pour remplir un cadre qui n'est pas le sien. Vérifie aussi qu'aucun logo n'a retrouvé sa marge transparente, que chaque page service porte le sien, et qu'un logo rendu en largeur libre reste `object-contain` |
| `champs-obligatoires.test.ts` | **Règle de dépôt** : tout champ obligatoire le dit à l'écran. Balaie tous les `.tsx` et casse dès qu'un `required` n'est pas marqué. Couvre aussi `PasswordInput` — un composant, donc invisible à un balayage limité aux balises HTML, ce qui avait laissé le mot de passe de la page de connexion sans étoile. Et la réciproque : une étoile sur un champ que rien n'oblige à remplir promet une contrainte qui n'existe pas |
| `verticales.test.ts` | Le service d'une page se décide à **un seul endroit**. Vérifie que l'en-tête et la mise en page passent par la même fonction, qu'aucune n'a recopié de liste de préfixes, et — en lisant l'arborescence des routes — qu'aucune page d'un dossier de service n'est laissée sans rattachement |
| `rendez-vous.test.ts` | Créneaux de dépôt : un dimanche ne propose rien, une fermeture exceptionnelle vide la journée, le dernier créneau tient entier avant la fermeture, le délai de prévenance écarte le trop proche. Et le branchement — créneau revalidé côté serveur, doublon intercepté, **un seul calendrier** partagé avec les délais transport |
| `textile.test.ts` | Le service textile n'affiche **aucun prix**, et c'est le cœur du métier, pas un oubli : le test vérifie que la table des types ne porte aucune colonne de prix, que le module n'expose aucun calcul, et que l'écran explique l'absence. Plus le cycle (une demande livrée ne se rechiffre pas) et la garde propriétaire sur le montant, en action comme en trigger. Depuis le catalogue (00088), il vérifie aussi qu'`article_id` reste **facultatif** — la description libre est un chemin qu'on ne referme pas — et qu'aucune colonne de prix n'est apparue sur `articles_pagne` |
| `tables-migrees.test.ts` | **Règle de dépôt** : toute table lue ou écrite par le code est créée par une migration de `supabase/migrations/`, et n'a pas été supprimée depuis. Née d'une table vivante dont la seule définition dormait dans un ancien dossier de migrations figé — la production l'avait, une reconstruction ne l'aurait pas eue |
| `heures-ouvrees.test.ts` | Décompte en heures ouvrées : une demande du vendredi 17 h expire le lundi matin, un dimanche ne consomme rien, des horaires inexploitables retombent sur le calendaire. Et la propriété dont dépendent les crons — le temps ouvré ne dépasse jamais le calendaire |
| `crons.test.ts` | Toute route cron est planifiée, toute planification vise une route existante, aucune expression n'est réutilisée, et chaque route échoue fermée sans secret |
| `contrats.test.ts` | Abonnements : ce que le créneau mobilise vraiment (un ramassage scolaire ne bloque pas le véhicule neuf mois), périodes de facturation bornées au terme, génération idempotente par conflit d'unicité, contrat résilié non réactivable. Échéance de devis portée par `devis_expire_at`, et retrait de `creerReservation` sans perdre la collecte du second conducteur |
| `chauffeurs.test.ts` | Documents du client (contrat et état des lieux lisibles par leur client, signés pour le staff sinon) et conducteurs secondaires (décision non rejouable, permis en URL signée). Gestion des chauffeurs : téléphone normalisé et unique (base comprise), pas de désactivation avec courses en cours. Affectation : un chauffeur inactif n'est plus candidat, et le manque de chauffeur ne se dit plus comme un manque de véhicule |
| `statuts-paiement.test.ts` | **Règle de dépôt** : un statut de paiement ne se réécrit jamais depuis celui qu'on vient de lire. Balaie tout `src/` et casse sur un `.eq("statut", <variable>)` ou un `statut:` calculé depuis `paiement.statut` — le filtre doit porter sur le statut **attendu**, écrit en clair |
| `livreur.test.ts` | Paiement à la livraison (court-circuit du prestataire, encaissement indissociable de la remise), fins de parcours (clôture d'échec, annulation client, désaffectation). Cycle d'une expédition : `livree` terminal, transit non contournable, échec repris. Cloisonnement du livreur (n'agit que sur ses colis, désactivé il perd l'accès), preuve obligatoire à la remise et non publique, et lecture du SQL de 00063 pour que la garde reste en `security invoker`. Couverture d'un livreur : vide = dessert tout, accents et casse indifférents, et **une classe de trajet n'est jamais une commune** |
| `facture.test.ts` | Facturation : client résolu depuis la table référencée (le paiement ne le porte pas), numéros distincts, webhook rejoué sans doublon ni numéro brûlé, échec de facture qui ne fait pas échouer l'encaissement, et chemin stocké plutôt qu'URL. Lit aussi le source de `telechargerFacture` : casse si la lecture bascule en clé de service ou si l'URL cesse d'être signée |

---

## 12. JOURNAL DES ÉVOLUTIONS

| Date | Changement |
|---|---|
| 2026-08-05 | **Traduction FR/EN, tranche 3 : le site public est couvert.** En-tête, accueil, espace client (profil, vérification, favoris), contact, avis, blog, suivi, pages légales, et tous les composants transverses. La liste de ce qui reste à traduire est désormais **vide**. **Trois angles morts du garde-fou, découverts en chemin — et le plus grave rendait les deux tranches précédentes incomplètes.** (1) `&apos;` se termine par un point-virgule, et le filtre anti-code du détecteur rejetait tout ce qui en contenait : **chaque phrase française portant une apostrophe passait sous le radar**, soit la moitié d'entre elles. « L'excellence à chaque étape de votre vie » trônait sur l'accueil anglais pendant que la garde annonçait zéro défaut. 34 chaînes ont été rattrapées, réparties sur les trois tranches. (2) Les libellés vivant dans des **propriétés d'objet** (`{ label: "…" }`) n'étaient pas balayés — le carrousel d'accueil, les statuts de vérification, les caractéristiques d'un véhicule. (3) Les **tableaux de constantes au niveau du module** sont figés au chargement du fichier, donc dans une seule langue : engagements et étapes de l'accueil, étapes de livraison, table du badge de vérification. Tous se construisent maintenant dans leur composant. Enfin, `avecElements` complète `remplir` : une phrase qui s'enroule autour d'un lien (« J'ai lu et j'accepte les [CGV] et la [politique] ») reste **entière** dans le dictionnaire, avec ses trous nommés, au lieu d'être découpée en cinq morceaux que l'anglais ne recolle pas dans le même ordre. |
| 2026-08-05 | **Traduction FR/EN, tranche 2 : les cinq services.** Transport (catalogue, filtres, fiche véhicule, réservation, galerie, achat), livraison (présentation, commande, confirmation, preuve), immobilier (liste, fiche, demande, garanties), assistance (visas, pays, billet, passeports, paiement) et textile (catalogue, demande). **Trois trous du garde-fou, trouvés par la vérification navigateur, pas par le test.** (1) Les attributs `lede` et `eyebrow` — les phrases d'accroche affichées en gros sous chaque titre de service — n'étaient pas balayés : la garde disait « traduit » sur une page dont le sous-titre restait en français. (2) Un mot français ISOLÉ sans accent (« Recherche ») n'a ni article ni accent : rien ne le trahissait. (3) Des fragments de code (`{x && (`) passaient pour du texte. Les trois sont corrigés dans le détecteur. **Un défaut que seul le navigateur pouvait voir** : `GarantieDocuments` est un composant SERVEUR et j'y avais mis `useT()`, le hook client — la page immobilier tombait entièrement au rendu, et ni `tsc` ni ESLint ne le signalent. Il passe par `getT()`. Enfin, trois tests visaient des phrases françaises littérales dans le JSX ; ils suivent désormais la valeur dans le dictionnaire — un test qui interdit de traduire la page qu'il protège revient à faire garder une porte par un mur. |
| 2026-08-05 | **Traduction FR/EN, tranche 1 : le tunnel de paiement et les pages d'état.** Un visiteur qui bascule en anglais tombait sur des pages à moitié traduites — la navigation en anglais, la page en français. Ce n'est pas une traduction manquante qu'on finit par ajouter : c'est du texte écrit en dur dans le JSX, invisible tant qu'on ne le cherche pas. Sont traduits ici le panier, le paiement, la confirmation, le fil d'étapes, le lien d'évitement, et les quatre pages d'état — erreur, 404, hors ligne, paiement non abouti — celles qu'on voit au pire moment. **Deux défauts découverts en chemin.** (1) Il existait **deux pages 404** disant la même chose en des termes différents ; elles partagent désormais les mêmes clés, sans quoi traduire l'une aurait laissé l'autre en français. (2) La langue se résolvait à **deux endroits** : `langueCourante()` (cookie puis `Accept-Language`) et le layout public, qui ajoutait une condition — la langue doit être active dans la table `langues`. Le layout alimente le contexte client, `getT()` sert les composants serveur : désactiver l'anglais en base aurait donné un en-tête français au-dessus d'une page anglaise. La condition est la bonne, elle vit maintenant dans la résolution unique. **Le pluriel passe par `Intl.PluralRules`** : `n > 1 ? "s" : ""` est faux en anglais dès zéro — le français écrit « 0 véhicule », l'anglais « 0 vehicles ». Et les phrases à trous remplacent les phrases en morceaux : le code composait « Votre réservation » + « pour le {véhicule} » + la suite, que l'anglais ne coupe pas au même endroit. **La garde** (`i18n.test.ts`) lit le JSX du site public et signale tout texte français hors dictionnaire, avec une liste de ce qui reste — une liste qui **rétrécit** à chaque tranche et qu'on ne peut pas allonger. Portée assumée : le site public, pas l'administration (outil interne d'une équipe francophone), et pas le contenu métier venu de la base. |
| 2026-08-05 | **Le textile était livré, pas branché** (00089). Cinq raccords manquaient, tous silencieux. (1) `article_id` était **écrit et jamais lu** : le client désignait un modèle, l'équipe ne le voyait nulle part et devait le déduire du motif décrit à côté — une écriture sans lecture, et elle portait la commande. (2) `/compte/reservations` agrégeait cinq services sur six : un client envoyait une demande de devis et ne la revoyait **plus jamais**, ni son avancement ni le montant proposé. (3) Les gammes, annoncées « pilotables » en 00087, l'étaient en base et nulle part ailleurs — en ajouter une demandait du SQL ; une pilotabilité sans écran n'existe pas pour celui qui exploite. (4) `avis_refus_motif` (00077) énumère les services un par un : le textile, né après elle, tombait dans `service_inconnu`, si bien qu'une commande livrée affichait « Donner mon avis » sur un bouton qui ne pouvait pas aboutir. (5) Le pied de page listait quatre services sur cinq. Chaque correctif s'accompagne d'un test qui **lit la liste ailleurs** au lieu de la recopier : les services attendus par la garde des avis sont extraits de l'espace client, ceux du pied de page viennent de `VERTICALES`. Une liste recopiée oublie toujours le service suivant. |
| 2026-08-05 | **Deux défauts trouvés en vérifiant, sans rapport avec le textile.** Le séparateur du fil d'Ariane (`BreadcrumbSeparator`, un `<li>`) était rendu **dans** `BreadcrumbItem`, également un `<li>` : erreur d'hydratation React sur **chaque page de l'administration**, depuis toujours. Et `next/image` refusait les photos servies par la Supabase locale — Next 16 bloque l'optimisation depuis une IP privée, à raison — ce qui rendait toute vérification d'image au navigateur impossible en développement, catalogue comme véhicules. La dérogation (`dangerouslyAllowLocalIP` + hôte `127.0.0.1`) est **bornée au développement** : en production, l'optimiseur ne doit pas pouvoir être dirigé vers le réseau interne du serveur. |
| 2026-08-05 | **Un catalogue de pagnes, qui ne ferme rien** (00088). Le service ne montrait rien : le client décrivait ce qu'il cherchait en toutes lettres, sans savoir ce que la maison a en rayon. Le catalogue lui donne quelque chose à regarder — et à désigner. Le point de conception est ce qu'il **ne** change pas : `demandes_textile.article_id` est **nullable**, la description libre reste, et le formulaire s'adapte au lieu de se restreindre (la carte du modèle choisi remplace le sélecteur de gamme, le motif devient « précisions sur ce modèle »). Un lien obligatoire aurait signifié ne plus vendre que ce qui est déjà photographié. Toujours **aucun prix**, pour la raison de 00087 : une photo assortie d'un montant serait exactement ce que l'exploitant a refusé. Le bucket `catalogue-pagnes` est **public** — ce sont des photos de vitrine, pas des pièces d'identité ; les signer à chaque vignette protégerait ce qu'on cherche à montrer. Les photos montent depuis le navigateur, jamais par une Server Action : trois clichés de plusieurs mégaoctets buteraient sur son plafond. Recherche et filtres tournent côté client, avec le compte affiché (« 3 sur 12 ») — sans lui, filtrer donne l'impression que le catalogue a rétréci sans qu'on sache de combien. |
| 2026-08-05 | **Quatorze tables absentes de la section 5.1** — rattrapées. Elles étaient nées correctement (RLS, policies, commentaires) mais n'avaient jamais rejoint la liste qui se dit « la référence en cas de doute » : `moyens_livraison`, `tarifs_livraison_moyen`, `coefficients_mode_livraison`, `messages_dossier`, `rendez_vous_dossier`, `parametres_rendez_vous`, `parametres_ouverture`, `fermetures_agence`, `pages_legales`, `parametres_transport`, `parametres_livraison`, `types_pagne`, `articles_pagne`, `demandes_textile`. Le compte RLS disait encore 52 tables pour 62. Une documentation qui se présente comme la référence et qui a dix tables de retard est pire qu'une absence de documentation : on la croit. |
| 2026-08-04 | **Cinquième service : Textile** (00087). Vente de pagnes — Uniwax (Print, Block, Tabs) et wax hollandais. Son trait central est une **absence** : aucun prix n'est affiché, et ce n'est pas un tarif qu'on finira par renseigner. « Il y a tellement de fournisseurs qui les vendent à leur prix […] on ne peut pas afficher un prix comme ça. » Le marché du pagne n'a pas de prix de référence tenable : chaque revendeur fixe le sien. La table des types ne porte donc **aucune colonne de prix**, délibérément — en ajouter une inviterait à la remplir, et le site annoncerait un montant intenable. Le montant naît sur la demande, après consultation des fournisseurs, et reste réservé au propriétaire (action + trigger `security invoker`, même construction qu'en 00047 et 00049). Les types de pagne sont pilotables, marque libre. L'écran **explique** l'absence de prix plutôt que de laisser le client chercher une grille qui n'existe pas. |
| 2026-08-04 | **Le tarif de la bourse Master : 2 000 000 FCFA** (00086). 00080 l'avait créée au tarif de la Licence faute d'un montant communiqué — une hypothèse, signalée comme telle. GROUP PHOEBE a tranché. Le montant est pilotable, et le corriger en admin aurait suffi pour la production ; mais il n'aurait alors vécu que dans une base, et une reconstruction serait repartie de l'hypothèse. Une valeur donnée par l'exploitant appartient aux migrations et au repli codé, pas seulement à la ligne qu'elle corrige. |
| 2026-08-04 | **Retrait de l'ancienne tarification de livraison** (00085). `tarifs_livraison` (grille zone × mode) et `paliers_poids` ne pilotaient plus aucun prix depuis 00084 ; elles étaient conservées le temps que le nouveau chemin tourne en production, pour ne pas casser un déploiement en cours. Les laisser plus longtemps aurait produit ce que ce dépôt a passé la journée à corriger — deux endroits décrivant la même chose, dont un seul est vrai, et le périmé porte le meilleur nom. Retirés avec eux : la grille et les paliers de `lib/livraison.ts`, leur lecture dans le cache, les deux actions propriétaire devenues orphelines et leur formulaire. Le plafond de poids vient désormais de la flotte (`chargeMaxFlotte`) et non du dernier palier — un plafond doit dire ce que les véhicules portent, pas où s'arrêtait une grille. L'atelier des moyens prend la place de l'ancien formulaire dans l'onglet Livraison, et la page publique affiche la grille zone × moyen avec les coefficients de délai sous le tableau. |
| 2026-08-04 | **Livraison : le moyen remplace le poids dans le prix** (00084). Retour de GROUP PHOEBE (`docs/retours/2026-08-04-livraison.md`) : « il y a moto et puis il y a le cargo […] 3 types de cargo : petit, moyen, grand ». Le moyen et le poids disaient la même chose sous deux formes — on prend un cargo PARCE QUE le colis est lourd — et les garder tous deux aurait facturé deux fois la même réalité, tout en laissant choisir « moto » pour 40 kg. Le prix devient `tarif(zone × moyen) × coefficient(mode)` : le mode reste le **délai**, distinct du **véhicule**, mais en coefficient — une grille complète aurait fait 48 prix à saisir. La liste des moyens est **ouverte** : le propriétaire en ajoute avec ses trois prix de zone, sans déploiement ; un moyen se retire du catalogue mais ne se supprime pas, des expéditions le référencent. Le poids reste saisi et écarte les moyens trop justes, vérifié aussi côté serveur. Défaut trouvé en route : `1500 × 2,3` vaut 3449,99… en virgule flottante — diviser avant d'arrondir donnait 100 F de moins que l'arrondi honnête. |
| 2026-08-04 | **Les heures d'ouverture quittent la table du transport** (00083). Posées en 00075 sur `parametres_transport` pour décompter les délais transport en heures ouvrées — c'était juste tant que le transport était seul à s'en servir. Depuis 00081 les rendez-vous de dépôt lisent les mêmes colonnes : partager était le bon choix, mais **le nom est devenu faux**, et un nom qui ment finit par produire un doublon — le prochain qui aura besoin des horaires ne les cherchera pas là et en créera d'autres. Déplacées vers `parametres_ouverture`, avec reprise des valeurs en place (et non des valeurs par défaut, qui effaceraient un réglage fait en admin). Restent sur `parametres_transport` les trois délais et leur mode de décompte, eux bien spécifiques. Les trois consommateurs — négociation, crons d'expiration, rendez-vous — passent par `getHorairesOuverture`, et le propriétaire les règle depuis un bloc dédié plutôt que noyé dans les délais. |
| 2026-08-04 | **Écrire à l'équipe au sujet d'un dossier** (00082). « Au cas où ils veulent avoir plus de renseignements, il faut qu'il y ait l'option écrire à l'équipe. » Le formulaire de contact général existait, mais il ne sait pas de quel dossier on parle : l'équipe recevait « j'ai une question sur mon visa » sans rien pour le raccrocher. Le fil va **dans les deux sens** — le retour ne demandait que client → équipe, mais une question sans canal de réponse est un cul-de-sac : la réponse serait donnée par téléphone, hors de toute trace. Le rôle de l'auteur est **déterminé côté serveur et figé à l'écriture** : reçu du formulaire, un client afficherait son message comme une réponse officielle ; déduit du rôle courant, un ancien message serait réétiqueté si la personne changeait de rôle. La lecture passe par le client de session, dont la policy borne chacun à ses dossiers. Aucune policy UPDATE ni DELETE : un message envoyé est une trace, pas un brouillon. **Le retour de GROUP PHOEBE est traité en entier.** |
| 2026-08-04 | **Rendez-vous de dépôt de dossier** (00081). « Il choisit la date et puis il prend le rendez-vous de dépôt. » C'est ce qui remplace le règlement en ligne retiré au même moment : le parcours s'arrête sur une date convenue, plus sur un paiement. Règle isolée dans un module pur (`lib/rendez-vous.ts`) parce qu'elle mêle jours d'ouverture, durée de créneau, fermetures exceptionnelles et délai de prévenance — chaque élément est simple, la combinaison ne l'est pas. **Les jours et heures d'ouverture ne sont pas redéfinis** : ils viennent de `parametres_transport` (00075), un seul calendrier pour toute la maison — le nom de cette table est trompeur, c'est signalé et non entrepris ici. Sont pilotables par le propriétaire : durée du créneau, personnes par créneau, délai de prévenance, horizon de l'agenda, et les **fermetures exceptionnelles** sans lesquelles l'agenda proposerait le 1er janvier parce que c'est un mercredi. Trois remparts à la réservation : propriété du dossier, revalidation du créneau côté serveur, index unique contre la course entre deux clics. |
| 2026-08-04 | **Payer en ligne n'est plus une obligation, et le comptoir sait encaisser.** Retour de GROUP PHOEBE : « il n'y a pas de paiement à faire en ligne » pour les dossiers, et « on laisse la possibilité aux gens de venir payer le billet au bureau **ou** en ligne » pour les billets. Le règlement en ligne d'un dossier est **retiré** — la ligne de paiement reste créée à la soumission, sans quoi on ramènerait le défaut corrigé auparavant : un service rendu et jamais encaissé. Les billets gagnent un troisième bouton « Payer au bureau », sans lequel un client sans carte ni Mobile Money restait bloqué sur son devis. **Le manque bloquant** : rien ne permettait à l'équipe d'enregistrer un règlement reçu au comptoir — un paiement ne passait à `capture` que par webhook ou par le livreur. `encaisserAuBureau` comble ce trou en **déléguant à `confirmerCommande`**, le chemin du webhook : même filtre sur le statut attendu, même avancement de la demande, même facture. Écrire un second chemin aurait fini par diverger. Branché sur `/admin/billets` et `/admin/dossiers-voyage`. |
| 2026-08-04 | **Assistance : deux niveaux de bourse, la foire de Chine, et ce que l'assistance ne garantit pas** (00080). Retour de GROUP PHOEBE, transcrit dans `docs/retours/2026-08-04-assistance.md`. La prestation unique « etude » devient **bourse licence** et **bourse master** : le niveau change les pièces exigées, et c'est ce que le candidat vient vérifier avant de postuler — baccalauréat d'un côté, diplôme de licence de l'autre, le reste commun. Chaque prestation déclare désormais **ses** pièces : un Schengen en demande deux, une bourse six, là où la liste était la même pour tous. Ajout du **visa foire de Chine** (salon de Canton), sur devis. Les prix restent affichés mais portent la mention **« à titre indicatif »** — le dossier ne se réglera plus en ligne. Et la mention exigée par l'exploitant : **l'obtention du visa relève de l'ambassade, l'assistance ne la garantit pas**, placée là où le client s'apprête à postuler. Le bouton « Soumettre ma demande » devient « Postuler ». |
| 2026-08-02 | **Le logo de l'en-tête suit le service sur TOUTES ses pages.** La question « à quel service appartient cette page » se décidait à deux endroits, indépendamment : `smart-header` pour le logo, `vertical-layout` pour la couleur d'accent. Les deux listes ne disaient pas la même chose, et aucune ne connaissait autre chose que les chemins portant le nom du service. Le **panier**, le tunnel de **réservation** et le **suivi de colis** retombaient donc sur le logo générique — le client changeait d'univers en cours de parcours, au moment précis où il paie. Une seule fonction (`lib/verticales.ts`), et le panier comme la réservation sont rattachés au transport, le suivi à la livraison. Un test lit l'arborescence des routes : une page ajoutée sous un dossier de service est couverte d'office, un parcours créé ailleurs casse jusqu'à ce qu'on le déclare. Vérifié au navigateur sur treize routes. |
| 2026-08-02 | **Une étoile sur chaque champ obligatoire.** `required` fait bloquer le navigateur à l'envoi mais ne prévient personne avant : l'utilisateur remplissait ce qu'il croyait utile et découvrait au refus ce qu'il devait renseigner. 134 champs marqués dans 45 fichiers, via un composant `<Obligatoire />` unique plutôt qu'une chaîne recopiée — `aria-hidden` dessus, puisque `required` dit déjà « champ obligatoire » aux lecteurs d'écran et qu'ils annonceraient sinon « étoile » au milieu du libellé. Onze champs sans libellé propre ont été traités à la main : cases à cocher (l'étoile va sur le texte du consentement), groupes de boutons radio (sur le titre du groupe — une option n'est pas obligatoire, le choix l'est), dépôts de fichiers et champs de recherche, à qui un libellé a été ajouté au passage. Vingt-sept libellés portaient déjà une étoile écrite à la main : le marquage automatique en a produit une **seconde** — « Marque ** ». Retirées, le composant les porte seul. Deux autres désignaient des champs que rien n'oblige à remplir (prix journalier d'un véhicule proposé à la vente seule, mode de livraison à valeur par défaut) : étoile supprimée sur décision de l'exploitant. Vérifié au navigateur, et c'est ce qui a révélé `PasswordInput`. |
| 2026-08-02 | **Le passeport de chaque voyageur, dès la demande** (00079), et un blocage de paiement levé au passage. Le formulaire ne capturait que le passeport du voyageur principal ; les autres étaient lus à l'étape du PAIEMENT (`passager_nom_0`…) alors que l'écran de paiement n'envoie que l'identifiant et la méthode — **toute demande à plus d'un voyageur était impayable**, le client recevant « Le nom du passager 1 est obligatoire » pour un champ jamais présenté. Un dossier à une personne passait, d'où l'absence de signalement. La collecte remonte à la demande : nom, numéro et expiration obligatoires par voyageur, **fichier facultatif**, bébés de moins de 2 ans exclus. La règle de validité résiduelle est désormais écrite une fois et appliquée à tous. Le fichier monte **depuis le navigateur** — 10 Mo par pièce × 9 voyageurs contre 1 Mo de plafond pour une Server Action — donc seul le chemin transite, borné à `billets/<uid>/` par l'action ET par la policy de dépôt, qui laissait auparavant tout compte connecté écrire n'importe où dans le bucket. `bodySizeLimit` relevé à 10 Mo : `deposerPieceDossier` promettait 10 Mo et échouait au-delà de 1 Mo. Garde de dépôt éprouvée en base. |
| 2026-08-02 | **Plaque claire sous les logos, et second agrandissement.** Mesure préalable : sur le charbon du site, **59,6 %** des pixels des sigles tombent sous 3:1 — le vert du « PHOEBE » et des pictogrammes disparaît. Sur `#FAF9F7`, 36,3 % (le blanc pur ferait 31,4 %, mais on garde la surface claire déjà documentée). Deux jetons, et la distinction est le piège du lot : `--color-logo-plate` s'efface en mode clair, `--color-logo-plate-fixe` non — car **un hero garde sa photo sous un dégradé sombre quel que soit le thème**, et y basculer la plaque la retirerait précisément là où elle sert. Le site public étant sombre par défaut, la plaque est l'état normal et c'est `.light [data-vertical]` qui la retire. Sigle visible porté de 112 à **168 px** sur l'accueil, 160 → 200 px sur les heros — `h-*` couvrant le rembourrage, une hausse naïve l'aurait au contraire rapetissé. La ligne de service passe de 193 à 257 px : c'est désormais le logo qui porte sa hauteur, choix assumé. Vérifié au navigateur en sombre ET en clair. |
| 2026-08-02 | **Les logos des services paraissaient petits — la cause n'était pas la taille CSS.** Les cinq PNG étaient livrés en 500×500 avec une marge transparente occupant jusqu'à **41 %** de la surface (transport.png ne remplissait que 59 % de son cadre) : à taille égale, le sigle affiché était d'autant plus petit. Fichiers rognés au contenu. Second défaut au passage : l'en-tête déclarait des dimensions approximatives — 429×346 pour un fichier carré — et sans `object-contain` le navigateur étirait l'image pour remplir ce cadre, allongeant le logo Assistance de près d'un quart. Dimensions reprises du fichier partout, `object-contain` ajouté. Tailles augmentées ensuite : cartes de l'accueil 64 → 112 px, hero des pages service 96 → 160 px. **La page Livraison affichait le logo de la marque** au lieu du sien. Les attributs `sizes` corrigés dans la foulée : l'en-tête chargeait 411 px pour en afficher 55, le hero recevait 102 px pour un rendu de 155. Vérifié au navigateur : aucun logo étiré, aucun agrandi. |
| 2026-08-02 | **Un avis ne se dépose que sur SA prestation** (00077). La policy d'insertion annonçait « sur une réservation terminée le concernant » et ne vérifiait ni l'un ni l'autre : seulement que `client_id` valait `auth.uid()` et que le compte était client. Comme `avis` porte un `unique (reference_table, reference_id)`, la conséquence dépassait le faux avis — le premier à écrire sur un identifiant occupait la place, donc n'importe quel client pouvait **empêcher le vrai client de s'exprimer**. Une fonction `avis_refus_motif` en `security definer` devient la source unique : la policy s'en sert pour trancher, l'écran pour expliquer. Chacun des cinq services a son statut terminal propre (`terminee`, `finalisee`, `finalise`, `emise`, `livree`), et la fenêtre `delai_apres_terme_jours` — jusque-là lue par personne — part du plus tardif entre la fin réelle et la clôture, pour qu'une clôture tardive de notre part ne rogne pas le délai du client. `moderation_obligatoire` est retirée : elle décrivait le comportement sans pouvoir le changer, et la brancher aurait offert un interrupteur pour publier sans relecture. Garde éprouvée sur base réelle, huit cas dont l'INSERT sous RLS par le mauvais client. **00078** : `agences` est documentée comme dormante par intention — le multi-agences est au programme, un audit ne doit plus la proposer à la suppression. |
| 2026-08-02 | **Un seul dossier de migrations** : `packages/database/supabase/` est supprimé. Ce second projet Supabase était figé au 00034 (42 migrations de retard) et réutilisait le numéro **00032** pour un fichier différent de celui du dossier racine — deux historiques incompatibles, dont un seul était poussé. Sa seule définition unique, `propositions_zones_tarifaires`, a été reprise en 00076. `config.toml`, les seeds et `tests/` remontent à la racine, où le CLI travaille déjà. Le script `generate-types` visait `--local`, donc une base construite depuis le dossier périmé : il pointe désormais sur `--linked`, ce qui correspond à la façon dont `types.ts` était réellement produit. Reconstruction complète depuis les 76 migrations vérifiée avant suppression. |
| 2026-08-02 | **L'atelier de propositions tarifaires : un chemin gardé, un chemin fermé** (00076). Trois ateliers coexistaient ; `propositions_tarifs` (00034) n'avait jamais eu d'écran, et était un doublon **défait** de la proposition de zone : son type acceptait « prix_base » et « intervalles », mais la fonction d'application ne traitait que « coefficients » et « geojson » — accepter une proposition des deux autres types la marquait « acceptée » **sans rien appliquer**. Supprimé plutôt que fini. Au passage, `propositions_zones_tarifaires` — l'atelier qui SERT — n'existait dans aucune migration de `supabase/migrations/` : sa seule définition vivait dans `packages/database/supabase/migrations/`, dossier figé au 00034 qui réutilise le numéro 00032 pour un autre fichier. Redéclarée en idempotent, et `tables-migrees.test.ts` verrouille la classe entière. Enfin, **l'approbation automatique sous 15 % est supprimée** : elle laissait un opérateur écrire un prix véhicule ou un coefficient de zone avec le client service_role, donc hors RLS, et l'écart se mesurant depuis la valeur courante, quelques passages tous sous le seuil doublaient le tarif sans qu'aucun ne le franchisse — le propriétaire n'étant averti que dans le cas contraire. |
| 2026-07-29 | **Les paramètres des billets deviennent pilotables** (00056), onglet « Billets d'avion » dans `/admin/tarifs`, propriétaire seul. Étaient figés dans le code : les **frais de service** par billet, la **validité de passeport exigée** après le départ, le **plafond de voyageurs** et le **délai de réponse** annoncé au client. `validerDemandeBillet` prend désormais ces paramètres au lieu de constantes — les tests vérifient qu'un plafond ou une validité modifiés changent réellement le verdict. Les frais sont **figés sur la demande** à sa création, comme la commission immobilière : le barème peut évoluer sans réécrire ce qui a été annoncé au client. Le devis affiche le total (vol + frais) côté client comme côté admin, et la notification l'annonce détaillé. Même précaution que pour `taux_max_reduction` sur la lecture en cache : le repli ne joue que sur une valeur absente ou non numérique, jamais sur 0 — 0 est légitime pour les frais comme pour la validité exigée. |
| 2026-07-29 | **Vente de billets d'avion** dans le module Assistance (00055). Zone de demande sur `/assistance#billet`, inspirée des comparateurs de vols : aller simple / aller-retour, origine et destination (avec liste d'aéroports en aide, champ libre), dates, ventilation adultes / enfants / bébés, classe, et le passeport du voyageur principal — nom exact, numéro, expiration. Table `demandes_billet` distincte de `dossiers_voyage` : ni les mêmes champs, ni les mêmes statuts, les fondre aurait donné une table à moitié nulle selon le cas. **Pas de recherche de vol en direct** (aucune connexion GDS) : le client décrit son besoin, l'équipe cherche et répond par un devis depuis `/admin/billets`. Le vocabulaire de l'interface le dit — « Demander mon billet », pas « Rechercher ». Le chiffrage (`montant_propose`) suit la règle du projet : propriétaire seul, garde applicative **et** trigger `garde_montant`. Contraintes en base : un aller simple n'a pas de retour, un aller-retour en a un postérieur au départ. Validation applicative : la validité du passeport se juge **après la date de départ** (6 mois), pas à la date de la demande, et un bébé ne voyage pas sans adulte. |
| 2026-07-29 | Dix agents immobiliers couvrent désormais **les 30 biens du catalogue** (détail dans TEST_ACCOUNTS.md). Deux libellés de zone y sont contre-intuitifs, et pour une raison durable : `autoAssignAgent()` retient le **premier** agent dont la zone est contenue dans la localisation, sans ordre défini. D'où `Plateau, Abidjan` plutôt que `Plateau` — « Plateau » est contenu dans « II Plateaux, Abidjan » — et aucun agent « Angré », cette chaîne étant contenue dans « Cocody Angré, Abidjan » sans qu'aucun sous-libellé ne permette de viser l'un sans l'autre. **Simuler toute nouvelle zone contre les localisations existantes avant de la créer.** |
| 2026-07-29 | Les **agents immobiliers se créent depuis `/admin/comptes`**, comme les opérateurs et livreurs, avec leur zone de couverture — obligatoire, sinon l'agent existe sans jamais recevoir de bien (`autoAssignAgent` en dépend). Ils sont aussi désactivables. Trois agents de test créés en base (Cocody, Marcory, Yopougon) et les 14 biens dont la localisation correspond à une zone ont reçu leur agent : l'affectation automatique ne joue qu'à la création d'un bien, les 30 biens existants avaient `agent_id` à null. |
| 2026-07-29 | **Refus explicite pour un agent immobilier sur le catalogue.** `requireStaff()` l'acceptait alors que `biens_staff_manage` et `bien_medias_staff_manage` reposent sur `is_staff()`, qui ne le couvre pas. La RLS filtrait la ligne : l'UPDATE touchait zéro ligne, sans erreur, et l'action répondait « Bien enregistré » sans rien avoir enregistré — un succès mensonger, pire qu'une erreur brute. Nouveau `requireGestionBiens()` sur les cinq écritures du catalogue, et l'entrée « Biens » masquée dans la navigation d'un agent (`masquePourAgent`) pour ne plus l'y conduire. |
| 2026-07-29 | **Commission d'intermédiation** (00054). Les biens appartiennent à des propriétaires tiers : GROUP PHOEBE prélève un pourcentage du montant convenu, pilotable par le propriétaire (`parametres_immobilier.taux_commission`, usuellement 10 à 12 %) et **dû dès l'acceptation de l'offre**. Taux et montant sont figés sur la demande au moment de l'accord — le barème peut changer ensuite sans réécrire l'histoire — et protégés par le même gel que `montant_convenu`. Le registre affiche la commission par ligne et son cumul, en précisant que le volume transigé n'est pas le revenu de la plateforme. Piège évité de justesse : la contrainte de cohérence taux/montant ne bloquait rien, `taux >= 0` sur un taux NULL valant NULL et Postgres n'invalidant un CHECK que sur FALSE. |
| 2026-07-29 | **La location a une période** (00054) : `location_debut` et `location_duree_mois`, exigées sur une offre portant sur un bien à louer. Pour ces demandes, `montant_convenu` s'entend comme le **loyer mensuel** — la distinction n'existait pas et le registre affichait un montant sans dire s'il s'agissait d'un loyer ou d'un prix de vente. |
| 2026-07-29 | **CinetPay branché sur l'immobilier.** Les frais de visite n'étaient payables que par carte : `creerSessionCinetPay` était importé sans jamais être appelé, alors que les trois autres modules l'utilisaient. En Côte d'Ivoire, cela excluait du seul parcours payant du module tous les clients sans carte. Le formulaire propose désormais Mobile Money (Wave, Orange, MTN) ou carte, Mobile Money par défaut. |
| 2026-07-29 | Trois gardes de cohérence sur l'acceptation : les **offres concurrentes** du même bien sont refusées et leurs auteurs prévenus (elles restaient ouvertes jusqu'au cron à 7 jours, sans que ces clients apprennent jamais que le bien leur échappait) ; **un bien déjà pris** ne peut plus faire l'objet d'un second accord ; **une seule demande de visite active** par client et par bien, sinon le client payait les frais deux fois. `requireAgent`, morte depuis toujours, est supprimée. |
| 2026-07-29 | Le prix convenu devient un fait daté (00053). Il vivait dans `montant_contre_offre`, qui restait modifiable après l'acceptation : un UPDATE plus tard, la seule trace de l'accord disait autre chose sans que rien ne le signale. Nouvelle colonne `montant_convenu`, écrite dans le même UPDATE que le passage à `acceptee`, et le trigger `garde_montants` refuse ensuite toute écriture de montant — **pour tous les rôles, `service_role` compris**, sans quoi le gel n'en serait pas un puisque les server actions écrivent avec la clé de service. La comparaison porte sur `OLD.statut` : la transition doit pouvoir écrire le montant, ce sont les écritures suivantes qui sont refusées. Vérifié en base : 8 cas, dont le gel face à service_role et la non-régression sur l'évolution du statut. |
| 2026-07-29 | Registre des transactions immobilières (`/admin/transactions-immobilier`) : qui a loué ou acheté quel bien, à quel prix, quand, avec quel agent. Aucune table dédiée — chaque demande acceptée **est** une ligne d'historique, et un bien revendu donne une nouvelle demande ; un registre séparé aurait créé deux vérités à tenir d'accord. Le cumul des sommes n'est visible que par le propriétaire ; les opérateurs voient le détail ligne à ligne. |
| 2026-07-29 | Garantie documentaire sur chaque bien : les pièces sont en règle et prêtes à inspection devant notaire lors de la finalisation. Volontairement statique et non paramétrable par bien — c'est un engagement d'ensemble ; s'il devait un jour souffrir une exception, il faudrait un indicateur en base plutôt qu'un retrait au cas par cas. |
| 2026-07-29 | Fin du flux immobilier. **Favoris sur les biens** (00052) : la table ne portait que `vehicule_id` NOT NULL — une ligne cible désormais un véhicule ou un bien, jamais les deux ni aucun, avec index uniques partiels (NULL n'étant jamais égal à NULL, une contrainte unique classique aurait laissé passer les doublons) et cascade des deux côtés. À noter : `FavoriButton` n'existait que sur `/compte/favoris` pour retirer, nulle part pour ajouter — les favoris étaient inertes, y compris pour les véhicules ; le bouton est maintenant sur la fiche et les cartes immobilier. **Pagination** du catalogue (12 par page), appliquée après l'exclusion des biens en visite, sinon les pages seraient incomplètes. **`latitude`/`longitude`** cessent d'être mortes : saisies en admin, elles ajoutent un lien « Situer le bien » sur la fiche. Le **formulaire d'interaction est masqué** sur un bien non disponible, au lieu d'échouer après soumission. Les **filtres** passent en `replace` + debounce : ils créaient une entrée d'historique et un rendu serveur par caractère tapé. |
| 2026-07-29 | Parcours visite immobilier terminé (points 1, 4, 5, 6 de l'audit). Le client apprend enfin son créneau : notification à la programmation et à la confirmation, et créneau affiché dans « Mes réservations » — jusqu'ici il payait des frais et la date n'apparaissait nulle part. Le libellé y disait « Visite : <date de création> » pour **toutes** les demandes immobilières, information comprise ; il reflète maintenant le type et l'avancement. La demande hérite de l'agent référent du bien (`visites.agent_id` est NOT NULL : il fallait l'affecter à la main sur chaque demande alors que le bien avait déjà le sien). `offre_soumise` cesse d'être un statut fantôme — posé à la création d'une offre, et ajouté au cron d'expiration, sans quoi les offres ne se seraient jamais fermées. Enfin l'exclusion du catalogue est bornée par le créneau : un agent oubliant de clôturer une visite retirait le bien de la vitrine définitivement. Nouveau `__tests__/immobilier-flux.test.ts`, dont un test qui casse si un statut d'attente est ajouté sans être couvert par le cron — la classe de bug rencontrée deux fois. |
| 2026-07-29 | **Règle métier** : demander une visite donne lieu à des **frais de visite**, dus et non remboursables — ce n'est pas une caution. Rien n'était d'ailleurs jamais restitué : aucun chemin de code ne mettait ce paiement en `remboursement_requis`, le mot promettait au client une restitution inexistante. `parametres_immobilier.caution_visite` → `frais_visite`, nouveau type de paiement `frais` (les `paiements` immobiliers historiques sont reclassés, ceux des autres modules intacts), montant désormais **annoncé sur la fiche du bien avant paiement** et « Sans engagement » retiré du parcours visite (00051). Une caution pourra apparaître plus tard à sa place logique : après accord sur une offre, adossée au paiement qui s'ensuit. Corrige au passage `taux_max_reduction = 0` que `Number(x) \|\| defaut` écrasait en 10 % — 0 est légitime (aucune remise autorisée) et faussait le plancher de contre-offre. |
| 2026-07-29 | Audit immobilier — 4 correctifs de fond. (1) RLS activée sur 10 tables qui en étaient dépourvues avec `GRANT ALL TO anon` : `visites` et `audit_log` étaient modifiables et effaçables par n'importe qui (00048). (2) `biens.prix` réservé au propriétaire, côté app et par trigger (00049) — un opérateur pouvait changer le prix affiché d'un bien. (3) Les notifieurs admin listaient le staff avec la session du client, que `users_select_own` limite à sa propre ligne : la requête renvoyait zéro ligne et **aucune notification n'était jamais créée** pour une demande client (réservation, immobilier, dossier voyage). Passés en clé de service et factorisés dans `notifierStaff`. `message` et `date_souhaitee` du client, qui n'existaient que dans ce texte perdu, ont désormais des colonnes (00050). (4) Un bien disparaissait du catalogue dès l'ouverture d'une demande de visite, caution payée ou non, et `visite_programmee` n'expirant jamais, il n'y revenait plus — une demande par bien vidait la vitrine. L'exclusion ne retient plus que les cautions encaissées, et la fin de visite referme la demande. |
| 2026-07-29 | Contre-offre immobilière : cycle complet. Le propriétaire (seul) contre-offre sur une offre client → statut `contre_offre` → le client accepte (bien réservé) ou refuse (bien libéré). `taux_max_reduction` sert enfin de plancher (`validerContreOffre` dans `lib/immobilier.ts`). Expiration à 7 j incluse dans le cron immobilier, sinon un bien restait bloqué. Migration 00047 : helper `is_proprietaire()`, statut élargi, trigger `garde_montants`, policy `parametres_immobilier` corrigée (elle s'appelait « proprietaire » mais vérifiait `is_staff()`). |
| 2026-07-29 | Sécurité montants : la garde « prix = propriétaire seul » était applicative uniquement, donc contournable — `demandes_immobilier_staff_manage` est `for all using (is_staff())`, un opérateur pouvait écrire un montant via l'API REST avec la clé anon (publique). Le trigger `garde_montants` ferme ce chemin. `modifierParametresImmobilier` exigeait `requireStaff()` alors qu'il écrit `caution_visite` : passé à propriétaire. |
| 2026-07-29 | Fix build Vercel : les colonnes `periode` sont des `tstzrange`, que `supabase gen types` émet en `unknown`. 7 fichiers les traitaient comme `string` → échec `tsc`. Nouveau helper `lib/periode.ts` (`parsePeriodeRange`, `parsePeriodeDebut`), les 2 parsers dupliqués supprimés. Au passage : une période illisible ne provoque plus d'expiration + remboursement à tort dans `expiration-demandes.ts`. |
| 2026-07-29 | `CRON_SECRET` ajouté en `passThroughEnv` dans `turbo.json` (lu au runtime seulement, donc hors hash de cache). Blocs Sentry et cron ajoutés à `.env.example`. |
| 2026-07-29 | Immobilier, cycle de base (commits `d6c611b`, `54e97c2`, `44dd136`, non journalisés à l'époque) : visites programmées avec agent obligatoire, agents immobiliers et zone de couverture, cron d'expiration des demandes, mise à jour automatique du statut du bien selon la demande, page de paramétrage propriétaire, filtres catalogue et galerie photo. |
| 2026-07-28 | Migration shadcn/ui : tous les composants `ui/` (Button, Badge, Card, Input) passés en shadcn base-nova avec `@base-ui/react` primitives. Variants de marque conservés via CVA. Pages services redesignées (Transport, Livraison, Immobilier, Assistance, Accueil) avec les nouveaux composants. Ajout Pagination, HoverCard, Command, Textarea, Dialog, InputGroup shadcn. |
| 2026-07-28 | Fix auth : `bg-hex-pattern` défini dans `auth.css` (panneau gauche du layout connexion/inscription). Admin.css n'était pas chargé sur les pages auth, le fond devenait transparent et le tagline sous le logo était invisible. |
| 2026-07-28 | Fix cache : `unstable_cache` sérialise en JSON → les objets `Map` perdent leur type. Remplacés par `Record<string, string>` dans `getVehiculesWithPhotos`, `getBiensWithPhotos`, `groupVehicles`. |
| 2026-07-28 | Transport : cartes catalogue agrandies comme immobilier (grid `md:grid-cols-2`, image `h-48`, prix `text-3xl`, placeholder SVG identique). |
| 2026-07-28 | Fix assistance : `useActionState` partagé entre les 3 cartes visa → extrait dans sous-composant `VisaCard` avec son propre state. |
| 2026-07-28 | Transport : placeholder image remplacé par icône voiture SVG, puis par le même placeholder que l'immobilier (rectangle + paysage). |
| 2026-07-28 | CODEEBASE.md ajouté au suivi des modifs. |
| 2026-07-28 | Logos animés : ajout keyframe `float` dans globals.css + classe `animate-service-logo` sur les 4 services. Ajout des logos manquants (Transport, Livraison) dans le `PageHero`. |
| 2026-07-28 | Fonds animés : nouveau prop `bgImage` sur `PageHero` avec zoom Ken Burns 20s + voile sombre. Appliqué aux 4 services (hero-car, hero-livraison, hero-immobilier, hero-voyages). |
| 2026-07-28 | Fix hero light mode : texte forcé en `text-white`/`text-white/80` quand `bgImage` est présent (les tokens public-text deviennent sombres en light theme). |
| 2026-07-28 | GoldTrail amélioré : double passe (glow large + core fin), trail plus long (120pts), vie plus lente (0.012), couleurs gold asset. |
| 2026-07-28 | Fix auth dark mode : `focus:bg-white` → `focus:bg-phoebe-pearl` (s'adapte au thème). Ajout override `-webkit-autofill` dans `auth.css`. Même correctif appliqué dans l'admin (8 fichiers). |
| 2026-07-30 | **Documents obligatoires du voyageur** (00057). Trois ajouts à `demandes_billet` : déclaration du certificat fièvre jaune (case à cocher + indicateur admin), mention CEDEAO dans l'interface (le passeport est exigé par les compagnies même vers la CEDEAO, la CNI CEDEAO ne suffit pas), et déclaration d'autorisation parentale pour les mineurs voyageant sans leurs deux parents (case + indicateur admin + validation bloquante). `validerDemandeBillet` vérifie les deux déclarations. Le formulaire client affiche les explications pour chaque document. L'admin voit l'état déclaré/vérifié de chaque document par demande. |
| 2026-07-30 | **Paiement des billets et passagers** (00058). Le cycle passe à `soumise → en_cours_traitement → devis_envoye → payee → emise`. `devis_valable_jusqu_a` fixé à l'envoi du devis (durée pilotable depuis `/admin/tarifs`). Nouvelle table `passagers_billet` pour collecter nom, date naissance et passeport de chaque voyageur. Branchement `demandes_billet` dans `traitement.ts` (webhook → statut `payee`). `payerDevisBillet` : vérifie validité du devis, collecte les passagers, crée le paiement Stripe/CinetPay et redirige. Bouton « Payer » sur la page réservations quand le devis est valide. Admin affiche l'expiration du devis et l'état `payee`. |
| 2026-07-30 | **Avis cross-vertical, factures PDF, blog/guides, i18n** (00059). Migration créant 8 nouvelles tables et 2 buckets Storage. **Avis** : table `avis` polymorphique (remplace `avis_transport` — transport seulement), couvre transport, immobilier, assistance, billet, livraison. Modération en admin (`/admin/avis`), affichage public (`/avis`). **Factures** : génération PDF automatique via pdf-lib après chaque paiement capturé (hooké dans `traitement.ts`), stockage dans bucket `factures`, téléchargeable depuis « Mes réservations » (branché en 00061). Paramètres TVA + numérotation dans `parametres_facturation`. **Blog/Guides** : `categories_article` + `articles` avec SEO metadata, image couverture, publication. Admin CRUD complet (`/admin/blog/*`), pages publiques (`/blog`, `/blog/[slug]`). **i18n** : table `langues` (fr/en seed), `LangueProvider` context, `LocaleSwitcher` dans le header, détection Accept-Language + cookie. Navigation admin augmentée : groupes Modération (Avis), Contenu (Blog), Facturation. |

| 2026-07-31 | **La facturation automatique ne fonctionnait pas** (00060). Trois défauts empilés, tous silencieux — le webhook avale l'erreur, à raison : une facture ratée ne doit pas faire échouer un encaissement. (1) `genererEtStockerFacture` lisait `paiement.client_id`, colonne qui **n'existe pas** sur `paiements` ; `factures.client_id` étant NOT NULL, aucune facture n'aurait jamais été insérée. Le client se résout désormais depuis la table référencée — les cinq (`demandes_transport`, `demandes_immobilier`, `demandes_billet`, `expeditions`, `dossiers_voyage`) portent un `client_id`. Le cast `as never` à l'appel masquait exactement cette erreur. (2) `toLocaleString("fr-FR")` sépare les milliers par une espace fine insécable (U+202F), que les polices standard de pdf-lib ne savent pas encoder : `drawText` levait à la première ligne de montant. Montants formatés à la main, et tout texte ramené au jeu WinAnsi — un nom client ne doit pas pouvoir emporter la facture entière. (3) La numérotation lisait `numero_suivant` puis l'incrémentait en deux temps : chaque ligne d'un panier multi-véhicules étant un paiement distinct capturé dans la même transaction, deux factures pouvaient porter le même numéro, et l'unicité en base perdait la seconde. Nouvelle fonction `prochain_numero_facture()`, atomique par `UPDATE ... RETURNING`, réservée à `service_role` — un export de fichier `"use server"` est une route appelable sans authentification, et l'ancienne version consommait un numéro par appel. Ajouté au passage : index unique sur `factures.paiement_id`, court-circuit avant réservation du numéro pour qu'un webhook rejoué ne brûle rien, et pied de page neutre (la facture d'un billet d'avion annonçait « Location et vente de véhicules »). La route `/admin/factures`, présente dans la navigation mais inexistante, est créée : paramètres TVA / préfixe et registre des factures émises, propriétaire seul. |

| 2026-07-31 | **La facture était déposée dans un bucket privé et référencée par une URL publique** (00061) — lien mort dès l'émission, côté client comme côté admin. Le bucket privé est le bon choix : une facture porte le nom, le téléphone, l'email et les montants d'un client. C'est le stockage de `getPublicUrl()` qui était faux. `factures.pdf_url` devient `pdf_chemin` et porte le chemin de l'objet ; l'URL est **signée à la demande** — 60 s pour un téléchargement client, 5 min pour une page d'admin, assez pour ouvrir le PDF, trop court pour qu'un lien recopié reste exploitable. `telechargerFacture` lit la facture **avec la session du demandeur** (ce sont `factures_select_own` / `factures_staff_select` qui tranchent) puis signe en clé de service : interroger en clé de service dès la lecture rendrait toute facture lisible par quiconque connaît un identifiant. Renommage sans risque, la table étant vide — la génération n'avait jamais abouti (cf. 00060). |

| 2026-07-31 | **Le client peut enfin récupérer ses factures**, et `factures.devis` devient `devise` (00062). Le téléchargement était annoncé dans le journal de 00059 mais `telechargerFacture` n'était branchée sur aucune interface : les factures existaient sans chemin pour y accéder. Nouveau `TelechargerFacture` sur « Mes réservations », qui demande l'URL signée **au clic** — signée au rendu, elle expirerait avant que le client ne clique, et allonger sa validité pour compenser laisserait traîner un accès à un document portant ses coordonnées. Les factures sont indexées par demande : plusieurs par ligne sont possibles (acompte puis solde, ou caution en plus du montant), et le numéro n'est affiché que dans ce cas — seul, il n'apprend rien. La coquille `devis` → `devise` est corrigée par migration plutôt que dans 00059, déjà appliquée : dans un projet où « devis » désigne le chiffrage d'un billet d'avion, le faux ami coûtait cher à la lecture du schéma. |

| 2026-07-31 | **Espace terrain du livreur** (00063). Le rôle `livreur` existait sans aucune interface : le shell admin le refuse, et il n'avait aucun accès RLS à `expeditions` — `expeditions_select_own` filtre sur `client_id`, `expeditions_select_staff` repose sur `is_staff()`, qui ne couvre que `operateur` et `proprietaire`. Un livreur affecté à un colis ne pouvait pas le lire, et chaque changement de statut devait être tapé par un opérateur prévenu par téléphone. Nouveau `/terrain/livreur`, hors des groupes public et admin, pensé pour un téléphone : colis affectés, appels directs sur les contacts, avancement du statut. **Preuve de remise obligatoire** — photo et nom du réceptionnaire (rarement le destinataire déclaré), position facultative parce qu'un GPS refusé ne doit pas empêcher de clôturer une course déjà faite. **Motif obligatoire sur un échec**, sans quoi le statut était un cul-de-sac : ni seconde présentation, ni retour, ni remboursement instruits. Le cycle cesse d'être libre : `TRANSITIONS_LIVRAISON` interdit de sauter le transit ou de défaire une livraison, et l'admin y est soumis comme le livreur — chaque changement écrivant une ligne d'historique, la timeline publique pouvait afficher une chronologie impossible. Côté base, même précaution que pour les montants : la policy d'update borne *quelles lignes* un livreur écrit, jamais *quelles colonnes* — RLS ne sait pas faire — d'où le trigger `garde_livreur_expedition` qui refuse prix, affectation et client, en `security invoker` pour voir le vrai appelant. Enfin la connexion cesse d'envoyer un livreur sur `/compte/profil`, c'est-à-dire l'espace d'un client (`accueilSelonRole`). |

| 2026-07-31 | **Preuve de remise privée, et zone de livreur qui veut dire quelque chose** (00064). Deux suites de l'espace terrain. (1) La photo de remise partait dans `colis-photos`, bucket public : le chemin contient un UUID donc rien n'est énumérable, mais une photo de la porte d'un client avec le nom de qui a réceptionné n'a pas à être lisible par quiconque récupère l'URL. Nouveau bucket privé `livraison-preuves`, `preuve_photo` devient `preuve_chemin`, URL signée à la demande — même traitement que les factures. Le client peut lire les preuves de ses propres colis : c'est d'abord pour lui qu'elles existent. (2) `livreurs.zone_couverture` était comparée **par égalité stricte** à `expeditions.zone`, qui vaut `intracommunale` / `intercommunale` / `nationale` — une classe de trajet, pas un territoire : personne ne « couvre l'intercommunal ». Le champ n'étant exposé par aucun formulaire, le filtre laissait tout le monde passer et marchait par accident ; y écrire « Cocody », comme le nom de la colonne et l'usage voisin le suggèrent, aurait rendu ce livreur inéligible à toutes les expéditions, en silence. La zone devient la **liste des communes desservies**, comparée à `expeditions.commune_collecte` — nouvelle colonne, la commune étant jusque-là fondue dans l'adresse (« détail — Commune ») et irrécupérable sans reparser du texte libre. Vide = dessert tout, et si aucun livreur ne couvre la commune, l'affectation retombe sur l'ensemble plutôt que de laisser le colis sans personne. Enfin `capacite_max_par_jour` et la zone deviennent éditables : à la création du compte, et depuis la nouvelle page `/admin/livreurs` qui montre aussi la charge en cours. Une capacité à 0 est refusée — ce serait un livreur que l'affectation écarte toujours sans que rien ne le dise ; pour suspendre quelqu'un, il y a « actif ». |

| 2026-07-31 | **Le service de livraison complété** (00065, 00066). Onze manques traités d'un coup, dont trois qui décidaient de son utilisabilité. **Paiement à la livraison** : le colis n'était créé qu'après un règlement en ligne intégral, alors que le paiement à la remise est le mode dominant en Côte d'Ivoire — exiger l'avance écartait la clientèle visée. Le paiement existe dès la commande, comme les autres, c'est son encaissement qui est différé ; remettre le colis et encaisser sont un seul geste côté livreur, car remis sans encaissement c'est une perte sèche et encaissé sans remise c'est une caisse fausse. L'admin distingue « à encaisser » d'un impayé — les confondre ferait relancer des clients irréprochables. **La preuve de remise devient visible par le client** (« Reçu par X, le Y »), elle n'était jusque-là lisible que par l'équipe alors que c'est précisément ce qui coupe court à une contestation. **Un échec définitif s'instruit** : clôture par l'admin, paiement encaissé → remboursement à traiter, jamais encaissé → clos ; les expéditions étaient absentes de `remboursements.ts` et le client avait payé un service non rendu sans recours. S'ajoutent : le **dépôt d'avis**, qui n'existait sur aucun module (`soumettreAvis` n'était appelée nulle part, donc `/avis` n'avait rien à publier) ; l'**annulation client** tant que rien n'est engagé ; la **désaffectation** d'un livreur ; les **photos du colis** sur l'écran du livreur, qui servent à identifier le bon paquet ; la **date du mode « Programmée »**, promise par le libellé et jamais demandée ; et la **livraison sur le tableau de bord** (volume, livrés, taux d'échec calculé sur les seuls colis dont le sort est connu, colis sans livreur). Deux corrections de vocabulaire : `capacite_max_par_jour` devient `charge_max_simultanee` — le compte ne filtrait sur aucune date, c'était une charge simultanée et le nom mentait — et `valeur_declaree` dit désormais qu'elle est indicative, aucune indemnisation ne s'y rattachant. |

| 2026-07-31 | **Une annulation n'est pas un échec de livraison** (00067). L'annulation client réutilisait `echec_livraison` avec le motif « Annulée par le client », pour éviter un sixième statut. Économie de façade, et cinq conséquences. Le colis **restait sur l'écran du livreur** (`echec_livraison` compte parmi les statuts actifs) et l'annulation ne le désaffectait pas : il pouvait le reprendre et le livrer, alors que le paiement était déjà marqué remboursable. La transition `echec_livraison → prise_en_charge` existe justement pour reprendre un échec — sur une annulation, c'est un contresens. Le **taux d'échec du tableau de bord** comptait les annulations : la mesure censée juger la performance de livraison était polluée par des décisions de clients. `echec_motif` portait un texte qui n'était pas un motif d'échec. Et le pire : la **clôture d'échec pouvait rejouer sur une annulation** — un paiement passé en `remboursement_requis` était relu par `cloturerEchecLivraison`, qui ne le voyant pas en `capture` le basculait en `echoue` ; le remboursement disparaissait de la file, sans bruit, et le client n'était jamais remboursé. Statut `annulee` dédié, terminal, atteignable depuis `creee` seulement, exclu des deux termes du taux d'échec, et le livreur retiré à l'annulation. |

| 2026-07-31 | **Audit : la même erreur ailleurs ?** Recherche systématique du motif « un statut réutilisé hérite de règles qui ne s'y appliquent pas ». Résultat rassurant sur l'existant : `demandes_transport.annulee` est bien écrit par cinq chemins (annulation client, non-présentation, négociation expirée, échec de paiement), mais **chacun calcule ses propres conséquences et notifie son propre message** — le statut n'y sert qu'à l'affichage, aucun lecteur n'en déduit quoi que ce soit. Idem pour `refusee` / `annulee` en immobilier. En revanche l'audit a trouvé **deux occurrences, toutes deux dans le code écrit ce jour** : `cloturerEchecLivraison` et `annulerExpeditionParClient` conditionnaient l'écriture du paiement au statut **observé** (`.eq("statut", paiement.statut)`) au lieu du statut **attendu**. Ça ressemble à une garde de concurrence sans en être une : la clôture ne changeant pas le statut de l'expédition, elle reste rejouable, et un second passage basculait un `remboursement_requis` en `echoue` — le remboursement quittait la file, sans bruit. Corrigé en branches explicites, et l'annulation acquiert désormais sa transition **avant** de toucher au paiement (l'inverse modifiait l'argent avant d'avoir le droit d'annuler). Tout le reste du dépôt suivait déjà la bonne discipline (`rembourserPaiement`, `marquerRembourse`, l'expiration, la capture à la livraison) ; `statuts-paiement.test.ts` la rend obligatoire en balayant `src/` — vérifié en réintroduisant le bug d'origine, le test casse. |

| 2026-07-31 | **Audit du module transport, et gestion des chauffeurs** (00068). L'audit s'est fait en code et en base. Le cœur est sain — l'affectation véhicule/chauffeur tente l'insertion et libère en cas de conflit, sans jamais se fier à un « il en reste un ». Mais l'option « avec chauffeur » est vendue depuis l'origine **sans qu'aucun chemin ne permette de créer un chauffeur** : les deux pages admin qui touchent la table ne font que la lire, et `/admin/comptes` ne crée que des comptes. Avec zéro chauffeur en base, toute réservation avec chauffeur échouait sur « Ce véhicule n'est pas disponible » — alors que le véhicule l'était. Nouveau `/admin/chauffeurs` (staff) : création, activation, véhicules rattachés, courses en cours. Deux défauts trouvés en chemin et corrigés : l'affectation **ne filtrait pas sur `actif`**, donc la désactivation ne servait qu'à l'affichage ; et le manque de chauffeur se disait comme un manque de véhicule, ce qui poussait le client à renoncer ou à réessayer à l'identique. `chauffeurs.telephone` devient unique — deux identifiants pour une même personne rendraient l'exclusion GiST de `disponibilites_chauffeur` inopérante. La page signale enfin les véhicules qui annoncent l'option sans aucun chauffeur actif rattaché : `vehicules.chauffeur_disponible` est un drapeau commercial indépendant de la ressource, et c'est ce découplage qui produisait la panne. |

| 2026-07-31 | **Le client voit enfin ce qui le concerne, et les conducteurs secondaires sont relus.** `/api/contrat-pdf` était une route complète, écrite pour le client — elle gère déjà son cas d'accès — et **appelée de nulle part** ; elle est branchée sur « Mes réservations ». L'état des lieux, lui, refusait la session du client alors que c'est **le document qui justifie ce qu'on retient sur sa caution** : le lui refuser rendait la retenue incontestable faute d'être consultable. Sa garde suit désormais celle du contrat, et le montant retenu s'affiche à côté du justificatif. Les **conducteurs secondaires** étaient saisis à la réservation — nom et permis déposés dans le bucket privé — puis jamais relus : `statut_verification` restait à `documents_soumis` pour toujours, le circuit que la colonne suppose n'existait pas, et au retrait personne ne savait qui d'autre avait le droit de conduire. Ils apparaissent dans `/admin/demandes` avec le permis en URL signée au clic et une décision valider/rejeter, non rejouable (le filtre porte sur l'état attendu, comme pour les paiements). |

| 2026-08-01 | **Pages légales, consentement CGV, et un blocage sur l'achat.** Les trois liens légaux du pied de page pointaient vers `#` et `accepte_cgv` — présente depuis la migration initiale — n'était jamais remplie faute de case à cocher. Trois pages sont créées sous `/legal/[slug]` avec un **contenu d'exemple** : la structure attendue, et les passages `[À COMPLÉTER]` nommant ce qui manque (RCCM, capital, siège, hébergeur, durées de conservation). Un bandeau les annonce comme provisoires et la page est `noindex` tant qu'il reste un trou — un brouillon indexé serait cité comme engagement de l'entreprise. La case de consentement est exigée **côté serveur** sur les deux chemins vivants (panier et achat), et c'est ce consentement qui est enregistré : une case cochée dans le DOM n'est pas une preuve. En la branchant, découverte d'un **blocage complet sur l'achat de véhicule** : `creerDemandeAchat` écrivait dans `demandes_transport.categorie` la catégorie du *véhicule* (`leger` \| `car` \| `minibus`), alors que la colonne qualifie la *demande* (`classique` \| `evenementiel` \| `scolaire` \| `personnel`). La contrainte rejetait l'insert — vérifié en base, erreur `23514` — et le client recevait l'erreur Postgres brute. Aucune demande d'achat ne pouvait aboutir. |

| 2026-08-01 | **Les abonnements existent enfin** (00069), et deux colonnes mortes trouvent leur emploi. `contrats_recurrents` dormait depuis la migration initiale : table vide, policies posées, zéro ligne de code. Trois manques, dont deux structurants. La **facturation récurrente** n'existait nulle part — ailleurs un paiement naît d'une commande, ici c'est le temps qui déclenche l'écriture : nouvelle table `echeances_contrat`, générée par cron, et **rejouable par construction** puisque l'unicité `(contrat_id, periode_debut)` écarte le doublon à l'insertion plutôt qu'un « a-t-on déjà facturé ? » lu avant d'écrire — entre la lecture et l'écriture, l'autre instance a le temps de passer. Le **modèle de disponibilité** ne s'y prêtait pas : `disponibilites_vehicule` protège les chevauchements réservation par réservation, et un ramassage scolaire de neuf mois y entrerait comme un intervalle continu, immobilisant le véhicule alors qu'il ne sert que matin et soir. Le contrat porte donc un **créneau** — jours de semaine et plage horaire — que l'affectation confronte à la période demandée sans rien poser : le reste du temps demeure louable. Enfin le chauffeur devient durable. **`devis_expire_at`** est câblé de bout en bout : écrit à l'ouverture de la négociation, lu par le cron (avec repli sur l'ancien calcul pour l'existant), et affiché au client — l'échéance se déduisait d'`updated_at`, si bien qu'une note d'opérateur repoussait l'expiration sans que personne l'ait décidé, et le client ne pouvait pas savoir jusqu'à quand son devis tenait. **`creerReservation`** — 293 lignes jamais appelées — est supprimée, mais seulement après avoir déplacé vers le panier la collecte du second conducteur, dont elle était l'unique source : la retirer d'abord aurait vidé l'écran de vérification construit la veille. |

| 2026-08-01 | **Une route cron n'était pas planifiée.** En branchant le cron des échéances d'abonnement, constat que `expirer-demandes-immobilier` — route complète, gardée, en place depuis 00048 — ne figurait dans aucun `schedule` du workflow : elle n'a jamais été appelée. Les demandes immobilières sans réponse depuis 7 jours restaient donc ouvertes indéfiniment, et le bien masqué du catalogue. Panne parfaitement silencieuse : un cron qui ne tourne pas ne produit aucune erreur. Les deux routes sont planifiées (immobilier à 5h30, échéances à 6h), et `crons.test.ts` verrouille désormais la correspondance dans les deux sens — toute route doit être planifiée, toute planification doit viser une route existante, et aucune expression cron ne peut servir deux fois puisque le `case` du workflow n'en retiendrait qu'une. |

| 2026-08-01 | **Nouveaux logos, et retrait de deux tables remplacées** (00070). Les cinq visuels fournis remplacent l'ancien jeu ; le fichier `logo-trans-livr` combinait transport et livraison, désormais distincts — la carte « Livraison » de l'accueil se rabattait faute de mieux sur le logo générique, elle a le sien. Icônes d'application régénérées, et le manifeste PWA corrigé : il déclarait `612x408` pour un visuel qui n'a jamais eu cette taille, ce qui peut faire rejeter l'icône à l'installation ; il expose maintenant 192, 512 et une variante maskable. Côté base, `avis_transport` (remplacée par `avis` en 00059) et `audit_logs` (posée en 00025, jamais utilisée) sont supprimées. Le coût n'était pas le stockage — elles étaient vides — mais la lecture : `audit_log` et `audit_logs` ne diffèrent que par un « s », et le prochain à journaliser avait une chance sur deux de viser la mauvaise. Un test qui figeait le nom du fichier logo a été rendu au sujet qu'il gardait, le domaine. |

| 2026-08-01 | **Ce que je ne pouvais pas décider devient pilotable** (00071). Deux sujets étaient bloqués sur une décision qui ne m'appartient pas : le contenu juridique et le barème d'indemnisation. Une mention légale inventée est pire qu'absente, un plafond improvisé engagerait l'entreprise sur une somme que personne n'a arrêtée. La réponse n'était donc pas d'écrire ces valeurs mais de bâtir de quoi les saisir. Les **trois pages légales** quittent le fichier TypeScript — où les corriger demandait un déploiement — pour la table `pages_legales`, éditée depuis `/admin/pages-legales` par le propriétaire seul. Une page **ne peut pas être publiée tant qu'elle contient un `[À COMPLÉTER]`** : la publier trouée la présenterait comme un engagement ferme auquel il manque une mention obligatoire. Non publiée, elle garde son bandeau et reste `noindex`. La **valeur déclarée** cesse d'être décorative : `parametres_livraison` porte taux, plafond et conditions ; la phrase affichée sous le champ en découle — et dit explicitement qu'aucune indemnisation ne s'y rattache tant que rien n'est activé, l'omission étant le vrai risque. Le montant est **figé sur l'expédition à la clôture** d'un échec, pour la même raison que le taux de TVA sur une facture : faire évoluer le barème ne doit pas réécrire un engagement pris. Enfin la **couverture d'article** passe d'une URL libre à un dépôt dans `blog-images` — bucket créé en 00059 pour cela et resté inutilisé — ce qui permet enfin `next/image` : une URL externe pouvait faire lever le rendu et casser la page entière. |

| 2026-08-01 | **Immobilier : un même bien pouvait être vendu deux fois** (00072). Les neuf statuts de demande n'avaient aucune machine à états, et la conséquence n'était pas théorique. Une demande `refusee` — y compris close **automatiquement** parce qu'un concurrent avait emporté le bien — pouvait repasser à `acceptee` : le contrôle du bien laissait passer, `reserve` étant accepté et c'est justement l'état où le gagnant l'avait mis ; le prix du perdant se figeait, une commission se calculait, et `cloturerConcurrentes` ne refermait pas le vrai gagnant puisque `acceptee` ne figure pas dans les statuts qu'elle balaie. Deux acquéreurs engagés, deux prix arrêtés, deux commissions dues. `TRANSITIONS_DEMANDE_IMMO` et `TRANSITIONS_VISITE` ferment le cycle, et l'écriture est conditionnée au statut lu. **Le créneau de visite attend enfin une réponse** : `proposee` n'en appelait aucune — seul un opérateur passait à `confirmee`, si bien qu'il « confirmait » un rendez-vous que le client n'avait jamais accepté, alors que celui-ci a payé des frais de visite non remboursables. Il peut accepter ou demander une autre date ; décliner ne relibère pas le bien, la demande restant vivante. Enfin **`finalisee` cesse de vouloir dire deux choses** — « la visite a eu lieu » sur une demande de visite, « la vente est conclue » sur une offre, ce second sens sortant le bien du catalogue : `visite_realisee` sépare les deux. Trouvé en chemin : `finalise` (assistance) et `finalisee` (immobilier) ne diffèrent que par un « e », et le second manquait aux listes de « Mes réservations » — une vente conclue restait indéfiniment dans l'onglet « Actives », badgée « En attente ». |

| 2026-08-01 | **Assistance : on vendait gratuitement** (00073). L'audit du dernier module a trouvé le manque le plus coûteux de la session — ailleurs les défauts empêchaient de vendre, ici le service était rendu et **jamais encaissé**. `montant_estime` était écrit à la création depuis le tarif, et aucun paiement de module `voyage` n'était créé nulle part ; le client ne voyait même pas le montant, sa ligne affichant « — ». Le paiement naît désormais avec le dossier, en attente, et se règle depuis « Mes réservations » comme un devis de billet — le montant venant de la base, jamais du formulaire. **`documents_dossier_voyage` était une table morte** : présente depuis la migration initiale, ses policies posées en 00038, zéro ligne de code — alors que le statut `pieces_complementaires_requises` réclamait des pièces qu'aucun canal ne permettait d'envoyer. Dépôt client, vérification staff avec **motif de rejet obligatoire** (sans lui le client redépose la même pièce), bucket privé et URL signée : passeports, diplômes et actes de naissance sont le contenu le plus sensible du produit. Redéposer remplace au lieu d'ajouter, tenu par une unicité en base. Les **pièces du billet** cessent d'être des cases déclaratives : deux colonnes portent les documents, et les drapeaux `certificat_fievre_jaune_valide` / `mineur_autorisation_verifie` — affichés en admin avec un ✓ ou un ✗ et **écrits par personne** — deviennent enfin renseignables. Enfin les deux tables reçoivent leur machine à états, et le client voit son conseiller. |

| 2026-08-01 | **Le sélecteur de langue tient enfin sa promesse.** Il existait depuis 00059 — table `langues`, détection `Accept-Language`, cookie, contexte React — et `useLangue` **n'était appelé nulle part** : choisir « English » rechargeait la page sans rien changer, sauf le libellé du sélecteur. C'était l'instance la plus visible du motif dominant de la session, le contrôle étant posé dans l'en-tête. Dictionnaires `fr`/`en` typés l'un contre l'autre : une clé ajoutée sans sa traduction **fait échouer la compilation**, seule garantie qui tienne dans la durée. Accès serveur (`getT`) et client (`useT`), et `<html lang>` suit désormais la langue — figé à `fr`, il faisait annoncer du français à un lecteur d'écran servant une interface anglaise. Portée assumée : **l'interface**. Descriptions de biens, articles et pages légales restent en français, et une mention le dit aux visiteurs anglophones — le taire laisserait croire à une traduction manquante plutôt qu'à un choix, et une traduction approximative d'un texte qui engage l'entreprise vaut moins que son absence. |

| 2026-08-02 | **Les tunnels de commande passent à l'anglais.** La traduction précédente couvrait l'en-tête, le pied de page et l'espace client, mais s'arrêtait avant les pages qui convertissent : panier, tunnel de paiement, formulaire de commande d'une livraison, et cartes de service de l'accueil. Trois sections s'ajoutent au dictionnaire — `panier`, `livraisonForm`, `verticales` — soit une soixantaine de clés, toujours typées l'une contre l'autre : une clé française sans traduction anglaise fait échouer la compilation. Les libellés des cartes de l'accueil quittent le tableau `services` figé dans le code pour le dictionnaire, indexés par une clé de service. Les **repères de saisie** sont traduits aussi (« Quartier, rue, repère… », « Documents, vêtements… ») : un formulaire anglais qui garde des exemples français au milieu se remarque immédiatement. Trois valeurs légitimement identiques dans les deux langues — « Destination », « Dimensions » et un numéro de téléphone ivoirien — rejoignent la liste d'exceptions du test, désormais commentée par catégorie pour qu'elle reste un choix et non un fourre-tout où l'on verse les traductions manquantes. Deux composants auxiliaires (`ZonePin`, `CommuneField`) reçoivent le hook plutôt qu'une prop : ils sont appelés plusieurs fois et la passer alourdirait chaque appel pour une valeur identique. |

| 2026-08-02 | **Immobilier et assistance en profondeur.** Catalogue, filtres, fiche de bien, pages pays et écrans de confirmation passent à l'anglais — deux sections s'ajoutent au dictionnaire, `immobilier` et `assistancePays`. Trouvé en traduisant : le **filtre de type divergeait des fiches**. Il proposait « Villa » et « Local commercial » là où les cartes affichaient « Maison » et « Bureau » pour les mêmes valeurs `maison` et `bureau` — l'utilisateur filtrait sur un mot et en voyait un autre. Les valeurs étaient correctes, seuls les libellés mentaient ; le dictionnaire en devient la source unique. Le titre du bloc vendeur est découpé en deux clés, l'emphase typographique ne portant que sur sa seconde moitié — la traduire d'un bloc aurait perdu la mise en forme. Trois nouvelles valeurs légitimement identiques (« Transaction », « Type », « Abidjan, Cocody… ») rejoignent la liste d'exceptions du test, dans leur catégorie. |

| 2026-08-02 | **Balayage du code jamais branché, et un manquement de ma part.** `verifierPieceBillet` et `lienPieceBillet`, écrites dans 00073, n'étaient appelées de nulle part : les drapeaux de vérification du billet restaient inécrivables, exactement le défaut que cette PR prétendait corriger. Elles sont branchées sur `/admin/billets`, avec un détail qui compte — rien n'est proposé tant que le client n'a rien déclaré, faire cocher une case pour un document absent n'aurait aucun sens. `actions-branchees.test.ts` rend la règle obligatoire : toute action serveur a un appelant, les exceptions sont nommées avec leur raison, et un second test vérifie qu'elles sont **encore** orphelines — une exception périmée couvrirait une régression future. Le balayage a révélé trois autres cas, laissés en exception explicite : le **workflow de proposition tarifaire** (`proposerModificationTarifs` et ses deux compagnes) n'a jamais été branché alors que son équivalent pour les zones l'est, et surtout **`creerDemandeNegociation` est le seul point d'entrée du statut `en_negociation` et n'a aucun appelant** — toute la négociation est donc inatteignable : le cron d'expiration tourne toutes les 30 minutes sur un ensemble vide, la contre-offre admin n'a rien sur quoi agir, et `devis_expire_at` est écrit par une fonction que personne n'appelle. |

| 2026-08-02 | **La négociation de prix devient atteignable.** Toute la chaîne existait — l'opérateur répond un prix, le client paie, un cron libère le véhicule au bout de 30 minutes — mais `creerDemandeNegociation` n'avait **aucun appelant** : le cron tournait toutes les 30 minutes sur un ensemble vide, la contre-offre admin n'avait rien sur quoi agir, et `devis_expire_at` était écrit par une fonction que personne n'appelait. Un statut, un cron, un écran et un mécanisme d'expiration sans porte d'entrée. Deux entrées désormais, empruntant **le même chemin serveur** : la fiche véhicule pour un véhicule unique — en variante discrète, « Réserver » restant l'action première et la demande de prix l'issue pour qui hésite sur le tarif plutôt que de partir — et le panier pour un lot, `creerDemandeNegociation` sachant déjà traiter plusieurs lignes. Le formulaire **annonce l'échéance de 30 minutes** : le véhicule est réservé dès l'envoi, sinon deux clients négocieraient le même créneau, et un client qui ignore que sa demande expire ne comprend pas de la voir disparaître. L'entrée est absente sur un véhicule à vendre, dont la négociation passe par un autre circuit. `actions-branchees.test.ts` a joué son rôle de garde : son second test a refusé l'exception devenue périmée, obligeant à la retirer. |

| 2026-08-02 | **Les délais du transport deviennent pilotables** (00074), et celui de la négociation change de valeur. Trois délais vivaient dans `lib/constants.ts` — donc modifiables seulement par un déploiement — alors qu'ils alimentent les crons d'expiration et que **l'un d'eux décide d'une rétention de caution**. Les trois passent dans `parametres_transport`, réglables depuis `/admin/tarifs` par le propriétaire seul, bornés à une semaine : au-delà, l'expiration ne protège plus rien ; en dessous de zéro, elle annulerait tout à l'instant. Les constantes subsistent comme **repli** — sans elles, une lecture ratée rendrait les délais nuls et l'expiration s'appliquerait jusqu'aux réservations de la veille. Le délai de négociation passe de **30 minutes à 4 heures** : 30 minutes suppose une équipe devant l'écran en permanence, si bien qu'une demande arrivée à 17 h 50 expirait avant d'être vue et que le client recevait un refus qu'il n'avait pas mérité — le véhicule lui étant réservé pendant ce temps. Quatre heures répondent le matin à une demande du matin, laissent vivre une demande de 16 h jusqu'à 20 h, et n'immobilisent jamais un véhicule plus d'une demi-journée. Le délai annoncé au client dans le formulaire de demande de prix est **substitué depuis le réglage** au lieu d'être écrit dans la phrase : les deux divergeraient au premier changement. Reste une limite assumée : une demande de nuit ou de week-end expire toujours sans réponse — n'expirer que pendant les heures ouvrées serait le correctif complet. |

| 2026-08-02 | **Les délais se décomptent en heures ouvrées** (00075). Allonger un délai ne faisait que déplacer le problème : une demande du samedi soir expirait toujours sans réponse. Mais les trois délais **n'appellent pas la même réponse**, parce qu'ils ne mesurent pas la même chose. La *réponse à une demande de prix* mesure la réactivité de l'équipe, qui ne répond pas à trois heures du matin → ouvrée. Le *retard au retrait* mesure une présence physique en agence : le compter en calendaire retiendrait une caution parce que l'agence était fermée, une pénalité pour un empêchement qu'on a créé soi-même → ouvrée. La *demande acceptée sans suite* mesure le client, qui règle en ligne — et le paiement en ligne ne ferme pas la nuit → calendaire. Chacun reste réglable séparément : ce sont des choix d'exploitation. Techniquement, l'échéance de négociation est **arrêtée à l'écriture** dans `devis_expire_at`, le cron n'ayant plus qu'à la comparer ; les deux autres crons préfiltrent en SQL sur le temps calendaire — toujours supérieur ou égal au temps ouvré, donc aucun candidat ne peut être écarté à tort — puis tranchent ligne par ligne. Des horaires vides ou inversés rendraient tout délai insoluble : l'écran les refuse, et le code retombe sur un décompte calendaire plutôt que de ne jamais expirer. Le fuseau est assumé : Abidjan est à UTC+0 sans heure d'été, les calculs utilisent l'heure UTC directement. |

## 13. ÉVOLUTION

Ce fichier est mis à jour à chaque évolution significative du code.
Les sections à maintenir :

- [ ] Routes et pages (section 4)
- [ ] Composants (section 6)
- [ ] Logique métier (section 7)
- [ ] Design system (section 8)
- [ ] Schéma BDD (section 5)
- [ ] Dépendances (section 2)
