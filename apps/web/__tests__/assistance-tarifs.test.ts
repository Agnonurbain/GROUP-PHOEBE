import { describe, it, expect } from "vitest";
import {
  PAYS,
  getPays,
  appliquerTarifs,
  appliquerTarifsListe,
  prixApartir,
  prixLabel,
  type TarifsAssistance,
} from "@/lib/assistance";

describe("appliquerTarifs", () => {
  it("remplace le prix d'une prestation par celui de la base", () => {
    const tarifs: TarifsAssistance = { chine: { etude: 2_000_000 } };
    const chine = appliquerTarifs(PAYS.chine, tarifs);
    expect(chine.prestations.find((p) => p.key === "etude")?.prix).toBe(2_000_000);
  });

  it("laisse intactes les prestations absentes de la base", () => {
    const tarifs: TarifsAssistance = { chine: { etude: 2_000_000 } };
    const chine = appliquerTarifs(PAYS.chine, tarifs);
    const tourisme = chine.prestations.find((p) => p.key === "tourisme");
    expect(tourisme?.prix).toBe(PAYS.chine.prestations.find((p) => p.key === "tourisme")?.prix);
  });

  it("permet de renseigner un prix là où il n'y en avait pas (Europe)", () => {
    expect(PAYS.france.prestations[0].prix).toBeNull();
    const france = appliquerTarifs(PAYS.france, { france: { visa: 250_000 } });
    expect(france.prestations[0].prix).toBe(250_000);
    expect(prixApartir(france)).toContain("250");
  });

  it("permet de repasser un prix en « Sur devis »", () => {
    const chine = appliquerTarifs(PAYS.chine, { chine: { etude: null, tourisme: null, affaires: null } });
    expect(prixApartir(chine)).toBe("Sur devis");
    expect(prixLabel(chine.prestations[0].prix)).toBe("Sur devis");
  });

  it("ne mute pas la constante d'origine", () => {
    const avant = PAYS.chine.prestations.find((p) => p.key === "etude")?.prix;
    appliquerTarifs(PAYS.chine, { chine: { etude: 999 } });
    expect(PAYS.chine.prestations.find((p) => p.key === "etude")?.prix).toBe(avant);
  });

  it("sans tarifs, getPays retombe sur les constantes", () => {
    expect(getPays("chine")?.prestations.find((p) => p.key === "etude")?.prix).toBe(1_800_000);
    expect(getPays("chine", {})?.prestations.find((p) => p.key === "etude")?.prix).toBe(1_800_000);
  });

  it("appliquerTarifsListe traite tous les pays", () => {
    const liste = appliquerTarifsListe(Object.values(PAYS), { grece: { visa: 120_000 } });
    expect(liste.find((p) => p.slug === "grece")?.prestations[0].prix).toBe(120_000);
    expect(liste.find((p) => p.slug === "italie")?.prestations[0].prix).toBeNull();
  });
});
