import { describe, it, expect } from "vitest";

// ─── Logic extracted from annulerParClient (demandes.ts:157-165) ────
// This tests the branching logic that decides WHICH montantARetenir
// to pass to rembourserPaiement, not rembourserPaiement itself.
//
// The code under test:
//   const debut = new Date(demande.periode.replace("[", "").split(",")[0]);
//   const heuresAvantDepart = (debut.getTime() - Date.now()) / (1000 * 60 * 60);
//   if (heuresAvantDepart < 48) {
//     montantCautionRetenu = demande.caution ? Number(demande.caution) : 0;
//   }

const CAUTION = 20_000;

function calculerCautionRetenue(
  periode: string,
  caution: number,
  now: Date
): number {
  const debut = new Date(periode.replace("[", "").split(",")[0]);
  const heuresAvantDepart =
    (debut.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (heuresAvantDepart < 48) {
    return caution;
  }
  return 0;
}

describe("annulerParClient — branchement 48h", () => {
  const depart = new Date("2026-08-10T10:00:00Z");
  const periode = `[${depart.toISOString()},2026-08-12T10:00:00Z)`;

  it("annulation 72h avant le départ → caution NON retenue (0 FCFA)", () => {
    const now = new Date(depart.getTime() - 72 * 60 * 60 * 1000);
    expect(calculerCautionRetenue(periode, CAUTION, now)).toBe(0);
  });

  it("annulation exactement 48h avant le départ → caution NON retenue (0 FCFA)", () => {
    const now = new Date(depart.getTime() - 48 * 60 * 60 * 1000);
    // heuresAvantDepart === 48, condition is < 48, so NOT retained
    expect(calculerCautionRetenue(periode, CAUTION, now)).toBe(0);
  });

  it("annulation 47h59m avant le départ → caution retenue (20 000 FCFA)", () => {
    const now = new Date(depart.getTime() - 47 * 60 * 60 * 1000 - 59 * 60 * 1000);
    expect(calculerCautionRetenue(periode, CAUTION, now)).toBe(20_000);
  });

  it("annulation 24h avant le départ → caution retenue (20 000 FCFA)", () => {
    const now = new Date(depart.getTime() - 24 * 60 * 60 * 1000);
    expect(calculerCautionRetenue(periode, CAUTION, now)).toBe(20_000);
  });

  it("annulation 1h avant le départ → caution retenue (20 000 FCFA)", () => {
    const now = new Date(depart.getTime() - 1 * 60 * 60 * 1000);
    expect(calculerCautionRetenue(periode, CAUTION, now)).toBe(20_000);
  });

  it("annulation après le départ (now > debut) → caution retenue (20 000 FCFA)", () => {
    const now = new Date(depart.getTime() + 2 * 60 * 60 * 1000);
    // heuresAvantDepart is negative → < 48 → caution retained
    expect(calculerCautionRetenue(periode, CAUTION, now)).toBe(20_000);
  });

  it("caution à 0 dans la demande → retenue = 0 même si < 48h", () => {
    const now = new Date(depart.getTime() - 12 * 60 * 60 * 1000);
    expect(calculerCautionRetenue(periode, 0, now)).toBe(0);
  });
});
