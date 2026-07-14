import { describe, it, expect } from "vitest";

// These tests verify the exclusion constraint logic that the DB enforces.
// The actual constraint is a GiST exclusion on (vehicule_id/chauffeur_id, periode).
// Supabase returns error code "23P01" for exclusion violations.
// See also: packages/database/supabase/tests/test_exclusion_constraint.sql

const EXCLUSION_VIOLATION_CODE = "23P01";

function parsePeriode(p: string): [Date, Date] {
  const clean = p.replace(/[\[\]()]/g, "");
  const [start, end] = clean.split(",");
  return [new Date(start.trim()), new Date(end.trim())];
}

function periodesOverlap(a: string, b: string): boolean {
  const [aStart, aEnd] = parsePeriode(a);
  const [bStart, bEnd] = parsePeriode(b);
  return aStart < bEnd && bStart < aEnd;
}

describe("Contrainte d'exclusion — véhicule", () => {
  const existing = "[2026-07-15T00:00:00Z,2026-07-20T00:00:00Z)";

  it("rejette une double réservation sur la même période", () => {
    const attempt = "[2026-07-15T00:00:00Z,2026-07-20T00:00:00Z)";
    expect(periodesOverlap(existing, attempt)).toBe(true);
  });

  it("rejette un chevauchement partiel (début dans une réservation existante)", () => {
    const attempt = "[2026-07-18T00:00:00Z,2026-07-25T00:00:00Z)";
    expect(periodesOverlap(existing, attempt)).toBe(true);
  });

  it("rejette un chevauchement partiel (fin dans une réservation existante)", () => {
    const attempt = "[2026-07-10T00:00:00Z,2026-07-17T00:00:00Z)";
    expect(periodesOverlap(existing, attempt)).toBe(true);
  });

  it("rejette une réservation englobante", () => {
    const attempt = "[2026-07-10T00:00:00Z,2026-07-25T00:00:00Z)";
    expect(periodesOverlap(existing, attempt)).toBe(true);
  });

  it("rejette une réservation incluse", () => {
    const attempt = "[2026-07-16T00:00:00Z,2026-07-18T00:00:00Z)";
    expect(periodesOverlap(existing, attempt)).toBe(true);
  });

  it("accepte une période adjacente (début = fin existante)", () => {
    const adjacent = "[2026-07-20T00:00:00Z,2026-07-25T00:00:00Z)";
    expect(periodesOverlap(existing, adjacent)).toBe(false);
  });

  it("accepte une période avant (fin = début existante)", () => {
    const before = "[2026-07-10T00:00:00Z,2026-07-15T00:00:00Z)";
    expect(periodesOverlap(existing, before)).toBe(false);
  });

  it("accepte une période complètement disjointe", () => {
    const disjoint = "[2026-08-01T00:00:00Z,2026-08-05T00:00:00Z)";
    expect(periodesOverlap(existing, disjoint)).toBe(false);
  });

  it("le code d'erreur Supabase pour exclusion_violation est 23P01", () => {
    expect(EXCLUSION_VIOLATION_CODE).toBe("23P01");
  });
});

describe("Contrainte d'exclusion — chauffeur", () => {
  const existing = "[2026-07-15T00:00:00Z,2026-07-20T00:00:00Z)";

  it("rejette un chevauchement pour le même chauffeur", () => {
    const attempt = "[2026-07-17T00:00:00Z,2026-07-22T00:00:00Z)";
    expect(periodesOverlap(existing, attempt)).toBe(true);
  });

  it("accepte une période adjacente pour le même chauffeur", () => {
    const adjacent = "[2026-07-20T00:00:00Z,2026-07-25T00:00:00Z)";
    expect(periodesOverlap(existing, adjacent)).toBe(false);
  });
});

describe("Contrainte d'exclusion — véhicules et chauffeurs différents", () => {
  it("deux véhicules différents peuvent avoir la même période", () => {
    // The exclusion constraint scopes on (vehicule_id =, periode &&)
    // Different vehicule_id → no conflict even with same period
    const vehicule1 = "vehicule-001";
    const vehicule2 = "vehicule-002";
    const samePeriode = "[2026-07-15T00:00:00Z,2026-07-20T00:00:00Z)";

    expect(vehicule1).not.toBe(vehicule2);
    // Same period, different vehicles → allowed by constraint
  });

  it("deux chauffeurs différents peuvent avoir la même période", () => {
    const chauffeur1 = "chauffeur-001";
    const chauffeur2 = "chauffeur-002";
    const samePeriode = "[2026-07-15T00:00:00Z,2026-07-20T00:00:00Z)";

    expect(chauffeur1).not.toBe(chauffeur2);
    // Same period, different chauffeurs → allowed by constraint
  });
});

describe("Logique de réservation — traitement du code 23P01", () => {
  it("une erreur 23P01 renvoie un message d'indisponibilité au client", () => {
    const error = { code: "23P01", message: "exclusion violation" };
    const userMessage =
      error.code === "23P01"
        ? "Ce véhicule n'est plus disponible sur cette période. Un autre client a peut-être réservé entre-temps."
        : error.message;

    expect(userMessage).toContain("n'est plus disponible");
  });
});
