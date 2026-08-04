import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  PAYS,
  getPays,
  appliquerTarifs,
  appliquerTarifsListe,
  prixApartir,
  prixLabel,
  TYPE_DOCUMENT_LABELS,
  MENTION_VISA_NON_GARANTI,
  type TarifsAssistance,
} from "@/lib/assistance";

describe("appliquerTarifs", () => {
  it("remplace le prix d'une prestation par celui de la base", () => {
    const tarifs: TarifsAssistance = { chine: { bourse_licence: 2_000_000 } };
    const chine = appliquerTarifs(PAYS.chine, tarifs);
    expect(chine.prestations.find((p) => p.key === "bourse_licence")?.prix).toBe(2_000_000);
  });

  it("laisse intactes les prestations absentes de la base", () => {
    const tarifs: TarifsAssistance = { chine: { bourse_licence: 2_000_000 } };
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
    const chine = appliquerTarifs(PAYS.chine, { chine: { bourse_licence: null, bourse_master: null, tourisme: null, affaires: null, foire: null } });
    expect(prixApartir(chine)).toBe("Sur devis");
    expect(prixLabel(chine.prestations[0].prix)).toBe("Sur devis");
  });

  it("ne mute pas la constante d'origine", () => {
    const avant = PAYS.chine.prestations.find((p) => p.key === "bourse_licence")?.prix;
    appliquerTarifs(PAYS.chine, { chine: { bourse_licence: 999 } });
    expect(PAYS.chine.prestations.find((p) => p.key === "bourse_licence")?.prix).toBe(avant);
  });

  it("sans tarifs, getPays retombe sur les constantes", () => {
    expect(getPays("chine")?.prestations.find((p) => p.key === "bourse_licence")?.prix).toBe(1_800_000);
    expect(getPays("chine", {})?.prestations.find((p) => p.key === "bourse_licence")?.prix).toBe(1_800_000);
  });

  it("appliquerTarifsListe traite tous les pays", () => {
    const liste = appliquerTarifsListe(Object.values(PAYS), { grece: { visa: 120_000 } });
    expect(liste.find((p) => p.slug === "grece")?.prestations[0].prix).toBe(120_000);
    expect(liste.find((p) => p.slug === "italie")?.prestations[0].prix).toBeNull();
  });
});

/**
 * Retour de GROUP PHOEBE du 04/08/2026.
 *
 * « En Chine, il y a deux niveaux de bourse : master et licence. Dans la
 * licence, on a les différents documents à fournir ; dans le master, les
 * différents documents à fournir. »
 *
 * Le niveau n'est pas un détail d'affichage : il change les pièces exigées, et
 * c'est précisément ce que le candidat vient vérifier avant de postuler.
 */
describe("Assistance — pièces exigées par prestation", () => {
  const chine = PAYS.chine;
  const pieces = (key: string) =>
    chine.prestations.find((p) => p.key === key)?.pieces ?? [];

  /**
   * Le master valait le prix de la licence tant que GROUP PHOEBE ne l'avait pas
   * communiqué — une hypothèse, signalée comme telle. Elle a été tranchée le
   * 04/08/2026 : deux millions.
   *
   * Le montant est pilotable, mais il doit AUSSI vivre dans les migrations et
   * dans le repli : sinon une base reconstruite repartirait de l'hypothèse.
   */
  it("le master coûte plus cher que la licence", () => {
    const licence = chine.prestations.find((p) => p.key === "bourse_licence");
    const master = chine.prestations.find((p) => p.key === "bourse_master");
    expect(master?.prix).toBe(2_000_000);
    expect(master!.prix!).toBeGreaterThan(licence!.prix!);
  });

  it("le montant du master est aussi corrigé en base", () => {
    const migration = readFileSync(
      join(process.cwd(), "..", "..", "supabase", "migrations", "00086_tarif_bourse_master.sql"),
      "utf8"
    );
    expect(migration).toContain("bourse_master");
    expect(migration).toContain("2000000");
  });

  it("la Chine propose deux niveaux de bourse", () => {
    const bourses = chine.prestations.filter((p) => p.type === "etudes");
    expect(bourses.map((b) => b.key)).toEqual(["bourse_licence", "bourse_master"]);
  });

  // Les six pièces dictées par l'exploitant, mot pour mot.
  it("la licence exige le baccalauréat", () => {
    expect(pieces("bourse_licence")).toEqual([
      "bac", "releve_notes", "photo_identite", "casier_judiciaire", "lettre_motivation", "passeport",
    ]);
  });

  it("le master exige le diplôme de licence à la place du baccalauréat", () => {
    expect(pieces("bourse_master")).toEqual([
      "diplome_licence", "releve_notes", "photo_identite", "casier_judiciaire", "lettre_motivation", "passeport",
    ]);
    expect(pieces("bourse_master")).not.toContain("bac");
  });

  // « Tout ce qui est espace Schengen, c'est passeport et puis photo, c'est
  // tout. » Idem pour les visas courts chinois.
  it.each([
    ["france", "visa"], ["norvege", "visa"], ["italie", "visa"],
    ["portugal", "visa"], ["grece", "visa"],
  ])("%s / %s ne demande que passeport et photo", (pays, key) => {
    const p = PAYS[pays].prestations.find((x) => x.key === key);
    expect(p?.pieces).toEqual(["passeport", "photo_identite"]);
  });

  it.each(["tourisme", "affaires", "foire"])(
    "le visa chinois « %s » ne demande que passeport et photo",
    (key) => {
      expect(pieces(key)).toEqual(["passeport", "photo_identite"]);
    }
  );

  // La foire de Canton : un déplacement commercial court, distinct du visa
  // d'affaires. Tarif non communiqué à ce jour.
  it("la foire de Chine existe et reste sur devis", () => {
    const foire = chine.prestations.find((p) => p.key === "foire");
    expect(foire?.name).toContain("foire");
    expect(foire?.prix).toBeNull();
  });

  // Une prestation sans pièces annoncées enverrait le client postuler à
  // l'aveugle, puis découvrir la liste après coup.
  it("aucune prestation n'est muette sur ses pièces", () => {
    for (const pays of Object.values(PAYS)) {
      for (const p of pays.prestations) {
        expect(p.pieces.length, `${pays.slug}/${p.key}`).toBeGreaterThan(0);
      }
    }
  });

  it("chaque pièce annoncée a un libellé", () => {
    for (const pays of Object.values(PAYS)) {
      for (const p of pays.prestations) {
        for (const piece of p.pieces) {
          expect(TYPE_DOCUMENT_LABELS[piece], `${pays.slug}/${p.key}/${piece}`).toBeTruthy();
        }
      }
    }
  });
});

/**
 * « Dans la condition, il faut dire que nous ne garantissons pas le visa : ce
 * n'est pas nous qui donnons le visa, c'est les ambassades. »
 *
 * Un client qui paie une assistance sans avoir lu cela peut croire qu'il
 * achète le visa lui-même.
 */
describe("Assistance — ce que l'assistance ne garantit pas", () => {
  it("la mention nomme l'ambassade et refuse la garantie", () => {
    expect(MENTION_VISA_NON_GARANTI).toMatch(/ambassade|consulat/i);
    expect(MENTION_VISA_NON_GARANTI).toMatch(/ne garantit pas/i);
  });

  it("elle est affichée là où le client postule", () => {
    const page = readFileSync(
      join(process.cwd(), "src", "app", "(public)", "assistance", "pays", "[slug]", "page-client.tsx"),
      "utf8"
    );
    expect(page).toContain("MENTION_VISA_NON_GARANTI");
    // Le prix ne se lit plus comme un montant ferme : le dossier ne se règle
    // pas en ligne, il s'arrête au rendez-vous.
    expect(page).toContain("À titre indicatif");
    expect(page).toContain("Postuler");
  });
});
