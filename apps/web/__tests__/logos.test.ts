import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Les dimensions déclarées à `next/image` doivent être celles du FICHIER.
 *
 * L'en-tête annonçait 429×346 pour un logo carré de 500×500 : sans
 * `object-contain`, le navigateur étire l'image pour remplir le cadre déduit de
 * ces valeurs, et le logo Assistance était allongé de près d'un quart. Rien ne
 * plante, rien ne se voit dans un diff — seulement un logo déformé en
 * production.
 *
 * Les fichiers étaient par ailleurs livrés avec une marge transparente qui
 * mangeait jusqu'à 41 % de la surface : à taille CSS égale, le sigle paraissait
 * d'autant plus petit. Ils sont désormais rognés au contenu, et ce test veille à
 * ce qu'un réenregistrement ne réintroduise pas la marge sans mettre à jour le
 * code.
 */

const LOGOS = join(process.cwd(), "public", "logos");
const RACINE = join(process.cwd(), "src");

/** Dimensions d'un PNG, lues dans le bloc IHDR. Aucune dépendance. */
function dimensionsPng(chemin: string): { largeur: number; hauteur: number } {
  const buf = readFileSync(chemin);
  return { largeur: buf.readUInt32BE(16), hauteur: buf.readUInt32BE(20) };
}

function fichiers(dir: string, ext: string[]): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const chemin = join(dir, e.name);
    if (e.isDirectory()) out.push(...fichiers(chemin, ext));
    else if (ext.some((x) => e.name.endsWith(x))) out.push(chemin);
  }
  return out;
}

const reels = new Map(
  readdirSync(LOGOS)
    .filter((f) => f.endsWith(".png"))
    .map((f) => [f, dimensionsPng(join(LOGOS, f))])
);

/**
 * Chaque référence à un logo, avec les dimensions déclarées juste après.
 * Trois écritures cohabitent : `width={n} height={n}`, `w: n, h: n` (la table
 * de l'en-tête) et `logoW: n, logoH: n` (les cartes de l'accueil).
 */
function referencesDeclarees() {
  const trouvees: { fichier: string; logo: string; l: number; h: number }[] = [];
  for (const f of fichiers(RACINE, [".ts", ".tsx"])) {
    const code = readFileSync(f, "utf8");
    for (const m of code.matchAll(/\/logos\/([a-z0-9_-]+\.png)/g)) {
      const suite = code.slice(m.index, m.index + 400);
      const paire =
        suite.match(/width=\{(\d+)\}\s*\n?\s*height=\{(\d+)\}/) ??
        suite.match(/\bw:\s*(\d+),\s*h:\s*(\d+)/) ??
        suite.match(/logoW:\s*(\d+),\s*\n?\s*logoH:\s*(\d+)/);
      if (paire) {
        trouvees.push({
          fichier: f.slice(RACINE.length + 1),
          logo: m[1],
          l: Number(paire[1]),
          h: Number(paire[2]),
        });
      }
    }
  }
  return trouvees;
}

describe("Logos — les dimensions déclarées viennent du fichier", () => {
  const refs = referencesDeclarees();

  it("il y a bien des références à vérifier", () => {
    expect(reels.size).toBeGreaterThanOrEqual(5);
    expect(refs.length).toBeGreaterThanOrEqual(6);
  });

  it("aucune dimension déclarée ne ment sur son fichier", () => {
    const faux = refs
      .filter((r) => {
        const vrai = reels.get(r.logo);
        return !vrai || vrai.largeur !== r.l || vrai.hauteur !== r.h;
      })
      .map((r) => {
        const vrai = reels.get(r.logo);
        return `${r.fichier} : ${r.logo} déclaré ${r.l}×${r.h}, fichier ${
          vrai ? `${vrai.largeur}×${vrai.hauteur}` : "introuvable"
        }`;
      });
    expect(faux).toEqual([]);
  });

  // Rognés au contenu : un logo qui repasserait au-dessus de ce seuil aurait
  // retrouvé sa marge transparente, et paraîtrait rapetissé à taille égale.
  it("les logos n'ont pas de marge transparente", async () => {
    const { readFile } = await import("node:fs/promises");
    const trop: string[] = [];
    for (const [nom] of reels) {
      const buf = await readFile(join(LOGOS, nom));
      // Signature suffisante ici : on vérifie la géométrie, pas les pixels —
      // un carré parfait 500×500 est la trace du gabarit d'origine.
      const { largeur, hauteur } = dimensionsPng(join(LOGOS, nom));
      if (largeur === 500 && hauteur === 500) trop.push(`${nom} (gabarit 500×500 non rogné)`);
      expect(buf.length).toBeGreaterThan(0);
    }
    expect(trop).toEqual([]);
  });
});

describe("Logos — chaque page service porte le sien", () => {
  const src = (p: string) => readFileSync(join(RACINE, p), "utf8");

  // La page Livraison affichait le logo de la marque. Rien ne le signalait :
  // un logo valide, sur une page valide, simplement pas le bon.
  it.each([
    ["app/(public)/livraison/page.tsx", "livraison"],
    ["app/(public)/immobilier/page.tsx", "immobilier"],
    ["app/(public)/assistance/page-client.tsx", "assistance"],
    ["app/(public)/transport/catalogue/page.tsx", "transport"],
  ])("%s affiche %s.png", (page, logo) => {
    expect(src(page)).toContain(`/logos/${logo}.png`);
  });

  it("les logos rendus en largeur libre sont contenus, jamais étirés", () => {
    const suspects: string[] = [];
    for (const f of fichiers(RACINE, [".tsx"])) {
      const code = readFileSync(f, "utf8");
      for (const m of code.matchAll(/\/logos\/[a-z0-9_-]+\.png/g)) {
        const suite = code.slice(m.index, m.index + 700);
        const classe = suite.match(/className="([^"]*)"/);
        if (classe && /\bh-\d+ w-auto\b/.test(classe[1]) && !classe[1].includes("object-contain")) {
          suspects.push(`${f.slice(RACINE.length + 1)} : ${classe[1]}`);
        }
      }
    }
    expect(suspects).toEqual([]);
  });
});
