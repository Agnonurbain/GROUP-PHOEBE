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
├── supabase/migrations/         # 44 migrations SQL
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
| `/admin/demandes-immobilier` | Demandes immobilières |
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
| `/api/test-login` | GET | Login de test (dev) |

---

## 5. SCHÉMA DE BASE DE DONNÉES

44 migrations Supabase (00001 → 00044).

### 5.1 Tables principales

| Table | Module | Description |
|---|---|---|
| `agences` | Transverse | Multi-site |
| `users` | Auth | 5 rôles, vérification identité |
| `chauffeurs` | Transport | Chauffeurs avec permis |
| `vehicules` | Transport | Catalogue avec prix, statut |
| `vehicule_photos` | Transport | Photos par véhicule |
| `disponibilites_vehicule` | Transport | Planning avec exclusion GiST |
| `disponibilites_chauffeur` | Transport | Planning chauffeurs |
| `demandes_transport` | Transport | Réservations + devis, cycle de vie complet |
| `lignes_demande` | Transport | Lignes de demande (multi-véhicules) |
| `conducteurs_secondaires` | Transport | Conducteurs additionnels |
| `contrats_recurrents` | Transport | Abonnements scolaire/personnel |
| `propositions_prix` | Transport | Propositions de prix |
| `negociations` | Transport | Négociation prix |
| `avis_transport` | Transport | Avis clients |
| `livreurs` | Livraison | Livreurs avec zone |
| `expeditions` | Livraison | Colis avec suivi |
| `expedition_statut_historique` | Livraison | Timeline statuts |
| `bien_medias` | Immobilier | Photos/vidéos |
| `biens` | Immobilier | Types, transactions, géolocalisation |
| `visites` | Immobilier | Visites programmées |
| `demandes_immobilier` | Immobilier | Demandes info/visite/offre |
| `dossiers_voyage` | Assistance | Dossiers études/visa |
| `documents_dossier_voyage` | Assistance | Documents associés |
| `paiements` | Transverse | Multi-module, multi-méthode, remboursements |
| `notifications_log` | Transverse | Log multi-canal |
| `audit_log` | Transverse | Journalisation |
| `favoris` | Transverse | Favoris utilisateur |
| `paniers` | Transverse | Panier serveur |
| `zones` | Livraison | Zones GeoJSON |
| `communes` | Livraison | Communes |
| `propositions_zones` | Livraison | Propositions modification zones |
| `tarifs_livraison` | Livraison | Tarifs pilotables |
| `tarifs_assistance` | Assistance | Tarifs pilotables |
| `push_subscriptions` | Transverse | Subscriptions push |
| `parametres_contact` | Transverse | Coordonnées (WhatsApp, tel, email, réseau) |

### 5.2 RLS et sécurité

- RLS activée sur toutes les tables
- Politiques par rôle (`client`, `operateur`, `proprietaire`, etc.)
- Trigger `handle_new_user()` pour création auto profil + assignation rôle
- Trigger `lock_role_on_insert()` pour sécuriser le rôle
- Politiques storage pour uploads photos/documents
- Webhooks sécurisés avec signature HMAC
- Rate limiting sur certaines routes API

---

## 6. COMPOSANTS CLÉS

### 6.1 Composants publics (`components/public/`)

| Composant | Rôle |
|---|---|
| `smart-header.tsx` | Header adaptatif (logo par verticale, menu mobile, auth, thème) |
| `footer.tsx` | Footer avec colonnes services/contact/legal |
| `section-head.tsx` | En-tête de section (eyebrow + h2 + lede) |
| `vehicle-booking.tsx` | Réservation véhicule (dates, options, panier) |
| `vehicle-purchase.tsx` | Achat véhicule |
| `vehicle-gallery.tsx` | Galerie photos véhicule |
| `contact-form.tsx` | Formulaire de contact |
| `bien-interaction-form.tsx` | Interaction bien immobilier |
| `payer-acompte.tsx` | Paiement acompte |
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
| `immobilier.ts` | Logique immobilière |
| `assistance.ts` | Logique assistance voyage |
| `contact.ts` | Fonctions contact |
| `analytics.ts` | Tracking GA4 (page_view, add_to_cart, purchase, etc.) |
| `telephone.ts` | Formatage téléphone (Côte d'Ivoire) |
| `cache.ts` | Cache simple in-memory |
| `public-cache.ts` | Cache public avec revalidation |
| `tarifs-cache.ts` | Cache tarifs |
| `rate-limit.ts` | Rate limiting |
| `json-ld.ts` | Génération JSON-LD structured data |
| `upload-validation.ts` | Validation fichiers upload |
| `compress-image.ts` | Compression images (compressorjs) |

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

- **Unitaires** : Vitest (configuré dans apps/web)
- **E2E** : Playwright (dans apps/web/e2e/)
- **Coverage** : @vitest/coverage-v8

---

## 12. JOURNAL DES ÉVOLUTIONS

| Date | Changement |
|---|---|
| 2026-07-28 | Migration shadcn/ui : tous les composants `ui/` (Button, Badge, Card, Input) passés en shadcn base-nova avec `@base-ui/react` primitives. Variants de marque conservés via CVA. Pages services redesignées (Transport, Livraison, Immobilier, Assistance, Accueil) avec les nouveaux composants. Ajout Pagination, HoverCard, Command, Textarea, Dialog, InputGroup shadcn. |
| 2026-07-28 | Fix auth : `bg-hex-pattern` défini dans `auth.css` (panneau gauche du layout connexion/inscription). Admin.css n'était pas chargé sur les pages auth, le fond devenait transparent et le tagline sous le logo était invisible. |

## 13. ÉVOLUTION

Ce fichier est mis à jour à chaque évolution significative du code.
Les sections à maintenir :

- [ ] Routes et pages (section 4)
- [ ] Composants (section 6)
- [ ] Logique métier (section 7)
- [ ] Design system (section 8)
- [ ] Schéma BDD (section 5)
- [ ] Dépendances (section 2)
