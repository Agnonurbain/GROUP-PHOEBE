import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Règle de dépôt : tout champ obligatoire le dit à l'écran.
 *
 * L'attribut `required` fait bloquer le navigateur à l'envoi, mais ne prévient
 * personne avant. L'utilisateur remplit ce qu'il croit utile, envoie, et
 * découvre au refus quels champs il devait renseigner — écran par écran.
 *
 * Ce test balaie tous les `.tsx` et casse dès qu'un champ obligatoire n'est pas
 * marqué. Sans lui, la règle tiendrait le temps de cette passe et se déferait
 * au premier formulaire ajouté.
 */

const RACINE = join(process.cwd(), "src");

function fichiers(dir: string, ext: string[]): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const chemin = join(dir, e.name);
    if (e.isDirectory()) out.push(...fichiers(chemin, ext));
    else if (ext.some((x) => e.name.endsWith(x))) out.push(chemin);
  }
  return out;
}

// `[\s\S]` plutôt que le drapeau `/s` : la cible TypeScript du projet ne
// l'accepte pas.
//
// `PasswordInput` est inclus délibérément : c'est un COMPOSANT, pas une balise
// HTML, donc un balayage limité à `input|select|textarea` le manquait — et le
// mot de passe de la page de connexion est resté sans étoile jusqu'à ce qu'on
// regarde l'écran. Tout composant de saisie ajouté plus tard doit venir ici.
const BALISE = /<(input|select|textarea|PasswordInput)\b((?:[^<>]|\{[^{}]*\})*?)\/?>/g;

/**
 * Un champ obligatoire est marqué si son libellé porte `<Obligatoire />`, ou —
 * pour les cas sans libellé propre (recherche, motif en ligne) — si l'invite
 * elle-même porte l'étoile.
 */
function estMarque(code: string, attrs: string, debut: number): boolean {
  if (/placeholder="[^"]*\*"/.test(attrs)) return true;

  const id = attrs.match(/\bid="([^"]+)"/)?.[1];
  if (id) {
    const label = new RegExp(`<label[^>]*htmlFor="${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*>`).exec(code);
    if (label) {
      const fin = code.indexOf("</label>", label.index);
      if (fin !== -1 && code.slice(label.index, fin).includes("<Obligatoire")) return true;
    }
  }

  // Libellé qui précède, ou libellé englobant : on regarde en amont jusqu'au
  // dernier `<label` ouvert, sans traverser un autre champ.
  const amont = code.slice(Math.max(0, debut - 1500), debut);
  const dernierLabel = amont.lastIndexOf("<label");
  if (dernierLabel !== -1 && amont.slice(dernierLabel).includes("<Obligatoire")) return true;

  // Libellé englobant dont le texte — donc l'étoile — vient APRÈS le champ.
  const aval = code.slice(debut, debut + 1500);
  const finLabel = aval.indexOf("</label>");
  if (finLabel !== -1 && aval.slice(0, finLabel).includes("<Obligatoire")) return true;

  // Groupe de boutons radio : l'étoile est portée par le titre du groupe, pas
  // par chaque option — une option n'est pas obligatoire, le choix l'est.
  if (/type="radio"/.test(attrs) && code.includes("<Obligatoire")) return true;

  return false;
}

describe("Champs obligatoires — chacun le dit à l'écran", () => {
  const sources = fichiers(RACINE, [".tsx"]).map((f) => ({
    chemin: f.slice(RACINE.length + 1),
    code: readFileSync(f, "utf8"),
  }));

  const champs: { fichier: string; attrs: string; marque: boolean }[] = [];
  for (const { chemin, code } of sources) {
    for (const m of code.matchAll(BALISE)) {
      const attrs = m[2];
      if (!/\brequired\b/.test(attrs)) continue;
      if (/type="hidden"/.test(attrs)) continue;
      // `required={expression}` : l'obligation dépend de l'état, le marquer
      // sans condition mentirait la moitié du temps.
      if (/required=\{/.test(attrs)) continue;
      champs.push({ fichier: chemin, attrs, marque: estMarque(code, attrs, m.index) });
    }
  }

  it("il y a bien des champs à vérifier", () => {
    expect(champs.length).toBeGreaterThan(100);
  });

  it("aucun champ obligatoire n'est muet", () => {
    const muets = champs
      .filter((c) => !c.marque)
      .map((c) => `${c.fichier} :: ${c.attrs.replace(/\s+/g, " ").slice(0, 70)}`);
    expect(muets).toEqual([]);
  });

  /**
   * `aria-hidden` sur l'étoile est délibéré : `required` dit déjà « champ
   * obligatoire » aux lecteurs d'écran. Sans lui, ils annonceraient en plus
   * « étoile », un signe de ponctuation lu au milieu du libellé.
   */
  it("l'étoile n'est pas lue deux fois par un lecteur d'écran", () => {
    const marqueur = readFileSync(join(RACINE, "components", "ui", "obligatoire.tsx"), "utf8");
    expect(marqueur).toContain('aria-hidden="true"');
  });

  /**
   * Un composant, pas une chaîne « * » recopiée : c'est ce qui permet de
   * changer la règle partout d'un coup.
   *
   * On ne regarde que l'intérieur des LIBELLÉS : une étoile ailleurs a d'autres
   * usages légitimes — `communes-list.tsx` en emploie une pour signaler une
   * commune ajoutée par un client, et elle n'a rien à voir avec l'obligation.
   */
  it("aucune étoile n'est recopiée à la main dans un libellé", () => {
    const enDur: string[] = [];
    for (const { chemin, code } of sources) {
      for (const m of code.matchAll(/<label\b[\s\S]*?<\/label>/g)) {
        if (/[^\s>]\s*\*\s*(<\/label>|<span|\{)/.test(m[0]) && !m[0].includes("<Obligatoire")) {
          enDur.push(`${chemin} :: ${m[0].replace(/\s+/g, " ").slice(0, 80)}`);
        }
      }
    }
    expect(enDur).toEqual([]);
  });
});
