import { describe, it, expect } from "vitest";
import {
  computeLivraisonPrix,
  genererNumeroSuivi,
  deriverZoneLivraison,
  TARIFS_LIVRAISON,
  ZONES_LIVRAISON,
  MODES_LIVRAISON,
  palierPoids,
  poidsMax,
  POIDS_MAX_KG,
} from "@/lib/livraison";

describe("deriverZoneLivraison", () => {
  const cocody = { id: "c-cocody", zoneId: "z-abidjan" };
  const plateau = { id: "c-plateau", zoneId: "z-abidjan" };
  const bouake = { id: "c-bouake", zoneId: "z-interieur" };

  it("même commune → intracommunale", () => {
    expect(deriverZoneLivraison(cocody, cocody)).toBe("intracommunale");
  });

  it("communes différentes, même zone → intercommunale", () => {
    expect(deriverZoneLivraison(cocody, plateau)).toBe("intercommunale");
  });

  it("zones différentes → nationale", () => {
    expect(deriverZoneLivraison(cocody, bouake)).toBe("nationale");
  });

  it("commune non répertoriée (null) → nationale", () => {
    expect(deriverZoneLivraison(cocody, null)).toBe("nationale");
    expect(deriverZoneLivraison(null, null)).toBe("nationale");
  });
});

describe("computeLivraisonPrix", () => {
  it("retourne le prix de la grille pour chaque combinaison zone × mode", () => {
    for (const zone of ZONES_LIVRAISON) {
      for (const mode of MODES_LIVRAISON) {
        expect(computeLivraisonPrix(zone, mode)).toBe(TARIFS_LIVRAISON[zone][mode]);
      }
    }
  });

  it("retourne null pour une zone ou un mode invalide", () => {
    expect(computeLivraisonPrix("lune", "express")).toBeNull();
    expect(computeLivraisonPrix("abidjan", "teleportation")).toBeNull();
  });

  it("l'express coûte plus cher que le standard sur une même zone", () => {
    for (const zone of ZONES_LIVRAISON) {
      expect(TARIFS_LIVRAISON[zone].express).toBeGreaterThan(TARIFS_LIVRAISON[zone].standard);
    }
  });
});

describe("genererNumeroSuivi", () => {
  it("respecte le format GP-XXXXXXXX (8 caractères sûrs)", () => {
    expect(genererNumeroSuivi()).toMatch(/^GP-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/);
  });

  it("génère des numéros distincts (pas de collision immédiate)", () => {
    const set = new Set(Array.from({ length: 500 }, () => genererNumeroSuivi()));
    expect(set.size).toBe(500);
  });
});

describe("paliers de poids", () => {
  it("le premier palier ne majore pas le tarif de base", () => {
    expect(computeLivraisonPrix("intracommunale", "standard", 3)).toBe(
      TARIFS_LIVRAISON.intracommunale.standard
    );
  });

  it("applique le multiplicateur du palier, arrondi à la centaine", () => {
    // 2500 (intercommunale/standard) × 1,5 = 3750 → 3800
    expect(computeLivraisonPrix("intercommunale", "standard", 12)).toBe(3800);
    // 5000 (nationale/standard) × 2,5 = 12500
    expect(computeLivraisonPrix("nationale", "standard", 40)).toBe(12500);
  });

  it("un colis plus lourd n'est jamais moins cher", () => {
    for (const zone of ZONES_LIVRAISON) {
      for (const mode of MODES_LIVRAISON) {
        const leger = computeLivraisonPrix(zone, mode, 1)!;
        const moyen = computeLivraisonPrix(zone, mode, 10)!;
        const lourd = computeLivraisonPrix(zone, mode, 40)!;
        expect(moyen).toBeGreaterThanOrEqual(leger);
        expect(lourd).toBeGreaterThanOrEqual(moyen);
      }
    }
  });

  it("passe sur devis au-delà du poids maximum", () => {
    expect(computeLivraisonPrix("intracommunale", "standard", POIDS_MAX_KG + 0.1)).toBeNull();
    expect(palierPoids(POIDS_MAX_KG + 1)).toBeNull();
  });

  it("rejette un poids nul ou négatif", () => {
    expect(palierPoids(0)).toBeNull();
    expect(palierPoids(-5)).toBeNull();
    expect(computeLivraisonPrix("intracommunale", "standard", -1)).toBeNull();
  });

  it("sans poids, retourne le tarif de base (« à partir de »)", () => {
    expect(computeLivraisonPrix("nationale", "express")).toBe(
      TARIFS_LIVRAISON.nationale.express
    );
  });
});

describe("grille et paliers pilotés (source base)", () => {
  const grillePerso = {
    intracommunale: { standard: 2000, express: 3000, meme_jour: 4000, programmee: 2500 },
    intercommunale: { standard: 3000, express: 5000, meme_jour: 6000, programmee: 3500 },
    nationale: { standard: 7000, express: 9000, meme_jour: 12000, programmee: 8000 },
  };
  const paliersPerso = [
    { maxKg: 10, multiplicateur: 1, label: "Jusqu'à 10 kg" },
    { maxKg: 30, multiplicateur: 2, label: "10 à 30 kg" },
  ];

  it("utilise la grille fournie plutôt que les constantes de repli", () => {
    expect(computeLivraisonPrix("nationale", "standard", 5, grillePerso, paliersPerso)).toBe(7000);
    // Sans grille fournie, on retombe sur le repli du module.
    expect(computeLivraisonPrix("nationale", "standard", 5)).toBe(
      TARIFS_LIVRAISON.nationale.standard
    );
  });

  it("applique les paliers fournis", () => {
    // 8 kg tombe dans le premier palier personnalisé (≤10 kg) : pas de majoration.
    expect(computeLivraisonPrix("intracommunale", "standard", 8, grillePerso, paliersPerso)).toBe(2000);
    // 20 kg → deuxième palier ×2.
    expect(computeLivraisonPrix("intracommunale", "standard", 20, grillePerso, paliersPerso)).toBe(4000);
  });

  it("le plafond suit le dernier palier configuré", () => {
    expect(poidsMax(paliersPerso)).toBe(30);
    expect(computeLivraisonPrix("intracommunale", "standard", 31, grillePerso, paliersPerso)).toBeNull();
    // Avec les paliers par défaut, 31 kg reste accepté.
    expect(computeLivraisonPrix("intracommunale", "standard", 31)).not.toBeNull();
  });

  it("un tarif absent de la grille ne produit pas un prix fantaisiste", () => {
    const grilleTrouee = { ...grillePerso, nationale: {} } as unknown as typeof grillePerso;
    expect(computeLivraisonPrix("nationale", "standard", 5, grilleTrouee, paliersPerso)).toBeNull();
  });
});
