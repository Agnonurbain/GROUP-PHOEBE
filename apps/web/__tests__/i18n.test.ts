import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fr } from "@/lib/i18n/fr";
import { en } from "@/lib/i18n/en";
import { dictionnaire, estLangueTraduite, LANGUES_TRADUITES } from "@/lib/i18n";
import { detecterLangue } from "@/lib/langues";

const RACINE = join(process.cwd(), "src");
const src = (p: string) => readFileSync(join(RACINE, p), "utf8");

/** Aplatit un dictionnaire en chemins « a.b.c » pour comparer les deux langues. */
function chemins(objet: unknown, prefixe = ""): string[] {
  if (typeof objet !== "object" || objet === null) return [prefixe];
  return Object.entries(objet).flatMap(([cle, valeur]) =>
    chemins(valeur, prefixe ? `${prefixe}.${cle}` : cle)
  );
}

function valeurs(objet: unknown): string[] {
  if (typeof objet === "string") return [objet];
  if (typeof objet !== "object" || objet === null) return [];
  return Object.values(objet).flatMap(valeurs);
}

// Le sélecteur de langue existait depuis 00059 : table `langues`, détection
// Accept-Language, cookie, contexte React — et `useLangue` n'était appelé nulle
// part. Choisir « English » rechargeait la page sans rien changer. Ces tests
// garantissent que les deux dictionnaires restent alignés.
describe("i18n — les deux dictionnaires restent alignés", () => {
  it("les mêmes clés des deux côtés", () => {
    expect(chemins(en).sort()).toEqual(chemins(fr).sort());
  });

  it("aucune valeur vide", () => {
    expect(valeurs(fr).filter((v) => !v.trim())).toEqual([]);
    expect(valeurs(en).filter((v) => !v.trim())).toEqual([]);
  });

  // Une clé oubliée laisse la chaîne française dans une interface anglaise —
  // c'est visible, mais seulement si quelqu'un regarde. Quelques exceptions
  // légitimes : les noms propres et la devise.
  it("l'anglais n'est pas resté français", () => {
    // Valeurs légitimement identiques dans les deux langues. La liste est
    // explicite pour qu'elle reste un choix : y verser une vraie traduction
    // manquante ferait taire le test au lieu de le satisfaire.
    const exceptions = new Set([
      // Mots identiques en français et en anglais
      "Transport", "Blog", "Contact", "Menu", "Total", "Services", "Textile",
      "Confirmation", "Minibus", "Diesel", "Transmission",
      "Administration", "Destination", "Dimensions", "Transaction", "Type",
      // Noms propres et devise
      "FCFA", "Mobile Money",
      // La signature de la maison est un élément de marque, comme le logo :
      // elle s'affiche telle quelle dans les deux langues.
      "Leader Excellence Efficacité.",
      // Exemples de saisie : un numéro ivoirien et des noms de communes ne se
      // traduisent pas.
      "+225 07 00 00 00 00", "Abidjan, Cocody…",
      // Un prénom ivoirien donné en exemple de saisie ne se traduit pas.
      "Kouamé",
      // Le nom du pays s'écrit pareil : c'est un nom propre.
      "GROUP PHOEBE — Côte d'Ivoire",
    ]);
    const identiques = chemins(fr).filter((chemin) => {
      const lire = (o: unknown) =>
        chemin.split(".").reduce<unknown>((acc, k) => (acc as Record<string, unknown>)?.[k], o);
      const vf = lire(fr) as string;
      const ve = lire(en) as string;
      return vf === ve && !exceptions.has(vf);
    });
    expect(identiques).toEqual([]);
  });
});

describe("i18n — résolution de la langue", () => {
  it("le cookie prime sur l'en-tête du navigateur", () => {
    expect(detecterLangue("en-US,en;q=0.9", "fr")).toBe("fr");
  });

  it("sans cookie, l'en-tête décide", () => {
    expect(detecterLangue("en-GB,en;q=0.9", undefined)).toBe("en");
  });

  it("le français est le repli", () => {
    expect(detecterLangue(undefined, undefined)).toBe("fr");
  });

  // La table `langues` est éditable en base : rien n'empêche d'y activer une
  // langue dont l'interface n'existe pas. Mieux vaut un site en français qu'un
  // site vide.
  it("une langue non traduite retombe sur le français", () => {
    expect(dictionnaire("es")).toBe(fr);
    expect(estLangueTraduite("es")).toBe(false);
    expect(estLangueTraduite("en")).toBe(true);
    expect(LANGUES_TRADUITES).toEqual(["fr", "en"]);
  });
});

describe("i18n — l'interface est réellement branchée", () => {
  // `useLangue` n'était appelé nulle part : c'est ce qui rendait le sélecteur
  // décoratif.
  it("le contexte expose le dictionnaire", () => {
    const contexte = src("lib/langue-context.tsx");
    expect(contexte).toContain("export function useT");
    expect(contexte).toContain("dictionnaire(langue)");
  });

  it.each([
    ["en-tête", "components/public/smart-header.tsx"],
    ["pied de page", "components/public/footer.tsx"],
    ["mes réservations", "app/(public)/compte/reservations/page.tsx"],
    ["suivi de colis", "app/(public)/suivi/page.tsx"],
  ])("%s consomme le dictionnaire", (_, chemin) => {
    const code = src(chemin);
    expect(code).toMatch(/useT\(\)|getT\(\)/);
    expect(code).toMatch(/t\.[a-z]+\./);
  });

  /**
   * Le barrel `@/lib/i18n` est importé par `langue-context.tsx`, un composant
   * CLIENT. Y remettre `next/headers` fait entrer une API serveur dans le
   * bundle navigateur : le build de production échoue, et **ni `tsc` ni ESLint
   * ne le voient** — seul `next build` le détecte. C'est arrivé une fois.
   */
  it("le barrel i18n reste pur : aucune API serveur", () => {
    // On vise l'IMPORT, pas la chaîne : le commentaire du fichier mentionne
    // légitimement `next/headers` pour expliquer pourquoi il n'y est pas.
    const barrel = src("lib/i18n/index.ts");
    expect(barrel).not.toMatch(/^\s*import .*["']next\/headers["']/m);
    expect(barrel).not.toMatch(/^\s*import .*["']server-only["']/m);

    // Les helpers serveur vivent à part, et la frontière est déclarée.
    const serveur = src("lib/i18n/server.ts");
    expect(serveur).toContain('import "server-only"');
    expect(serveur).toContain("next/headers");
  });

  it("le contexte client n'importe que le module pur", () => {
    expect(src("lib/langue-context.tsx")).toMatch(/from "@\/lib\/i18n"/);
    expect(src("lib/langue-context.tsx")).not.toContain("@/lib/i18n/server");
  });

  /**
   * La langue se décidait à DEUX endroits : `langueCourante` (cookie puis
   * `Accept-Language`) et le layout public, qui ajoutait une condition — la
   * langue doit être active dans la table `langues`. Le layout alimente le
   * contexte client, `getT()` sert les composants serveur : désactiver
   * l'anglais en base aurait donné un en-tête français au-dessus d'une page
   * anglaise, sans que rien ne le signale.
   */
  it("la langue se résout à un seul endroit", () => {
    const serveur = src("lib/i18n/server.ts")
    // La condition d'activation vit désormais dans la résolution unique.
    expect(serveur).toContain("getLangues()")
    expect(serveur).toMatch(/langues\.some\(\(l\) => l\.code === detectee\)/)

    const layout = src("app/(public)/layout.tsx")
    expect(layout).toContain("langueCourante()")
    // Et plus dans le layout, qui la réécrivait.
    expect(layout).not.toContain("detecterLangue(")
  })

  // Figé à "fr", il faisait annoncer du français à un lecteur d'écran servant
  // une interface anglaise.
  it("l'attribut lang suit la langue choisie", () => {
    const layout = src("app/layout.tsx");
    expect(layout).toMatch(/lang=\{await langueCourante\(\)\}/);
    expect(layout).not.toMatch(/lang="fr"/);
  });

  // Le taire laisserait croire à une traduction manquante plutôt qu'à un choix.
  it("le contenu resté en français est signalé, et seulement hors français", () => {
    const composant = src("components/public/contenu-francais.tsx");
    expect(composant).toMatch(/langue === "fr"\) return null/);
    expect(src("app/(public)/blog/[slug]/page.tsx")).toContain("ContenuFrancais");
  });
});

/**
 * Mots et accents qui trahissent une phrase française.
 *
 * La liste comporte aussi quelques mots ISOLÉS sans accent — « Recherche »,
 * « Filtre » — qu'aucun autre signal ne trahit : une étiquette d'un seul mot
 * n'a ni accent ni article, et passait inaperçue au milieu d'une page traduite.
 */
const FRANCAIS =
  /[àâäéèêëîïôöùûüçœ]|\b(le|la|les|un|une|des|du|de|et|ou|pour|avec|sur|dans|vous|nous|votre|notre|est|sont|par|aux|cette|qui|que|plus|sans|tout|tous|recherche|filtre|filtres|envoi|nom|prix|adresse|ville|date|dates|poids|photos)\b/i;

function fichiersTsx(racine: string): string[] {
  const sortie: string[] = [];
  const marche = (d: string) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) marche(p);
      else if (e.name.endsWith(".tsx")) sortie.push(p);
    }
  };
  marche(racine);
  return sortie;
}

/**
 * Les textes français écrits en dur dans un fichier.
 *
 * On retire d'abord les commentaires : ils sont en français dans tout le
 * dépôt, et c'est très bien — ils ne s'affichent pas.
 */
function textesEnDur(chemin: string): string[] {
  let s = readFileSync(chemin, "utf8");
  s = s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

  /**
   * Les entités HTML sont remises en caractères AVANT tout le reste.
   *
   * `&apos;` finit par un point-virgule, et le filtre anti-code ci-dessous
   * rejette tout ce qui en contient. Résultat : chaque phrase française portant
   * une apostrophe — c'est-à-dire la moitié d'entre elles — passait sous le
   * radar. « L'excellence à chaque étape de votre vie » trônait sur la page
   * d'accueil en anglais, et la garde disait que tout allait bien.
   */
  s = s
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&laquo;|&raquo;/g, '"');

  const trouves = new Set<string>();

  // Texte entre deux balises, éventuellement réparti sur plusieurs lignes.
  for (const m of s.matchAll(/>([^<>]*?)</g)) {
    // Entre la fin d'un composant et le début du suivant, ce « texte » est en
    // fait du code : `} export default function X() { const t = useT() `. Un
    // point-virgule, un `=` ou un mot-clé le trahissent — une phrase affichée
    // n'en contient pas.
    if (/[;=]|&&|\|\||\(\s*$|\b(const|let|function|return|import|export|await)\b/.test(m[1])) continue;
    const brut = m[1].replace(/\{[^{}]*\}/g, " ").replace(/\s+/g, " ").trim();
    if (brut.length < 4 || !FRANCAIS.test(brut)) continue;
    if (/^[\d\s.,€%·—–-]+$/.test(brut)) continue;
    trouves.add(brut.slice(0, 80));
  }

  /**
   * Attributs lus par un humain ou une synthèse vocale.
   *
   * `lede` et `eyebrow` manquaient : ce sont les phrases d'accroche des pages
   * de service, affichées en gros sous le titre. La garde disait « traduit »
   * sur une page dont le sous-titre était encore en français.
   */
  for (const m of s.matchAll(
    /(?:placeholder|aria-label|alt|title|label|lede|eyebrow|subtitle|description)=["']([^"'\n]{4,})["']/g
  )) {
    if (FRANCAIS.test(m[1])) trouves.add(m[1].slice(0, 80));
  }

  /**
   * Propriétés d'objet : `{ label: "…", alt: "…" }`.
   *
   * Les libellés du carrousel d'accueil vivaient dans un tableau de constantes,
   * pas dans du JSX : « Location de véhicules premium » s'affichait en gros sur
   * la page d'accueil anglaise sans que rien ne le signale.
   */
  // `title:` et `description:` sont exclus : ils sont dominés par les blocs
  // `metadata` des pages, dont la traduction est un chantier à part — ils
  // passent par `generateMetadata`, pas par le JSX.
  for (const m of s.matchAll(
    /\b(?:label|alt|desc|texte|lede)\s*:\s*["']([^"'\n]{4,})["']/g
  )) {
    if (FRANCAIS.test(m[1])) trouves.add(m[1].slice(0, 80));
  }

  return [...trouves];
}

/**
 * Ce qui reste à traduire, nommément.
 *
 * Cette liste est le contraire d'une exemption : elle RÉTRÉCIT. Chaque tranche
 * de traduction en retire des lignes, et le test interdit d'en ajouter. Sans
 * elle, il aurait fallu tout traduire d'un coup ou n'avoir aucun garde-fou —
 * la liste permet de verrouiller ce qui est fait pendant que le reste avance.
 */
/**
 * Ce qui reste à traduire, nommément.
 *
 * La liste est VIDE : les trois tranches ont couvert tout le site public. Elle
 * reste ici, et la seconde assertion l'oblige à rester exacte — y ajouter un
 * fichier serait un aveu explicite, pas un oubli silencieux.
 */
const RESTE_A_TRADUIRE = new Set<string>([]);

describe("Traduction — le site public passe par le dictionnaire", () => {
  /**
   * `components/public/` ne suffisait pas : le fil d'étapes du tunnel de
   * paiement vit dans `components/`, et son « Récapitulatif · Paiement ·
   * Confirmation » restait en français au-dessus d'une page traduite — sans
   * que la garde le voie. On balaie donc tout `components/`, sauf les
   * primitives d'interface, qui ne portent pas de texte métier.
   */
  const fichiers = [
    ...fichiersTsx(join(RACINE, "app", "(public)")),
    ...fichiersTsx(join(RACINE, "components")),
  ]
    .filter((f) => !/[/\\]components[/\\](shadcn|admin-ui|ui)[/\\]/.test(f))
    .map((f) => ({ chemin: f, relatif: f.slice(RACINE.length + 1) }));

  const enDefaut = fichiers
    .map((f) => ({ ...f, textes: textesEnDur(f.chemin) }))
    .filter((f) => f.textes.length > 0);

  it("aucun fichier déjà traduit ne réintroduit de texte en dur", () => {
    const nouveaux = enDefaut.filter((f) => !RESTE_A_TRADUIRE.has(f.relatif));
    expect(
      nouveaux.map((f) => `${f.relatif} → ${f.textes.slice(0, 3).join(" | ")}`)
    ).toEqual([]);
  });

  /**
   * L'inverse compte autant : une entrée qui n'a plus lieu d'être doit sortir
   * de la liste, sinon elle protégerait un fichier qu'on croit traduit.
   */
  it("la liste ne garde pas de fichier déjà traduit", () => {
    const enDefautRelatifs = new Set(enDefaut.map((f) => f.relatif));
    const perimes = [...RESTE_A_TRADUIRE].filter((r) => !enDefautRelatifs.has(r));
    expect(perimes).toEqual([]);
  });
});

/**
 * Les deux dictionnaires doivent avoir exactement les mêmes clés.
 *
 * Le type l'impose déjà dans un sens — `en.ts` dérive du type de `fr.ts`, donc
 * une clé française sans traduction fait échouer la compilation. Ce test
 * couvre l'autre sens et le cas d'une valeur vide, que le type laisse passer.
 */

/**
 * Les trous d'un modèle doivent survivre à la traduction.
 *
 * `{montant}` traduit en `{amount}` ne serait jamais rempli : `remplir` ne
 * trouverait pas la clé et laisserait `{amount}` s'afficher au client.
 */
describe("i18n — les modèles gardent leurs trous", () => {
  it("les trous nommés sont les mêmes dans les deux langues", () => {
    const trousDe = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    const divergents = chemins(fr).filter((chemin) => {
      const lire = (o: unknown) =>
        chemin.split(".").reduce<unknown>((acc, k) => (acc as Record<string, unknown>)?.[k], o);
      return trousDe(lire(fr) as string).join(",") !== trousDe(lire(en) as string).join(",");
    });
    expect(divergents).toEqual([]);
  });
});
