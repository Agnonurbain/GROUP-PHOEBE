import { describe, it, expect } from "vitest";
import {
  serieParJour,
  cleJour,
  evolution,
} from "@/app/(admin)/admin/_lib/series";

const FIN = new Date(2026, 6, 20, 12, 0, 0); // 20 juillet 2026, midi (local)

describe("cleJour", () => {
  it("utilise la date locale, pas UTC", () => {
    // 23h30 local en été : toISOString() basculerait au lendemain en UTC.
    expect(cleJour(new Date(2026, 6, 20, 23, 30))).toBe("2026-07-20");
    expect(cleJour(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("serieParJour", () => {
  it("produit exactement un point par jour de la période", () => {
    expect(serieParJour([], 7, () => 1, FIN)).toHaveLength(7);
    expect(serieParJour([], 30, () => 1, FIN)).toHaveLength(30);
  });

  it("remplit à zéro les jours sans activité", () => {
    const serie = serieParJour(
      [{ created_at: new Date(2026, 6, 20, 9).toISOString() }],
      3,
      () => 1,
      FIN
    );
    expect(serie.map((p) => p.valeur)).toEqual([0, 0, 1]);
  });

  it("cumule plusieurs lignes du même jour", () => {
    const lignes = [
      { created_at: new Date(2026, 6, 19, 8).toISOString(), montant: 1000 },
      { created_at: new Date(2026, 6, 19, 17).toISOString(), montant: 2500 },
    ];
    const serie = serieParJour(lignes, 3, (l) => l.montant, FIN);
    expect(serie.at(-2)?.valeur).toBe(3500);
  });

  it("ignore une ligne hors période plutôt que d'étirer l'axe", () => {
    const serie = serieParJour(
      [{ created_at: new Date(2020, 0, 1).toISOString() }],
      7,
      () => 1,
      FIN
    );
    expect(serie).toHaveLength(7);
    expect(serie.every((p) => p.valeur === 0)).toBe(true);
  });

  it("tolère null, undefined et une date invalide", () => {
    expect(serieParJour(null, 7, () => 1, FIN)).toHaveLength(7);
    expect(serieParJour(undefined, 7, () => 1, FIN)).toHaveLength(7);
    const serie = serieParJour([{ created_at: "pas-une-date" }], 7, () => 1, FIN);
    expect(serie.every((p) => p.valeur === 0)).toBe(true);
  });

  it("rend les points dans l'ordre chronologique", () => {
    const dates = serieParJour([], 5, () => 1, FIN).map((p) => p.date);
    expect([...dates].sort()).toEqual(dates);
    expect(dates.at(-1)).toBe("2026-07-20");
  });

  it("compte par défaut une unité par ligne", () => {
    const lignes = [
      { created_at: new Date(2026, 6, 20, 1).toISOString() },
      { created_at: new Date(2026, 6, 20, 2).toISOString() },
    ];
    expect(serieParJour(lignes, 2, undefined, FIN).at(-1)?.valeur).toBe(2);
  });
});

describe("evolution", () => {
  it("mesure la progression entre les deux moitiés", () => {
    const serie = [
      { date: "1", label: "1", valeur: 10 },
      { date: "2", label: "2", valeur: 10 },
      { date: "3", label: "3", valeur: 15 },
      { date: "4", label: "4", valeur: 15 },
    ];
    expect(evolution(serie)).toBe(50);
  });

  it("ne renvoie rien quand la base est nulle (pourcentage infini)", () => {
    const serie = [
      { date: "1", label: "1", valeur: 0 },
      { date: "2", label: "2", valeur: 8 },
    ];
    expect(evolution(serie)).toBeNull();
    expect(evolution([])).toBeNull();
  });

  it("rend une valeur négative en cas de baisse", () => {
    const serie = [
      { date: "1", label: "1", valeur: 20 },
      { date: "2", label: "2", valeur: 10 },
    ];
    expect(evolution(serie)).toBe(-50);
  });
});
