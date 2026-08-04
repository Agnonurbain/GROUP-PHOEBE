import { describe, it, expect } from "vitest";
import { deriverZoneLivraison, genererNumeroSuivi } from "@/lib/livraison";

/**
 * Zone et numéro de suivi.
 *
 * La TARIFICATION n'est plus testée ici : depuis 00084 le prix se lit
 * `tarif(zone × moyen) × coefficient(mode)`, et ses règles vivent dans
 * `livraison-moyens.test.ts`. La grille zone × mode et les paliers de poids
 * qu'éprouvait ce fichier n'existent plus.
 */

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

describe("genererNumeroSuivi", () => {
  it("respecte le format GP-XXXXXXXX (8 caractères sûrs)", () => {
    expect(genererNumeroSuivi()).toMatch(/^GP-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/);
  });

  it("génère des numéros distincts (pas de collision immédiate)", () => {
    const set = new Set(Array.from({ length: 500 }, () => genererNumeroSuivi()));
    expect(set.size).toBe(500);
  });
});

