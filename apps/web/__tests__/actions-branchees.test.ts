import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Toute action serveur doit avoir un appelant.
 *
 * C'est le motif dominant de ce projet : du code écrit et jamais branché — une
 * route PDF appelée de nulle part, une table avec ses policies et zéro ligne de
 * code, un cron sans planification, un drapeau affiché que personne n'écrit.
 * Aucun ne lève d'erreur, c'est ce qui les rend durables.
 *
 * Je m'y suis fait prendre moi-même : `verifierPieceBillet` et
 * `lienPieceBillet` ont été écrites, testées, mergées — et branchées nulle
 * part. Les drapeaux de vérification restaient donc inécrivables, exactement le
 * défaut que la PR prétendait corriger.
 *
 * Ce test liste les exceptions au lieu de les tolérer : une action sans
 * appelant est soit un oubli, soit un choix qu'on écrit ici.
 */

const RACINE = join(process.cwd(), "src");

function fichiers(dossier: string, ext: string[]): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dossier, { withFileTypes: true })) {
    const chemin = join(dossier, e.name);
    if (e.isDirectory()) out.push(...fichiers(chemin, ext));
    else if (ext.some((x) => e.name.endsWith(x))) out.push(chemin);
  }
  return out;
}

/**
 * Actions dont l'absence d'appelant est connue et assumée.
 *
 * Y ajouter une entrée est un aveu : soit la fonctionnalité est inachevée et il
 * faut le dire, soit elle est morte et il faut la retirer. Ce n'est pas une
 * corbeille.
 */
const SANS_APPELANT_CONNUS = new Map<string, string>([
  // Vide, et c'est l'état recherché. Le dernier occupant était l'atelier
  // `propositions_tarifs` : un doublon jamais branché de la proposition de
  // zone, qui marquait « acceptée » sans rien appliquer pour deux de ses
  // quatre types. Supprimé en 00076 plutôt que fini.
]);

describe("Actions serveur — chacune a un appelant", () => {
  const sources = fichiers(RACINE, [".ts", ".tsx"]).map((f) => ({
    chemin: f.slice(RACINE.length + 1),
    code: readFileSync(f, "utf8"),
  }));

  const actions: { nom: string; fichier: string }[] = [];
  for (const { chemin, code } of sources) {
    if (!chemin.startsWith("app/actions/")) continue;
    for (const m of code.matchAll(/^export async function ([a-zA-Z]+)\(/gm)) {
      actions.push({ nom: m[1], fichier: chemin });
    }
  }

  it("il y a bien des actions à vérifier", () => {
    expect(actions.length).toBeGreaterThan(50);
  });

  it("aucune action n'est orpheline en dehors des cas connus", () => {
    const orphelines: string[] = [];

    for (const { nom, fichier } of actions) {
      // Un appel est une occurrence hors de sa propre déclaration.
      const occurrences = sources.reduce((n, s) => {
        const dansCeFichier = [...s.code.matchAll(new RegExp(`\\b${nom}\\b`, "g"))].length;
        const declaration = s.chemin === fichier ? 1 : 0;
        return n + dansCeFichier - declaration;
      }, 0);

      if (occurrences === 0 && !SANS_APPELANT_CONNUS.has(nom)) {
        orphelines.push(`${nom} (${fichier})`);
      }
    }

    expect(orphelines).toEqual([]);
  });

  // Une exception qui n'a plus lieu d'être doit disparaître de la liste, sinon
  // elle couvrirait une future régression sans que personne le sache.
  it("les exceptions déclarées sont encore réellement orphelines", () => {
    const branchees: string[] = [];

    for (const [nom] of SANS_APPELANT_CONNUS) {
      const declaration = actions.find((a) => a.nom === nom);
      if (!declaration) {
        branchees.push(`${nom} n'existe plus`);
        continue;
      }
      const occurrences = sources.reduce((n, s) => {
        const dans = [...s.code.matchAll(new RegExp(`\\b${nom}\\b`, "g"))].length;
        return n + dans - (s.chemin === declaration.fichier ? 1 : 0);
      }, 0);
      if (occurrences > 0) branchees.push(`${nom} a maintenant un appelant`);
    }

    expect(branchees).toEqual([]);
  });
});
