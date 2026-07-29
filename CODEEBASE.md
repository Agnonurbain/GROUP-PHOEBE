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
├── supabase/migrations/         # 51 migrations SQL
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
- `(admin)` — Back-office, rôles `operateur` / `proprietaire` uniquement

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
| `/contact` | `page.tsx` | Contact |
| `/suivi` | `page.tsx` | Suivi expédition |
| `/offline` | `page.tsx` | Page hors-ligne |
| `/design-system` | `page.tsx` | Galerie des composants (hors groupe de routes) |

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
| `/admin/demandes-immobilier` | Demandes immobilières (statuts, visites, agent, contre-offre) |
| `/admin/parametres-immobilier` | Paramétrage immobilier — propriétaire uniquement (frais de visite, remise max, quota d'offres) |
| `/admin/dossiers-voyage` | Dossiers voyage/études |
| `/admin/propositions` | Propositions de prix |
| `/admin/comptes` | Gestion utilisateurs |
| `/admin/verifications` | Vérifications documents |
| `/admin/verifications/historique` | Historique vérifications |
| `/admin/tarifs` | Tarifs et zones |
| `/admin/planning` | Planning |
| `/admin/audit` | Journal d'audit |
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

51 migrations Supabase (00001 → 00051).

### 5.1 Tables

42 tables. La liste ci-dessous est celle des `Tables` de `packages/database/src/types.ts`,
qui est généré depuis la base — c'est la référence en cas de doute.

| Table | Module | Description |
|---|---|---|
| `agences` | Transverse | Multi-site |
| `users` | Auth | 5 rôles, vérification identité |
| `chauffeurs` | Transport | Chauffeurs avec permis |
| `vehicules` | Transport | Catalogue avec prix, statut |
| `vehicule_photos` | Transport | Photos par véhicule |
| `vehicule_chauffeurs` | Transport | Affectation chauffeur ↔ véhicule |
| `disponibilites_vehicule` | Transport | Planning avec exclusion GiST, colonne `periode` (`tstzrange`) |
| `disponibilites_chauffeur` | Transport | Planning chauffeurs, colonne `periode` (`tstzrange`) |
| `demandes_transport` | Transport | Réservations + devis, cycle de vie complet. Porte la négociation (`prix_negocie`, `negociation_note`, statut `en_negociation`) |
| `lignes_demande` | Transport | Lignes de demande (multi-véhicules) |
| `conducteurs_secondaires` | Transport | Conducteurs additionnels |
| `contrats_recurrents` | Transport | Abonnements scolaire/personnel |
| `propositions_prix` | Transport | Propositions de prix (opérateur → propriétaire) |
| `avis_transport` | Transport | Avis clients |
| `intervalles_prix` | Transport | Grille de prix par intervalle |
| `zones_tarifaires` | Transport | Zones et km inclus par jour |
| `propositions_tarifs` | Transport | Propositions de modification tarifaire |
| `livreurs` | Livraison | Livreurs avec zone |
| `expeditions` | Livraison | Colis avec suivi |
| `expedition_statut_historique` | Livraison | Timeline statuts |
| `communes` | Livraison | Communes rattachées à une zone |
| `propositions_zones_tarifaires` | Livraison | Propositions de modification de zone |
| `tarifs_livraison` | Livraison | Grille zone × mode, pilotable |
| `paliers_poids` | Livraison | Paliers de poids, pilotables |
| `biens` | Immobilier | Types, transactions, géolocalisation |
| `bien_medias` | Immobilier | Photos/vidéos |
| `agents_immobiliers` | Immobilier | Agents et zone de couverture |
| `visites` | Immobilier | Visites programmées (proposée → confirmée → réalisée) |
| `demandes_immobilier` | Immobilier | Demandes info/visite/offre + contre-offre (`montant_offre`, `montant_contre_offre`) |
| `parametres_immobilier` | Immobilier | Singleton : frais de visite, remise max, quota d'offres |
| `dossiers_voyage` | Assistance | Dossiers études/visa |
| `documents_dossier_voyage` | Assistance | Documents associés |
| `tarifs_assistance` | Assistance | Tarifs pilotables |
| `paiements` | Transverse | Multi-module, multi-méthode, remboursements |
| `webhook_idempotency` | Transverse | Anti-rejeu des webhooks de paiement |
| `notifications_log` | Transverse | Log multi-canal |
| `push_subscriptions` | Transverse | Subscriptions push |
| `audit_log` | Transverse | Journalisation (`action`, `cible_table`, `cible_id`, `details`) |
| `audit_logs` | Transverse | Seconde table d'audit (`table_name`, `record_id`, `old_values`/`new_values`) — les deux coexistent |
| `favoris` | Transverse | Favoris utilisateur |
| `paniers` | Transverse | Panier serveur |
| `parametres_contact` | Transverse | Coordonnées (WhatsApp, tel, email, réseau) |

### 5.2 RLS et sécurité

- RLS activée sur les 42 tables. Ce n'était pas le cas avant la migration 00048 :
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
| `demandes_immobilier.montant_offre`, `montant_contre_offre` | `proposerContreOffre` | `garde_montants` (00047) |
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
| `immobilier.ts` | Logique immobilière : libellés, statuts, validation de contre-offre (`plancherContreOffre`, `validerContreOffre`) |
| `assistance.ts` | Logique assistance voyage |
| `contact.ts` | Fonctions contact |
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

### 7.5 Server Actions (`app/actions/`)

25+ fichiers : `auth.ts`, `cart.ts`, `vehicules.ts`, `reservation.ts`, `livraison.ts`,
`immobilier.ts`, `assistance.ts`, `biens.ts`, `demandes.ts`, `disponibilites.ts`,
`propositions.ts`, `favoris.ts`, `contact.ts`, `admin.ts`, `verification.ts`,
`etat-lieux.ts`, `achat.ts`, `checkout.ts`, `tarifs.ts`, `negociation.ts`,
`propositions-zones.ts`, `vehicle-assignment.ts`, `remboursements.ts`,
`notifications-admin.ts`, `reservation-operateur.ts`.

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

- **Unitaires** : Vitest — 301 tests dans `apps/web/__tests__/`
- **E2E** : Playwright (dans apps/web/e2e/)
- **Coverage** : @vitest/coverage-v8

Tests qui verrouillent une règle métier plutôt qu'une implémentation — les
casser doit être un choix conscient, pas un effet de bord :

| Test | Ce qu'il verrouille |
|---|---|
| `prix-proprietaire.test.ts` | Aucune écriture de montant par un opérateur. Lit le source des server actions et le SQL de la migration 00047 : casse si une garde est relâchée ou si le trigger repasse en `security definer` |
| `contre-offre.test.ts` | Bornes de la contre-offre (plancher de remise, offre client, prix affiché) et statuts du cycle |
| `immobilier-flux.test.ts` | Cohérence du parcours immobilier : statuts d'attente tous couverts par le cron, exclusion catalogue bornée, client notifié de son créneau |
| `role-guards.test.ts`, `permissions.test.ts` | Cloisonnement des rôles |
| `exclusion.test.ts` | Non-chevauchement des périodes (contrainte GiST) |
| `annulation-48h.test.ts` | Rétention de caution sous 48 h |

---

## 12. JOURNAL DES ÉVOLUTIONS

| Date | Changement |
|---|---|
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

## 13. ÉVOLUTION

Ce fichier est mis à jour à chaque évolution significative du code.
Les sections à maintenir :

- [ ] Routes et pages (section 4)
- [ ] Composants (section 6)
- [ ] Logique métier (section 7)
- [ ] Design system (section 8)
- [ ] Schéma BDD (section 5)
- [ ] Dépendances (section 2)
