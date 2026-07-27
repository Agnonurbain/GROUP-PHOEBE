import { describe, it, expect } from "vitest";
import {
  nettoyerTelephone,
  normaliserTelephone,
  validerTelephone,
  PHONE_PATTERN,
  PHONE_PLACEHOLDER,
} from "@/lib/telephone";

describe("normaliserTelephone", () => {
  it("ramène toutes les écritures d'un même numéro à une seule forme", () => {
    // Le cœur du bug : ces cinq saisies désignent le même abonné. Sans
    // normalisation, Supabase y voyait cinq identités différentes.
    const formes = [
      "+2250700000000",
      "+225 07 00 00 00 00",
      "+225-07-00-00-00-00",
      "+225 (07) 00.00.00.00",
      "  +225 07 00 00 00 00  ",
    ];
    const normalisees = new Set(formes.map((f) => normaliserTelephone(f)));
    expect(normalisees.size).toBe(1);
    expect([...normalisees][0]).toBe("+2250700000000");
  });

  it("rejette un numéro invalide", () => {
    expect(normaliserTelephone("0700000000")).toBeNull(); // sans indicatif
    expect(normaliserTelephone("+0700000000")).toBeNull(); // indicatif à 0
    expect(normaliserTelephone("+225")).toBeNull(); // trop court
    expect(normaliserTelephone("")).toBeNull();
    expect(normaliserTelephone("pas un numéro")).toBeNull();
  });

  it("accepte l'international, pas seulement la Côte d'Ivoire", () => {
    expect(normaliserTelephone("+33 6 12 34 56 78")).toBe("+33612345678");
  });
});

describe("validerTelephone", () => {
  it("accepte les séparateurs affichés par le placeholder", () => {
    // Régression : le placeholder montrait des espaces que le pattern refusait.
    expect(validerTelephone(PHONE_PLACEHOLDER.replace(/X/g, "0"))).toBeNull();
    expect(validerTelephone("+225 07 00 00 00 00")).toBeNull();
  });

  it("explique quoi corriger", () => {
    expect(validerTelephone("0700000000")).toMatch(/indicatif/i);
    expect(validerTelephone("+22507")).toMatch(/format/i);
  });

  it("ne prétend plus que seul +225 est accepté", () => {
    const message = validerTelephone("0700000000") ?? "";
    expect(message).not.toMatch(/doit commencer par \+225 \(/);
  });
});

describe("PHONE_PATTERN (attribut HTML des champs)", () => {
  const regex = new RegExp(`^${PHONE_PATTERN}$`);

  it("accepte ce que le serveur accepte", () => {
    for (const v of ["+2250700000000", "+225 07 00 00 00 00", "+33 6 12 34 56 78"]) {
      expect(regex.test(v), v).toBe(true);
      expect(normaliserTelephone(v), v).not.toBeNull();
    }
  });

  it("refuse ce que le serveur refuse", () => {
    for (const v of ["0700000000", "+0700000000", "abc"]) {
      expect(regex.test(v), v).toBe(false);
    }
  });

  it("le placeholder respecte lui-même le pattern", () => {
    expect(regex.test(PHONE_PLACEHOLDER)).toBe(true);
  });
});

describe("nettoyerTelephone", () => {
  it("laisse intact un numéro déjà compact", () => {
    expect(nettoyerTelephone("+2250700000000")).toBe("+2250700000000");
  });
});
