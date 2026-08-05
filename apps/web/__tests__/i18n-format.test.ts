import { describe, it, expect } from "vitest";
import { remplir, pluriel } from "@/lib/i18n/format";

describe("Remplir un modèle", () => {
  it("remplace les trous nommés", () => {
    expect(remplir("Payer {montant}", { montant: "12 000 FCFA" })).toBe(
      "Payer 12 000 FCFA"
    );
  });

  it("remplace toutes les occurrences d'un même trou", () => {
    expect(remplir("{x} et encore {x}", { x: "a" })).toBe("a et encore a");
  });

  /**
   * Un trou sans valeur reste visible plutôt que de disparaître : une phrase
   * amputée passe inaperçue en relecture, `{vehicule}` non.
   */
  it("un trou sans valeur reste apparent", () => {
    expect(remplir("Pour le {vehicule}", {})).toBe("Pour le {vehicule}");
  });

  it("les chiffres sont acceptés comme valeurs", () => {
    expect(remplir("{n} jours", { n: 3 })).toBe("3 jours");
  });
});

describe("Pluriel — la règle vient de la langue", () => {
  const formes = { un: "{n} véhicule", autre: "{n} véhicules" };
  const formesEn = { un: "{n} vehicle", autre: "{n} vehicles" };

  it.each([
    [0, "0 véhicule"],
    [1, "1 véhicule"],
    [2, "2 véhicules"],
  ])("le français met zéro au singulier (%i)", (n, attendu) => {
    expect(pluriel("fr", formes, n)).toBe(attendu);
  });

  /**
   * C'est ici que `n > 1 ? "s" : ""` se trompe : l'anglais écrit
   * « 0 vehicles », pas « 0 vehicle ».
   */
  it.each([
    [0, "0 vehicles"],
    [1, "1 vehicle"],
    [2, "2 vehicles"],
  ])("l'anglais met zéro au pluriel (%i)", (n, attendu) => {
    expect(pluriel("en", formesEn, n)).toBe(attendu);
  });

  it("les deux langues ne donnent pas le même résultat à zéro", () => {
    expect(pluriel("fr", formes, 0)).not.toBe("0 véhicules");
    expect(pluriel("en", formesEn, 0)).not.toBe("0 vehicle");
  });

  it("les valeurs supplémentaires se cumulent avec {n}", () => {
    expect(
      pluriel("fr", { un: "{n} jour à {ville}", autre: "{n} jours à {ville}" }, 3, {
        ville: "Abidjan",
      })
    ).toBe("3 jours à Abidjan");
  });

  // Une langue inconnue ne doit pas jeter : le dictionnaire retombe déjà sur
  // le français, la mise en forme doit suivre le même esprit.
  it("une langue inconnue ne fait pas tomber la page", () => {
    expect(() => pluriel("xx", formes, 2)).not.toThrow();
  });
});
