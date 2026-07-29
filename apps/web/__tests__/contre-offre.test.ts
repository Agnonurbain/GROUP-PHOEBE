import { describe, it, expect } from "vitest";
import {
  plancherContreOffre,
  validerContreOffre,
  STATUTS_CONTRE_OFFRE_POSSIBLE,
  STATUTS_DEMANDE_OFFRE_ACTIFS,
  STATUTS_DEMANDE,
} from "@/lib/immobilier";

// Bien à 50 000 000 FCFA, remise maximale 10 % → plancher 45 000 000.
const PRIX = 50_000_000;
const TAUX = 10;

describe("plancherContreOffre", () => {
  it("applique le taux de remise maximal au prix affiché", () => {
    expect(plancherContreOffre(PRIX, TAUX)).toBe(45_000_000);
  });

  it("sans remise autorisée, le plancher est le prix affiché", () => {
    expect(plancherContreOffre(PRIX, 0)).toBe(PRIX);
  });

  it("arrondit vers le haut : le plancher ne doit jamais être franchi par arrondi", () => {
    // 999 × 0,9 = 899,1 → 900, pas 899.
    expect(plancherContreOffre(999, 10)).toBe(900);
  });
});

describe("validerContreOffre", () => {
  const base = { montantOffre: 40_000_000, prixBien: PRIX, tauxMaxReduction: TAUX };

  it("accepte un montant entre l'offre du client et le prix affiché", () => {
    const res = validerContreOffre({ ...base, montant: 47_000_000 });
    expect(res).toEqual({ plancher: 45_000_000 });
  });

  it("accepte le prix affiché lui-même", () => {
    expect(validerContreOffre({ ...base, montant: PRIX })).not.toHaveProperty("error");
  });

  it("accepte exactement le plancher", () => {
    expect(validerContreOffre({ ...base, montant: 45_000_000 })).not.toHaveProperty("error");
  });

  it("refuse un montant sous le plancher de remise", () => {
    const res = validerContreOffre({ ...base, montant: 44_999_999 });
    expect(res).toHaveProperty("error");
    expect((res as { error: string }).error).toContain("10 %");
  });

  it("refuse un montant au-dessus du prix affiché", () => {
    const res = validerContreOffre({ ...base, montant: PRIX + 1 });
    expect((res as { error: string }).error).toContain("prix affiché");
  });

  it("refuse un montant inférieur ou égal à l'offre du client", () => {
    // Contre-offrir moins que ce que le client propose n'a pas de sens :
    // il faut accepter l'offre.
    for (const montant of [40_000_000, 39_000_000]) {
      const res = validerContreOffre({ ...base, montant });
      expect(res).toHaveProperty("error");
    }
  });

  it("refuse un montant nul, négatif ou non numérique", () => {
    for (const montant of [0, -1, Number.NaN]) {
      expect(validerContreOffre({ ...base, montant })).toHaveProperty("error");
    }
  });

  it("renvoie vers l'acceptation quand l'offre atteint déjà le prix affiché", () => {
    const res = validerContreOffre({
      ...base,
      montantOffre: PRIX,
      montant: PRIX,
    });
    expect((res as { error: string }).error).toContain("acceptez-la");
  });
});

describe("statuts du cycle de contre-offre", () => {
  it("contre_offre fait partie des statuts de demande", () => {
    expect(STATUTS_DEMANDE).toContain("contre_offre");
  });

  it("une contre-offre en attente compte dans le quota d'offres du client", () => {
    expect(STATUTS_DEMANDE_OFFRE_ACTIFS).toContain("contre_offre");
  });

  it("on ne contre-offre pas sur une demande close", () => {
    for (const statut of ["acceptee", "refusee", "annulee", "finalisee"]) {
      expect(STATUTS_CONTRE_OFFRE_POSSIBLE).not.toContain(statut);
    }
  });

  it("on peut contre-offrir de nouveau après une première contre-offre", () => {
    expect(STATUTS_CONTRE_OFFRE_POSSIBLE).toContain("contre_offre");
  });
});
