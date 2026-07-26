# Tests end-to-end (Playwright)

Vérifient les parcours **navigables** (rendu des pages, navigation, calcul de prix
affiché) — **hors étape de paiement Stripe réelle**, qui ne s'automatise pas ici.

## Prérequis (une fois)

```bash
pnpm --filter web exec playwright install chromium
```

## Lancer

Par défaut, un serveur `pnpm dev` local est démarré automatiquement (il utilise
`apps/web/.env.local` pour Supabase).

```bash
# Tests publics uniquement (aucune connexion requise)
pnpm --filter web e2e

# + tests authentifiés (livraison…) : fournir un compte CLIENT de test
#   (voir TEST_ACCOUNTS.md ; la route /api/test-login est dev-only)
E2E_CLIENT_EMAIL="christian29@gmail.com" \
E2E_CLIENT_PASSWORD="…" \
pnpm --filter web e2e

# Mode interactif
pnpm --filter web e2e:ui
```

## Cibler une preview (pages publiques seulement)

```bash
E2E_BASE_URL="https://…vercel.app" pnpm --filter web e2e e2e/smoke.spec.ts
```

> Les tests authentifiés dépendent de `/api/test-login`, actif **uniquement en
> développement** ; ils sont ignorés (skip) si `E2E_CLIENT_EMAIL/PASSWORD` ne sont
> pas définis.

## Couverture

- `smoke` — les pages publiques répondent et affichent leur titre.
- `navigation` — clic sur une carte véhicule / bien → fiche (garde-fou anti-404).
- `assistance` — la page pays affiche le tarif **spécifique** au pays.
- `contact` — `?sujet=` pré-sélectionne la bonne catégorie.
- `livraison` (auth) — zone + prix calculés **automatiquement** depuis les communes.
