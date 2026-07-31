import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Un statut de paiement ne se réécrit jamais « depuis celui qu'on vient de lire ».
 *
 * La classe de bug, rencontrée sur la livraison : on lit le paiement, on déduit
 * la suite de son statut observé, et on filtre l'UPDATE sur ce même statut. Ça
 * ressemble à une garde de concurrence, mais ça n'en est pas une du point de vue
 * métier — l'opération devient destructrice dès qu'elle est rejouée. Un paiement
 * déjà passé en `remboursement_requis`, n'étant plus en `capture`, était basculé
 * en `echoue` : le remboursement disparaissait de la file, sans bruit, et le
 * client n'était jamais remboursé.
 *
 * La discipline du dépôt est l'inverse et doit le rester : on filtre sur le
 * statut ATTENDU, écrit en clair. `rembourserPaiement` (`.eq("statut",
 * "capture")`), `marquerRembourse` (`.eq("statut", "remboursement_requis")`),
 * l'expiration (`.eq("statut", "en_attente")`) et la capture à la livraison
 * suivent tous cette règle.
 */

const SRC = join(process.cwd(), "src");

function fichiersTs(dossier: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dossier, { withFileTypes: true })) {
    const chemin = join(dossier, e.name);
    if (e.isDirectory()) out.push(...fichiersTs(chemin));
    else if (e.name.endsWith(".ts") || e.name.endsWith(".tsx")) out.push(chemin);
  }
  return out;
}

describe("Paiements — le statut cible ne se déduit jamais du statut lu", () => {
  const sources = fichiersTs(SRC).map((f) => ({
    fichier: f.slice(SRC.length + 1),
    code: readFileSync(f, "utf8"),
  }));

  // `.eq("statut", <variable>)` sur une écriture de paiement : le filtre suit
  // ce qui a été lu au lieu d'exiger un état précis.
  it("aucun filtre de statut ne porte sur une variable", () => {
    const coupables: string[] = [];

    for (const { fichier, code } of sources) {
      // On ne regarde que les blocs qui écrivent un statut de paiement.
      if (!/from\("paiements"\)/.test(code)) continue;

      for (const bloc of code.split('from("paiements")').slice(1)) {
        const portee = bloc.slice(0, 400);
        if (!/update\(\s*\{\s*statut/.test(portee)) continue;

        // Attendu : .eq("statut", "capture") — une chaîne littérale.
        const filtres = [...portee.matchAll(/\.eq\(\s*"statut"\s*,\s*([^)]+)\)/g)];
        for (const [, argument] of filtres) {
          if (!/^["']/.test(argument.trim())) {
            coupables.push(`${fichier} → .eq("statut", ${argument.trim()})`);
          }
        }
      }
    }

    expect(coupables).toEqual([]);
  });

  // Corollaire : le statut écrit ne doit pas être choisi par un ternaire dont la
  // condition porte sur le statut lu — c'est la même déduction, côté valeur.
  it("aucune écriture ne calcule sa cible depuis le statut lu", () => {
    const coupables: string[] = [];

    for (const { fichier, code } of sources) {
      if (!/from\("paiements"\)/.test(code)) continue;

      for (const bloc of code.split('from("paiements")').slice(1)) {
        const portee = bloc.slice(0, 400);
        const m = portee.match(/update\(\s*\{\s*statut:\s*([^,}]+)/);
        if (!m) continue;
        const valeur = m[1].trim();
        // Une constante littérale, ou une variable décidée en amont — mais
        // jamais une comparaison inline sur le statut courant.
        if (/paiement\??\.statut/.test(valeur)) {
          coupables.push(`${fichier} → statut: ${valeur}`);
        }
      }
    }

    expect(coupables).toEqual([]);
  });
});
