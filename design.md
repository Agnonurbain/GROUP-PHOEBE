# Design — GROUP PHOEBE

Système de design **verrouillé** pour la plateforme publique. Toute refonte de
page lit ce fichier **avant** d'écrire du code. Ne pas le régénérer par page :
l'étendre ou l'amender quand le système doit grandir.

Les valeurs vivent dans `apps/web/src/app/globals.css` (`@theme` Tailwind v4).
Ce fichier documente **les règles**, pas une copie des tokens.

---

## Genre

**Editorial premium.** Sombre, or, typographie affirmée. Le contenu porte la
page ; la décoration ne la sauve pas.

---

## Familles de macrostructure

Trois familles. Une page appartient à **une seule** famille et en respecte la
forme ; elle ne varie que par ses archétypes de composants.

- **Pages services (marketing)** — `/`, `/transport/catalogue`, `/immobilier`,
  `/assistance`, `/livraison`
  → *Editorial index* : hero biaisé à gauche → bande de preuve → corps en
  listes/bento asymétrique → close « statement ».
  Varient : archétype de hero, traitement du corps (liste, bento, timeline).

- **Pages transactionnelles (app)** — `/panier`, `/panier/paiement`,
  `/livraison/commander`, `/compte/*`, formulaires, confirmations
  → *Utility column* : une colonne de contenu, hiérarchie claire, cartes
  fonctionnelles autorisées. **Aucun enrichissement décoratif.** La fonction
  porte la page.

- **Pages catalogue / fiche** — listings filtrés et fiches produit
  → *Index + rail* : filtres en rail, grille de résultats (la grille régulière
  est **fonctionnelle** ici, donc autorisée), fiche en 2 colonnes
  (média / décision).

---

## Thème

Palette sombre unique (`color-scheme: dark`). Tokens dans `globals.css`.

**Charbon chaud, pas noir pur.** Le noir absolu (`#0A0A0A`) contre un blanc quasi
pur (`#F5F5F5`) éblouit et écrase les filets — c'est l'anti-pattern
« pure black/white ». La palette est décalée vers un charbon légèrement chaud,
qui s'accorde à l'or de la marque.

| Rôle | Token | Valeur | Contraste / fond |
|---|---|---|---|
| Paper | `--color-public-bg` | `#141312` | — |
| Paper 2 | `--color-public-bg-card` | `#1C1A18` | — |
| Paper 3 | `--color-public-bg-elevated` | `#262320` | — |
| Rule | `--color-public-border` | `#423C35` | 1,71:1 *(filets visibles)* |
| Ink | `--color-public-text` | `#EDE9E3` | 15,4:1 |
| Ink 2 | `--color-public-text-muted` | `#A79F95` | 7,1:1 |
| Ink 3 | `--color-public-text-faint` | `#8A8279` | 4,9:1 *(plancher AA)* |
| Accent maison | `--color-accent-gold` | `#C9A84C` | 8,1:1 |

> Le noir `#0A0A0A` subsiste **uniquement** comme encre sur fond accent
> (`text-[#0A0A0A]` sur un bouton or) — c'est voulu, ne pas le migrer.

### Accent par verticale — signature du site

`[data-vertical]` (posé par `(public)/vertical-layout.tsx`) expose
`--color-vertical`. **C'est l'identité de la plateforme : à préserver.**

| Verticale | Accent |
|---|---|
| Accueil / Livraison | or `#C9A84C` |
| Transport | orange `#F97316` |
| Immobilier | vert `#059669` |
| Assistance | bleu `#2563EB` |

**Budget accent : ≤ 5 % du viewport.** L'accent sert le CTA primaire, les
chiffres-clés et les filets d'accentuation — jamais des aplats de fond larges.

> ⚠️ Contraste : sur fond sombre, utiliser `--color-accent-blue-on-dark`
> (`#60A5FA`) pour le **texte** bleu — `#2563EB` ne passe pas (3.8:1).

---

## Typographie

- **Display** : Fraunces (`--font-display`), weight **500**, `tracking-tight`.
  Réservée aux `h1`/`h2` et aux grands chiffres.
- **Corps** : Inter (`--font-inter`), 400/600.
- **Pairing obligatoire** : une page sans display serif retombe dans le
  « Inter-everywhere ». Tout `h1`/`h2` de page service porte `font-display`.

Échelle d'ancrage : `h1` = `text-5xl` → `md:text-7xl` · `h2` = `text-4xl` →
`md:text-5xl` · lede = `text-lg`.

---

## Rythme des têtes de section

Motif unique, **aligné à gauche** :

```
eyebrow (uppercase, tracking-[0.25em], accent, filet 2rem)
h2 font-display
lede (max-w-xl, ink-2)
```

L'eyebrow est **optionnel** — ne pas en mettre sur chaque section (tell IA).

---

## Motion

- Révélation : `ScrollReveal` (`fade-up`, 0.7 s,
  `cubic-bezier(0.25, 0.46, 0.45, 0.94)`) — c'est le **seul** motif d'entrée.
- `StaggerContainer` pour les séries (100 ms).
- **Interdits** : `animate-bounce` (indicateur de scroll), rebond/élastique,
  `animate-glow-pulse` sur un logo de hero.
- `prefers-reduced-motion` : opacité seule.

### Survol — tilt & éclat (`TiltCard`)

- **Tilt** : `maxTilt` = **4°** par défaut (soit ±8°). Le mouvement *accompagne*
  le curseur, il ne bascule pas l'élément. Retour plus lent que l'aller
  (0,45 s, `cubic-bezier(0.22, 1, 0.36, 1)`) pour qu'il se pose.
- **Blocs larges** (lignes pleine largeur) : `tilt={false}`. Une inclinaison est
  bancale à cette échelle — on ne garde que l'éclat.
- **Éclat** : halo or radial qui suit le pointeur (`rgba(201,168,76,0.16)`),
  apparition 0,5 s. Complété si utile par un filet d'accent qui s'allume.
- Souris uniquement (`pointerType === "mouse"`) : au tactile il n'y a pas de
  survol réel et le tilt parasite le défilement. Désactivé en reduced-motion.

---

## Voix des CTA

- **Primaire** : fond accent de la verticale, texte `#0A0A0A` (or) ou blanc
  (couleurs foncées), `rounded-lg`, `px-7 py-3.5`, `text-sm font-semibold`,
  classe `btn-premium`. Libellé = **verbe + objet** (« Découvrir nos services »,
  « Commander une livraison »), jamais « En savoir plus ».
- **Secondaire** : contour `border-public-border` ou `border-white/40` sur
  média, même géométrie.
- **Tertiaire** : lien texte accent avec `→`.

Un seul CTA primaire visible par écran.

---

## Ce que TOUTES les pages partagent

- Le logo et le header/footer (`SmartHeader`, `Footer`).
- L'accent de la verticale et son budget (≤ 5 %).
- Les polices display + corps.
- La voix des CTA (forme, rayon, rythme de padding).
- Le rythme des têtes de section (aligné à gauche).

## Ce sur quoi les pages PEUVENT différer

- La macrostructure **au sein de leur famille**.
- L'archétype de hero (image de fond, filet, logo latéral…).
- Le traitement du corps : liste éditoriale, bento, timeline, tableau.
- L'enrichissement — **pages services uniquement**.

---

## Interdits (anti-slop) — vérifiés à chaque refonte

1. **Hero centré pleine hauteur** (`min-h-[90vh]` + `text-center`) — sur les
   pages *sans* image plein cadre. Le hero de page service est biaisé à gauche
   (`PageHero`) et sa hauteur suit le contenu.
   **Exception assumée — accueil** : au-dessus du slideshow plein cadre, le bloc
   est centré. Un texte collé à gauche laissait un vide de ~1000 px à droite sur
   grand écran et cassait le cadrage photo. La photo impose sa symétrie.
2. **Deux sections consécutives avec le même traitement de carte.** Trois
   grilles de 4 cartes égales = le patron IA.
3. **Tuile-icône au-dessus du titre.** Icône **en ligne** avec le titre.
4. **Tout centrer.** Têtes de section et heros alignés à gauche.
5. **Bande CTA générique centrée** (« Prêt à commencer ? »). Close en
   « statement » biaisé.
6. **Logo de hero centré qui pulse.** Le logo vit dans le header.
7. **Le nombre codé dans un titre** (« Nos 4 services »).
8. **LCP en lazy** : l'image de hero porte `priority`.
9. **Noir/blanc purs.** Fonds et encres passent par les tokens de la palette
   charbon ; pas de `bg-[#0A0A0A]` ni de `text-[#FFFFFF]` en dur.

---

## Journal

| Date | Portée | Notes |
|---|---|---|
| 2026-07-26 | `/` | Refonte éditoriale premium. Introduction de Fraunces (`--font-display`). |
| 2026-07-26 | `design.md`, header/footer, 4 pages services | Verrouillage du système et alignement des destinations de l'accueil. |
| 2026-07-26 | Palette (tout le public) | Sortie du noir pur : charbon chaud, filets visibles (+33 %), encres adoucies. Tokens seuls — aucune structure touchée. |
