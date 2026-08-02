import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Toute table lue ou écrite par le code doit être créée par une migration de
 * `supabase/migrations/`.
 *
 * Ça paraît acquis, ça ne l'était pas : `propositions_zones_tarifaires` était
 * utilisée par trois fichiers vivants alors que sa seule définition dormait
 * dans un second dossier de migrations, sous `packages/database/`, figé au
 * 00034 — et qui réutilisait le numéro 00032 pour un tout autre fichier. La
 * table existait en production parce qu'elle y avait été créée à l'époque. Un
 * environnement reconstruit depuis le dossier courant ne l'aurait pas eue, et
 * rien n'aurait prévenu avant l'erreur en production. Ce second dossier a été
 * supprimé depuis ; ce test veille à ce que l'écart ne se recreuse pas.
 *
 * Ce test lit les deux côtés et les compare. Il ne dépend d'aucune base.
 */

const RACINE = join(process.cwd(), "src");
const MIGRATIONS = join(process.cwd(), "..", "..", "supabase", "migrations");

function fichiers(dir: string, ext: string[]): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const chemin = join(dir, e.name);
    if (e.isDirectory()) out.push(...fichiers(chemin, ext));
    else if (ext.some((x) => e.name.endsWith(x))) out.push(chemin);
  }
  return out;
}

describe("Tables — chacune vient d'une migration", () => {
  const sql = readdirSync(MIGRATIONS)
    .filter((f) => f.endsWith(".sql"))
    .map((f) => readFileSync(join(MIGRATIONS, f), "utf8"))
    .join("\n");

  const declarees = new Set<string>();
  const creation =
    /create\s+(?:or\s+replace\s+)?(?:materialized\s+)?(?:table|view)\s+(?:if\s+not\s+exists\s+)?(?:public\.)?([a-z_0-9]+)/gi;
  for (const m of sql.matchAll(creation)) declarees.add(m[1].toLowerCase());

  // Une table supprimée depuis n'est plus utilisable, même si un `create table`
  // subsiste dans une vieille migration.
  const supprimees = new Set<string>();
  for (const m of sql.matchAll(/drop\s+table\s+(?:if\s+exists\s+)?(?:public\.)?([a-z_0-9]+)/gi)) {
    supprimees.add(m[1].toLowerCase());
  }

  const utilisees = new Map<string, string>();
  for (const f of fichiers(RACINE, [".ts", ".tsx"])) {
    const code = readFileSync(f, "utf8");
    for (const m of code.matchAll(/\.from\(\s*"([a-z_0-9]+)"/g)) {
      // `supabase.storage.from("colis")` désigne un bucket, pas une table.
      const avant = code.slice(Math.max(0, m.index - 40), m.index);
      if (avant.includes("storage")) continue;
      if (!utilisees.has(m[1])) utilisees.set(m[1], f.slice(RACINE.length + 1));
    }
  }

  it("il y a bien des tables à vérifier", () => {
    expect(utilisees.size).toBeGreaterThan(30);
    expect(declarees.size).toBeGreaterThan(30);
  });

  it("aucune table utilisée n'est absente des migrations", () => {
    const manquantes = [...utilisees]
      .filter(([t]) => !declarees.has(t))
      .map(([t, f]) => `${t} (utilisée dans ${f})`);
    expect(manquantes).toEqual([]);
  });

  it("aucune table utilisée n'a été supprimée depuis", () => {
    // Une migration peut recréer ce qu'une autre supprime : on ne retient que
    // les tables dont la dernière opération est une suppression.
    const mortes = [...utilisees]
      .filter(([t]) => {
        if (!supprimees.has(t)) return false;
        const dernierDrop = sql.toLowerCase().lastIndexOf(`drop table if exists public.${t};`);
        const derniereCreation = Math.max(
          sql.toLowerCase().lastIndexOf(`create table ${t} `),
          sql.toLowerCase().lastIndexOf(`create table public.${t} `),
          sql.toLowerCase().lastIndexOf(`create table if not exists public.${t} `)
        );
        return dernierDrop > derniereCreation;
      })
      .map(([t, f]) => `${t} (supprimée, encore utilisée dans ${f})`);
    expect(mortes).toEqual([]);
  });
});
