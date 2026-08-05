import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fr } from "@/lib/i18n/fr";
import { en } from "@/lib/i18n/en";
import { dictionnaire, estLangueTraduite, LANGUES_TRADUITES } from "@/lib/i18n";
import { detecterLangue } from "@/lib/langues";

const src = (p: string) => readFileSync(join(process.cwd(), "src", p), "utf8");

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
      "Administration", "Destination", "Dimensions", "Transaction", "Type",
      // Noms propres et devise
      "FCFA", "Mobile Money",
      // Exemples de saisie : un numéro ivoirien et des noms de communes ne se
      // traduisent pas.
      "+225 07 00 00 00 00", "Abidjan, Cocody…",
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
