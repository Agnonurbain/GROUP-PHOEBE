# Cahier des charges — GROUP PHOEBE

## Plateforme numérique Transport, Livraison, Immobilier & Assistance Voyages et Études

**Site web : Groupphoebe — Application mobile : G-PHOEBE**

> **Note de méthode — 10 juillet 2026**
> Ce document unifie le cahier des charges transmis par GROUP PHOEBE avec le travail de spécification déjà réalisé sur le module véhicules (paiement, vérification d'identité, rôles, cycle de vie des statuts, stack technique). Certains points ne sont pas explicitement tranchés dans le brief d'origine (réservation directe ou devis pour l'événementiel, portée exacte de « tout l'espace Schengen », etc.) : ce document retient à chaque fois l'interprétation la plus raisonnable, signalée par 🔶, plutôt que de bloquer sur une validation préalable. À ajuster au fil de l'eau si de nouvelles précisions arrivent.

## 1. Présentation et objectifs

**Entreprise** — GROUP PHOEBE, entreprise de services proposant des solutions professionnelles en transport, logistique et immobilier.

**Objectif** — Développer une plateforme numérique unique — le site **Groupphoebe** et l'application mobile **G-PHOEBE** (Android et iOS), plus un back-office d'administration — permettant à des particuliers, entreprises et institutions d'effectuer réservations, demandes de devis et opérations immobilières, avec une gestion centralisée de l'ensemble des activités.

**Public cible** — Entreprises, administrations, particuliers, promoteurs immobiliers, investisseurs, ONG, hôtels, agences de voyage, écoles, universités.

Confirmé par les déclinaisons de logo transmises : la marque distingue trois sous-identités — « Group Phoebe Transport & Livraison », « Group Phoebe Immobilier » et « Group Phoebe Assistance Voyages et Études » (nom officiel du module jusque-là désigné « Assistant voyage » dans ce document). Ce document conserve un compte client et un back-office communs aux quatre métiers, mais organise la navigation en trois ensembles (Transport + Livraison, Immobilier, Assistance Voyages et Études) plutôt qu'en quatre modules à plat — voir §9.

## 2. Rôles utilisateurs

| Rôle | Portée |
|---|---|
| **Visiteur** | Consulte catalogues et biens sans compte ; doit créer un compte pour initier une demande. |
| **Client** | Compte unique donnant accès aux quatre modules. Doit compléter la vérification d'identité avant toute réservation de transport (§4.4). |
| **Chauffeur** | Personnel interne (véhicules légers, cars, minibus). Fiche gérée par le propriétaire/un opérateur, calendrier de disponibilité propre. Pas de compte utilisateur au périmètre initial. |
| **Livreur** | Personnel interne affecté aux livraisons de colis. Fiche + statut de disponibilité + suivi de performance (§5). |
| **Agent immobilier** | Gère les biens qui lui sont assignés, les visites et le contact client (§6). |
| **Opérateur** | Équipe interne transverse : gère catalogue, demandes, disponibilités, vérifications et support client selon le ou les modules qui lui sont attribués. Peut proposer une modification de prix, soumise à validation du propriétaire. |
| **Propriétaire / Administrateur** | Accès complet : catalogue, prix, statistiques financières, gestion des comptes internes (opérateurs, chauffeurs, livreurs, agents), validation finale. |

## 3. Priorisation recommandée

Construire les quatre modules simultanément serait le principal risque de ce projet. Ordre recommandé, du plus mature au plus lointain :

1. **Transport — véhicules légers** (avec/sans chauffeur, vente) : déjà spécifié en détail, prêt pour le développement.
2. **Transport — cars et minibus** : même mécanique que ci-dessus, catalogue étendu.
3. **Transport — événementiel, scolaire, personnel d'entreprise** : logique de devis et de contrats récurrents, distincte de la réservation en libre-service.
4. **Livraison de colis** : métier nouveau, à construire depuis zéro.
5. **Immobilier** : métier nouveau, à construire depuis zéro.
6. **Assistance Voyages et Études** : nature réglementaire/conseil suffisamment différente pour mériter un cadrage dédié — spécifié ici a minima (§7), à approfondir séparément avant tout développement.

## 4. Module Transport

*Présenté sous la sous-marque « Group Phoebe Transport & Livraison », avec le module 5 ci-dessous.*

### 4.1 Catégories de véhicules et de services
- **Véhicules légers** — location classique ou vente.
- **Cars et minibus** — même mécanique de catalogue, capacité et tarification adaptées.
- **Location événementielle** — mariages, excursions, cérémonies, navettes événementielles.
- **Transport scolaire** — contrat récurrent avec un établissement.
- **Transport du personnel** — contrat récurrent avec une entreprise.

### 4.2 Catalogue véhicules
Champs par véhicule : marque, modèle, année, catégorie (léger / car / minibus), nombre de places, climatisation, boîte automatique/manuelle, type de carburant, kilométrage, localisation, photos HD, description, prix journalier, prix mensuel, prix de vente (le cas échéant), disponibilité avec ou sans chauffeur. Pour une annonce de vente : carte grise et certificat de situation administrative (certificat de non-gage) à jour. Chaque véhicule a un statut : disponible, réservé, loué, vendu, indisponible.

### 4.3 Deux façons de réserver
🔶 Le brief d'origine mélange réservation directe (date/heure/ville/destination/durée, coût calculé automatiquement) et demande de devis personnalisée. Ce document distingue les deux plutôt que de forcer un seul parcours :

- **Réservation directe** (véhicules légers, cars, minibus en location classique) : le client choisit un véhicule au catalogue, une période (ou un trajet ville de départ/destination pour un usage ponctuel), avec ou sans chauffeur. Le système calcule le coût automatiquement et vérifie la disponibilité en temps réel.
- **Demande de devis** (événementiel, transport scolaire, transport du personnel) : le client décrit son besoin (occasion, nombre de véhicules, dates, trajet, effectif à transporter). Un opérateur ou le propriétaire prépare un devis personnalisé, que le client accepte ou refuse. Un devis accepté se transforme en réservation confirmée. Pour le scolaire et le personnel d'entreprise, le devis peut déboucher sur un contrat récurrent (facturation périodique plutôt qu'à la course). 🔶 Un devis non accepté expire après 14 jours (délai par défaut, ajustable) ; passé ce délai, le client doit soumettre une nouvelle demande.

### 4.4 Vérification d'identité et garantie financière
Avant sa première réservation directe, le client soumet une pièce d'identité et son permis de conduire (statut : non vérifié → documents soumis → vérifié / rejeté). Âge minimum 21 ans. Vérification manuelle par un opérateur au démarrage ; automatisation envisageable au-delà d'un certain volume (ex. Dojah). Un conducteur secondaire déclaré sur une réservation suit le même processus. 🔶 Pour les devis B2B (scolaire, personnel), la vérification porte sur l'entité contractante (établissement, entreprise) plutôt que sur chaque conducteur individuel.

À anticiper avant le lancement : la collecte de ces documents constitue un traitement de données à caractère personnel — déclaration préalable requise auprès de l'ARTCI (loi n° 2013-450), à lancer en parallèle du développement. 🔶 Cette vigilance ne se limite pas au Transport : l'Assistance Voyages et Études manipule des passeports et des dossiers financiers, l'Immobilier des données de solvabilité de locataires — la même déclaration doit couvrir l'ensemble de la plateforme, pas seulement ce module.

### 4.5 Paiement
Moyens de paiement : Orange Money, MTN Money, Wave (via un agrégateur tel que CinetPay), carte bancaire (Stripe pour l'international), paiement en agence. 🔶 Répartition retenue :
- **Réservation directe (catalogue)** : paiement en ligne obligatoire à la demande (montant + caution), méthode au choix du client. La caution est libérée après l'état des lieux de retour.
- **Devis et contrats B2B (événementiel, scolaire, personnel)** : paiement en agence ou virement possible, compte tenu des montants et de la relation contractuelle.
- **Paiement à la livraison** : rattaché au module Livraison de colis (§5.4), pas au transport de personnes.

Les paiements par agrégateur sont asynchrones (confirmation par webhook) : l'architecture doit prévoir des webhooks fiables et idempotents.

### 4.6 Service chauffeur
Optionnel et choisi par le client à chaque demande, jamais imposé par le véhicule lui-même : un véhicule proposant l'option chauffeur reste toujours louable en conduite libre. Chaque chauffeur a une fiche interne et un calendrier de disponibilité distinct de celui du véhicule ; les deux ne sont vérifiés conjointement que si le client choisit l'option.

### 4.7 Disponibilités
Calendrier par véhicule, empêchant nativement toute réservation chevauchante. Blocage manuel (maintenance, nettoyage) ou automatique (véhicule vendu). Pour les cars/minibus affectés à un contrat scolaire ou d'entreprise, les créneaux récurrents bloquent le calendrier à l'avance.

### 4.8 Règles de gestion
- Un véhicule en maintenance ou vendu ne peut pas être réservé.
- Le véhicule doit être restitué avec le même niveau de carburant qu'au départ (plein/plein), sauf mention contraire.
- Une limite de kilométrage peut s'appliquer, avec supplément au-delà.
- Retard de restitution au-delà d'un délai de grâce : pénalité déduite de la caution.
- Non-présentation du client au retrait : annulation automatique, caution retenue.
- État du véhicule documenté par photos horodatées à la prise en charge et au retour.
- Seuls le client titulaire et un éventuel conducteur secondaire vérifié sont autorisés à conduire.
- Politique d'annulation : remboursement intégral au-delà de 48h avant le départ, caution retenue en deçà.

### 4.9 Cycle de vie d'une demande
`en attente de paiement` → `en attente de validation` → `acceptée` (véhicule → réservé, puis loué à la date de départ) → `terminée` (après état des lieux de retour, caution traitée). Ou `refusée` (remboursement automatique) / `annulée` (par le client, ou automatiquement en cas de non-présentation ou d'absence de réponse du propriétaire/opérateur au-delà du délai cible).

### 4.10 Avis clients
Une fois la demande terminée, le client peut noter le véhicule et la prestation de 1 à 5. Moyenne visible sur la fiche véhicule.

## 5. Module Livraison de colis

*Présenté sous la même sous-marque « Group Phoebe Transport & Livraison » que le module 4 — un seul ensemble du point de vue de la navigation, même si les deux métiers restent spécifiés séparément ci-dessous du fait de modèles de données différents.*

### 5.1 Création d'une expédition
Le client saisit : coordonnées de l'expéditeur et du destinataire, poids, dimensions, nature du colis, mode de livraison (standard, express, le jour même, programmée), adresse de collecte et de livraison. 🔶 « Livraison intercommunale » et « nationale (évolutive) » du brief sont traitées comme deux zones tarifaires plutôt que deux modules séparés.

### 5.2 Suivi
Chaque expédition reçoit un numéro de suivi. Statuts : `créée` → `prise en charge` → `en transit` → `livrée` (ou `échec de livraison` → nouvelle tentative ou retour expéditeur). Notification au client à chaque changement de statut (§8).

### 5.3 Gestion interne
Un opérateur affecte un livreur à chaque expédition. Le livreur peut mettre à jour le statut depuis le terrain (accès mobile nécessaire pour ce rôle — voir §9). Suivi des performances par livreur (nombre de livraisons, délais, taux d'échec). Gestion des zones de couverture et de leur tarification.

### 5.4 Paiement
🔶 Le paiement à la livraison (le destinataire ou l'expéditeur règle à la remise du colis) est le mode par défaut de ce module, en complément du paiement en ligne à la création de l'expédition. Facture et reçu téléchargeables depuis l'espace client.

### 5.5 Structure tarifaire
🔶 Structure proposée, la grille de prix elle-même restant à définir par GROUP PHOEBE : tarif de base par zone (intracommunale / intercommunale / nationale) + supplément par palier de poids (ex. 0–5 kg, 5–15 kg, 15 kg et plus) × multiplicateur selon le mode (standard, express, le jour même, programmée). Cette structure permet un calcul automatique du prix à la création de l'expédition, cohérent avec le calcul automatique déjà prévu pour le Transport.

### 5.6 Règles de gestion
- Le poids et les dimensions déclarés doivent rester dans les limites fixées par mode de livraison.
- Une expédition ne peut pas changer de statut en arrière (ex. « livrée » → « en transit »).
- Chaque changement de statut est horodaté et traçable.
- Un livreur ne peut pas être affecté à plus d'expéditions que sa capacité déclarée sur une plage horaire donnée.

## 6. Module Immobilier

### 6.1 Fiche bien
Champs : type de bien (terrain, maison, appartement, bureau), transaction (vente ou location), prix, nombre de chambres, surface, localisation avec carte, photos, galerie, vidéos, description, disponibilité. Statuts, réutilisant le modèle déjà validé pour les véhicules : `disponible`, `réservé`, `loué`, `vendu`, `indisponible`.

### 6.2 Parcours client
Le client consulte les biens, les enregistre en favoris, demande des informations, réserve une visite (créneau proposé par l'agent immobilier assigné) ou contacte directement un conseiller.

### 6.3 Gestion interne
L'agent immobilier gère les biens qui lui sont assignés, les vendeurs et locataires associés, les contrats et le calendrier de visites. Le propriétaire/administrateur a une vue d'ensemble tous biens et agents confondus, ainsi que le suivi des paiements liés (loyers, échéances). 🔶 Attribution d'un nouveau bien à un agent : automatique selon la zone géographique du bien (chaque agent couvre une ou plusieurs zones définies), avec réattribution manuelle possible par le propriétaire. Comme pour les livreurs, un agent en visite a besoin d'un accès mobile de terrain (consulter le dossier du bien, confirmer une visite, ajouter des photos) — deuxième exception à la règle « back-office web uniquement » (§9).

### 6.4 Cycle de vie d'une demande
🔶 Mécanique reprise du Transport (§4.9) et adaptée à un processus généralement plus long : `en attente` (demande envoyée) → `en cours de traitement` (l'agent assigné prend contact) → `visite programmée` (le cas échéant) → `offre soumise` (pour un achat ou une location) → `acceptée` (bien → réservé) → `finalisée` (bien → vendu/loué). Ou `refusée` / `annulée` à toute étape. Ce cycle ne couvre que le premier contact et la négociation ; le paiement lui-même (dépôt de garantie, commission d'agence) n'est pas encore défini — voir §17.

### 6.5 Règles de gestion
- Un bien vendu ou loué ne doit plus apparaître comme disponible.
- Une annonce incomplète (champs obligatoires manquants) ne peut pas être publiée.
- Une visite ne peut être confirmée que si le créneau proposé par l'agent est encore disponible au moment de la demande du client.

🔶 Ce module n'a aucun recouvrement fonctionnel avec le reste de la plateforme (aucune notion de conducteur, de caution ou de kilométrage). Confirmé par la déclinaison de logo « Group Phoebe Immobilier » : ce module se présente comme un ensemble distinct de « Transport & Livraison » du point de vue de la navigation, même s'il partage le même compte client et le même back-office (§10).

## 7. Module Assistance Voyages et Études — cadrage minimal

*Nom officiel confirmé par sa déclinaison de logo propre, remplaçant l'appellation provisoire « Assistant voyage » utilisée jusqu'ici.*

🔶 Ce module a une nature différente des trois autres : il relève du conseil et du montage de dossier réglementaire (études et tourisme/visa), pas de la réservation ou du suivi logistique. La spécification ci-dessous pose une structure de départ ; elle doit être approfondie avec un regard juridique avant tout développement, en particulier sur la responsabilité de la plateforme en cas de dossier mal renseigné.

**Deux offres identifiées :**
- **Études** — accompagnement pour un projet d'études en Chine et en Italie.
- **Tourisme & visa** — accompagnement pour la Grèce, la Pologne, le Portugal, la Chine, l'Italie et, plus largement, l'espace Schengen. 🔶 La portée exacte de « tout l'espace Schengen » (29 pays, ou seulement les pays cités) reste à confirmer ; ce document part du principe que les pays nommés sont prioritaires et que l'espace Schengen dans son ensemble est une extension progressive.

**Fonctionnement proposé :**
1. Le client choisit une destination et un type de dossier (études ou tourisme/visa).
2. Il soumet une demande initiale (profil, destination, dates envisagées).
3. Un conseiller GROUP PHOEBE prend contact et établit la liste des pièces requises pour ce pays.
4. Le client dépose ses documents dans l'espace client ; statut de dossier : `soumis` → `en cours de traitement` → `pièces complémentaires requises` → `finalisé`.
5. Suivi et notifications à chaque étape, comme pour les autres modules.

🔶 Ce document ne prend pas position sur qui porte l'expertise réglementaire (conseillers internes à GROUP PHOEBE, ou partenaires externes/agences consulaires) : cette question a un effet direct sur la responsabilité juridique et doit être tranchée avant la spécification détaillée.

## 8. Espace client unifié

Compte unique donnant accès à : réservations et demandes de devis Transport, suivi des livraisons, demandes et visites Immobilier, dossiers Assistance Voyages et Études, favoris (véhicules et biens), factures/devis/contrats téléchargeables, statut de vérification d'identité, gestion du profil.

## 9. Application mobile — G-PHOEBE

Reprend les fonctionnalités du site pour la partie client, avec navigation adaptée à l'écran. Confirmé par les déclinaisons de logo : la navigation de premier niveau s'organise en trois ensembles — **Transport & Livraison**, **Immobilier**, **Assistance Voyages et Études** — plutôt qu'en quatre onglets à plat. Fonctionnalités mobiles spécifiques : notifications push, géolocalisation (suivi de colis en temps réel côté client, position du livreur), accès rapide au support client, authentification biométrique si le terminal le permet.

🔶 Trois publics mobiles à distinguer : les **clients** (parcours complet, cible initiale), les **livreurs** (accès mobile de terrain pour mettre à jour le statut d'une livraison) et les **agents immobiliers** (accès mobile de terrain pour une visite — consulter un dossier, confirmer un rendez-vous, ajouter des photos). Contrairement au reste du back-office, resté web uniquement pour le MVP, ces deux derniers rôles ont donc besoin d'une interface mobile allégée dès le lancement de leurs modules respectifs.

## 10. Tableau de bord administrateur

| Domaine | Contenu | Accès |
|---|---|---|
| Utilisateurs | Clients, chauffeurs, livreurs, agents immobiliers, opérateurs | Propriétaire (gestion des comptes internes) |
| Transport | Véhicules, réservations, devis, disponibilités, entretien, chauffeurs | Propriétaire + opérateurs assignés |
| Livraison | Colis, tarifs, zones, livreurs, suivi, historique | Propriétaire + opérateurs assignés |
| Immobilier | Biens, vendeurs, locataires, contrats, visites | Propriétaire + agents assignés |
| Financier | Paiements, factures, rapports, chiffre d'affaires, export PDF/Excel | Propriétaire uniquement |

## 11. Notifications, sécurité, référencement

**Notifications** — canaux : WhatsApp Business API pour les événements critiques (nouvelle demande, confirmation, refus, colis en transit, visite confirmée), SMS en repli, push mobile, email pour les documents formels (factures, contrats, devis).

**Sécurité** — HTTPS, sauvegarde automatique, authentification sécurisée, gestion des rôles et permissions (§2), journal des activités pour toute action sensible, protection contre les attaques courantes.

**Référencement (SEO)** — optimisation du site autour des mots-clés propres à chaque module (location de véhicules, location de cars, livraison de colis, vente et location immobilière), avec des pages dédiées par activité plutôt qu'une seule page générique.

## 12. Stack technique

La stack déjà retenue pour le module Transport s'étend naturellement aux nouveaux modules, sans nécessiter de changement d'architecture :

- **Web** — Next.js, hébergé sur Vercel.
- **Mobile** — React Native via Expo + EAS Build ; interface allégée dédiée pour les livreurs (§9).
- **Design** — Tailwind CSS (web) + NativeWind (mobile).
- **Backend & données** — Supabase (PostgreSQL, authentification, stockage, temps réel, fonctions serverless) ; Redis en complément pour le cache et le verrouillage de disponibilité. Les mêmes contraintes d'exclusion sur les plages de dates protègent aussi bien les réservations de véhicules que les créneaux de visite immobilière.
- **Paiement** — CinetPay (Orange Money, MTN Money, Wave, cartes locales) et Stripe (cartes internationales), avec traitement par webhooks fiables et idempotents.
- **Notifications** — WhatsApp Business API et SMS via Twilio, push via Expo Notifications, email transactionnel via Resend.
- **Cartes & géolocalisation** — Mapbox pour la recherche par zone (Transport, Livraison) et le suivi temps réel des livreurs. 🔶 Google Maps Platform spécifiquement pour l'Immobilier : le brief d'origine le nomme explicitement pour ce module, et c'est l'attente standard du secteur immobilier — les deux fournisseurs coexistent, chacun sur son module.
- **Stockage média** — bucket compatible S3 (Supabase Storage) derrière un CDN, dimensionné pour les galeries photo/vidéo du module Immobilier en plus des photos véhicules.
- **Vérification d'identité** — revue manuelle par un opérateur au démarrage, automatisation (ex. Dojah) envisageable ensuite.
- **Infrastructure & DevOps** — GitHub Actions (CI/CD), Sentry (suivi des erreurs), Cloudflare (CDN/DNS/sécurité).

## 13. Charte graphique

Palette officielle, mesurée directement sur le logo transmis par GROUP PHOEBE (remplace les 4 directions provisoires envisagées avant réception du logo) :

| Couleur | Hex | Rôle |
|---|---|---|
| Vert Phoebe | #39A044 | Primaire — en-têtes, boutons, navigation, statuts positifs (disponible, accepté) |
| Vert profond | #23632A | États survolés/pressés |
| Or Phoebe | #D38C37 | Secondaire — accents, badges, statuts d'attente |
| Blanc | #FFFFFF | Fond principal |
| Anthracite | #22282B | Texte principal |
| Gris perle | #F3F9F3 | Fond secondaire, cartes, séparateurs |

Le vert et l'or de la marque correspondent déjà aux couleurs de statut conventionnelles (succès/disponible, attention/en attente) : les réutiliser directement renforce la marque au lieu de la concurrencer. Seul le rouge d'erreur (hors palette de marque, ex. #DC2626) reste volontairement extérieur à cette charte. Détail et méthode d'extraction dans le document « Charte graphique officielle ».

## 14. Évolutions futures

Suivi GPS des véhicules, géolocalisation des livreurs, signature électronique des contrats (juridiquement simple en Côte d'Ivoire — loi n° 2013-546, une signature simple suffit), paiement récurrent pour les entreprises, espace partenaire, espace entreprise multi-utilisateurs, tableau de bord décisionnel (BI), recommandations par intelligence artificielle, chatbot d'assistance, programme de fidélité, gestion des réclamations et tickets de support.

## 15. Livrables attendus

Site internet complet, application Android, application iOS, back-office d'administration, code source documenté, base de données, API, documentation technique, guide utilisateur, formation des administrateurs, garantie de maintenance corrective sur une période à définir contractuellement.

## 16. Critères de réussite

- Le propriétaire peut piloter les quatre modules sans traitement manuel lourd disproportionné.
- Réservations, devis, expéditions et transactions immobilières sont tous suivis avec un statut lisible à tout moment.
- Délai moyen de traitement d'une demande ou d'un devis sous 24h.
- Taux de complétion de la vérification d'identité (Transport) suivi dès le lancement.
- Statistiques disponibles en quasi temps réel dans le tableau de bord financier.
- Chaque module peut être lancé et évalué indépendamment, sans attendre que les quatre soient prêts simultanément.

## 17. Questions ouvertes pour GROUP PHOEBE

Points qui ne peuvent être tranchés que par GROUP PHOEBE (contenu propre ou décision commerciale/risque) — pas de blocage sur ces points d'ici là, mais pas de valeur par défaut posée non plus. À regrouper en un seul échange plutôt qu'à traiter un par un :

1. **Contenu du site** — historique, mission, vision, valeurs, organigramme, chiffres clés, témoignages : à fournir par GROUP PHOEBE, personne d'autre ne peut les rédiger.
2. **Paiement Immobilier** — dépôt de garantie, commission d'agence : montants et modalités.
3. **Colis perdu ou endommagé** — responsabilité, compensation éventuelle, plafond.
4. **Assistance Voyages et Études** — qui porte l'expertise réglementaire (conseillers internes ou partenaires externes/agences consulaires) ; portée exacte de « tout l'espace Schengen ».
5. **Contrats récurrents (scolaire, personnel d'entreprise)** — fréquence de facturation, conditions de résiliation, traitement d'un impayé.
6. **Multi-langue** — marché cible au-delà du français, notamment pour l'Assistance Voyages (dimension internationale déjà présente : Chine, Italie, espace Schengen).
