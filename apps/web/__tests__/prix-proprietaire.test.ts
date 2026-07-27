import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Garde-fou : toute action qui écrit un montant facturé doit être réservée au
// propriétaire. Un opérateur passe par le workflow de proposition de prix.
// Ce test lit le source — il casse si quelqu'un relâche une garde.

const src = (p: string) => readFileSync(join(process.cwd(), "src", p), "utf8");

function corpsDeFonction(source: string, nom: string): string {
  const debut = source.indexOf(`export async function ${nom}`);
  if (debut === -1) throw new Error(`Fonction introuvable : ${nom}`);
  const suivante = source.indexOf("\nexport ", debut + 1);
  return source.slice(debut, suivante === -1 ? undefined : suivante);
}

describe("les prix ne sont modifiables que par le propriétaire", () => {
  it("ajusterPrixExpedition exige le propriétaire", () => {
    const corps = corpsDeFonction(src("app/actions/livraison.ts"), "ajusterPrixExpedition");
    expect(corps).toContain("requireProprietaire()");
    expect(corps).not.toContain("await requireStaff()");
  });

  it.each([
    "modifierTarifLivraison",
    "modifierPalierPoids",
    "modifierTarifAssistance",
    "modifierParametresContact",
  ])("%s exige le propriétaire", (nom) => {
    const corps = corpsDeFonction(src("app/actions/tarifs.ts"), nom);
    expect(corps).toContain("requireProprietaireAvecId()");
  });

  it("les champs tarifaires du véhicule sont retirés pour un opérateur", () => {
    const source = src("app/actions/vehicules.ts");
    // Le filtre existe et couvre tous les champs monétaires.
    for (const champ of [
      "prix_journalier",
      "prix_mensuel",
      "prix_vente",
      "taux_caution",
      "caution_base_fcfa",
    ]) {
      expect(source).toContain(`"${champ}"`);
    }
    expect(source).toContain("retirerChampsPrix");
    // Création comme modification passent par le filtre.
    expect(source).toContain('role === "proprietaire" ? rows : rows.map(retirerChampsPrix)');
    expect(source).toContain('role === "proprietaire" ? updateData : retirerChampsPrix(updateData)');
  });
});
