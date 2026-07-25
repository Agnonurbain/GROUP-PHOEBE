import { describe, it, expect } from "vitest";
import {
  computeLivraisonPrix,
  genererNumeroSuivi,
  TARIFS_LIVRAISON,
  ZONES_LIVRAISON,
  MODES_LIVRAISON,
} from "@/lib/livraison";

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
