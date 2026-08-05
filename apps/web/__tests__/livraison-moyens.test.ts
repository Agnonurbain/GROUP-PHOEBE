import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  computeLivraisonPrixMoyen,
  moyensPossibles,
  type MoyenLivraison,
  type GrilleMoyens,
  type CoefficientsMode,
} from "@/lib/livraison";

/**
 * Le moyen de livraison — le véhicule — remplace le poids dans le prix.
 *
 * « Il y a moto et puis il y a le cargo […] si elle a cliqué sur un cargo, elle
 * aurait 3 types de cargo : petit, moyen, grand. En fonction des types de
 * cargo, il y a aussi les tarifs qui vont avec. »
 *
 * Le moyen et le poids disaient la même chose sous deux formes : on prend un
 * cargo PARCE QUE le colis est lourd. Les garder tous les deux aurait facturé
 * deux fois la même réalité.
 */

const MOYENS: MoyenLivraison[] = [
  { cle: "moto", label: "Moto", famille: "moto", chargeMaxKg: 10, ordre: 1 },
  { cle: "cargo_petit", label: "Cargo petit", famille: "cargo", chargeMaxKg: 500, ordre: 2 },
  { cle: "cargo_moyen", label: "Cargo moyen", famille: "cargo", chargeMaxKg: 1000, ordre: 3 },
  { cle: "cargo_grand", label: "Cargo grand", famille: "cargo", chargeMaxKg: 1700, ordre: 4 },
];

const GRILLE: GrilleMoyens = {
  intracommunale: { moto: 1500, cargo_petit: 6000, cargo_moyen: 10500, cargo_grand: 16500 },
  intercommunale: { moto: 2500, cargo_petit: 10000, cargo_moyen: 17500, cargo_grand: 27500 },
  nationale: { moto: 5000, cargo_petit: 20000, cargo_moyen: 35000, cargo_grand: 55000 },
};

const COEF: CoefficientsMode = {
  standard: 1, express: 1.6, meme_jour: 2.3, programmee: 1.3,
};

describe("Prix d'une livraison — zone × moyen × coefficient de mode", () => {
  it("une moto en standard reprend le tarif de base", () => {
    expect(computeLivraisonPrixMoyen("intracommunale", "moto", "standard", GRILLE, COEF)).toBe(1500);
  });

  it("le mode multiplie, il ne remplace pas", () => {
    expect(computeLivraisonPrixMoyen("intracommunale", "moto", "express", GRILLE, COEF)).toBe(2400);
    expect(computeLivraisonPrixMoyen("intracommunale", "moto", "meme_jour", GRILLE, COEF)).toBe(3500);
  });

  it("un cargo coûte plus cher qu'une moto, à zone et mode égaux", () => {
    const moto = computeLivraisonPrixMoyen("nationale", "moto", "standard", GRILLE, COEF)!;
    const grand = computeLivraisonPrixMoyen("nationale", "cargo_grand", "standard", GRILLE, COEF)!;
    expect(grand).toBeGreaterThan(moto);
  });

  // Le poids ne figure plus dans la signature : c'est la décision, et elle doit
  // se voir dans le code, pas seulement dans un commentaire.
  it("le prix ne dépend plus du poids", () => {
    const a = computeLivraisonPrixMoyen("intercommunale", "cargo_moyen", "standard", GRILLE, COEF);
    const b = computeLivraisonPrixMoyen("intercommunale", "cargo_moyen", "standard", GRILLE, COEF);
    expect(a).toBe(b);
    expect(computeLivraisonPrixMoyen.length).toBe(5);
  });

  it("les prix restent affichables, arrondis à la centaine", () => {
    for (const zone of Object.keys(GRILLE)) {
      for (const m of MOYENS) {
        for (const mode of ["standard", "express", "meme_jour", "programmee"]) {
          const p = computeLivraisonPrixMoyen(zone, m.cle, mode, GRILLE, COEF);
          expect(p! % 100, `${zone}/${m.cle}/${mode}`).toBe(0);
        }
      }
    }
  });

  it("une zone, un moyen ou un mode inconnu ne produit pas de prix", () => {
    expect(computeLivraisonPrixMoyen("lune", "moto", "standard", GRILLE, COEF)).toBeNull();
    expect(computeLivraisonPrixMoyen("nationale", "helicoptere", "standard", GRILLE, COEF)).toBeNull();
    expect(computeLivraisonPrixMoyen("nationale", "moto", "teleportation", GRILLE, COEF)).toBeNull();
  });

  // Un coefficient absent est un réglage manquant, pas une gratuité.
  it("un coefficient manquant facture le tarif de base", () => {
    expect(computeLivraisonPrixMoyen("nationale", "moto", "express", GRILLE, {})).toBe(5000);
  });

  it("un coefficient aberrant ne produit pas de prix", () => {
    expect(computeLivraisonPrixMoyen("nationale", "moto", "express", GRILLE, { express: 0 })).toBeNull();
    expect(computeLivraisonPrixMoyen("nationale", "moto", "express", GRILLE, { express: -2 })).toBeNull();
  });
});

/**
 * Le poids ne fixe plus le prix, mais il écarte les moyens trop justes : sans
 * cela, un client choisirait « moto » pour 40 kg et paierait un prix qui n'a
 * aucun sens.
 */
describe("Moyens proposables selon le poids", () => {
  it("un colis léger peut tout prendre", () => {
    expect(moyensPossibles(3, MOYENS).map((m) => m.cle)).toEqual([
      "moto", "cargo_petit", "cargo_moyen", "cargo_grand",
    ]);
  });

  it("au-delà de la charge d'une moto, la moto disparaît", () => {
    expect(moyensPossibles(40, MOYENS).map((m) => m.cle)).not.toContain("moto");
  });

  it("un colis très lourd ne laisse que le grand cargo", () => {
    expect(moyensPossibles(1500, MOYENS).map((m) => m.cle)).toEqual(["cargo_grand"]);
  });

  // Hors de toute charge utile : la liste est vide, et l'écran doit le dire
  // plutôt que de laisser choisir un moyen incapable de porter le colis.
  it("au-delà de tout, plus aucun moyen", () => {
    expect(moyensPossibles(5000, MOYENS)).toEqual([]);
  });

  it("sans poids saisi, tout reste proposé", () => {
    expect(moyensPossibles(null, MOYENS)).toHaveLength(4);
    expect(moyensPossibles(0, MOYENS)).toHaveLength(4);
  });

  it("l'ordre va du plus léger au plus lourd", () => {
    const melange = [...MOYENS].reverse();
    expect(moyensPossibles(null, melange).map((m) => m.ordre)).toEqual([1, 2, 3, 4]);
  });
});

/**
 * Le branchement : la règle ci-dessus est juste, encore faut-il que le serveur
 * s'en serve et qu'il ne fasse pas confiance au navigateur.
 */
describe("Moyens de livraison — ce que fait le serveur", () => {
  const src = (p: string) => readFileSync(join(process.cwd(), "src", p), "utf8");
  const action = src("app/actions/livraison.ts");

  // On borne à `creerExpedition` : `ajusterPrixExpedition` lit bien un prix du
  // formulaire, mais c'est l'ajustement manuel du propriétaire — une autre
  // fonctionnalité, délibérée et protégée.
  const creation = (() => {
    const d = action.indexOf("export async function creerExpedition");
    const f = action.indexOf("\nexport ", d + 1);
    return action.slice(d, f === -1 ? undefined : f);
  })();

  it("le prix est recalculé côté serveur, jamais reçu du formulaire", () => {
    expect(creation).toContain("computeLivraisonPrixMoyen");
    expect(creation).not.toMatch(/formData\.get\("prix/);
  });

  /**
   * Le navigateur filtre déjà la liste, mais rien n'oblige un formulaire à
   * passer par le navigateur : sans ce contrôle on accepterait une moto pour
   * 40 kg, et le livreur découvrirait le colis sur place.
   */
  it("la charge utile est vérifiée côté serveur", () => {
    expect(action).toContain("poidsKg > moyen.chargeMaxKg");
  });

  it("un moyen retiré du catalogue n'est plus acceptable", () => {
    expect(action).toContain('err("ceMoyenDeLivraisonNEst")');
  });

  it("le moyen est enregistré sur l'expédition", () => {
    expect(action).toContain("moyen: moyen.cle");
  });

  // Le poids ne pilote plus le prix : l'afficher avec un multiplicateur ferait
  // croire le contraire.
  it("le formulaire n'affiche plus le palier de poids comme facteur de prix", () => {
    const form = src("app/(public)/livraison/commander/commander-client.tsx");
    expect(form).not.toContain("palier.multiplicateur");
    expect(form).toContain("moyensPossibles");
  });
});

/**
 * « Ajoute la possibilité de pouvoir ajouter d'autres types de moyens de
 * livraison avec tout ce qui va avec. » La liste doit rester ouverte : un
 * fourgon, un camion, une barque s'ajoutent sans déploiement.
 */
describe("Moyens de livraison — l'atelier du propriétaire", () => {
  const src = (p: string) => readFileSync(join(process.cwd(), "src", p), "utf8");
  const tarifs = src("app/actions/tarifs.ts");
  const corps = (nom: string) => {
    const d = tarifs.indexOf(`export async function ${nom}`);
    expect(d, nom).toBeGreaterThan(-1);
    const suivante = tarifs.indexOf("\nexport ", d + 1);
    return tarifs.slice(d, suivante === -1 ? undefined : suivante);
  };

  it.each([
    "creerMoyenLivraison",
    "modifierMoyenLivraison",
    "basculerMoyenLivraison",
    "modifierCoefficientsMode",
  ])("%s est réservé au propriétaire", (nom) => {
    expect(corps(nom)).toContain("requireProprietaireAvecId()");
  });

  // Un moyen sans tarif s'afficherait au client sans prix, et il faudrait
  // deviner s'il est gratuit ou incomplet.
  it("un moyen ne se crée pas sans ses prix", () => {
    const c = corps("creerMoyenLivraison");
    expect(c).toContain("Indiquez un prix pour la zone");
    // Si les prix échouent, le moyen créé juste avant est retiré.
    expect(c).toContain('from("moyens_livraison").delete()');
  });

  /**
   * Des expéditions passées référencent le moyen : effacer son nom rendrait
   * leur historique illisible. On le retire du catalogue, on ne le supprime
   * pas.
   */
  it("un moyen se retire, il ne se supprime pas", () => {
    const c = corps("basculerMoyenLivraison");
    expect(c).toContain('update({ actif');
    expect(c).not.toContain(".delete()");
  });

  it("retirer le dernier moyen actif est refusé", () => {
    expect(corps("basculerMoyenLivraison")).toContain("dernier moyen actif");
  });

  // La clé référencée par les expéditions ne bouge jamais, seul l'affichage
  // change.
  it("modifier un moyen ne renomme pas sa clé", () => {
    const c = corps("modifierMoyenLivraison");
    expect(c).toMatch(/update\(\{ label, famille, charge_max_kg/);
    expect(c).not.toMatch(/update\([^)]*\bcle:/);
  });

  it("un coefficient nul ou démesuré est refusé", () => {
    expect(corps("modifierCoefficientsMode")).toMatch(/v <= 0 \|\| v > 10/);
  });

  it("l'atelier est branché sur l'écran des tarifs", () => {
    expect(src("app/(admin)/admin/tarifs/page.tsx")).toContain("MoyensLivraisonForm");
  });
});
