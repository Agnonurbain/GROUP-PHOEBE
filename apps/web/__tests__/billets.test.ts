import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  validerDemandeBillet,
  libelleVoyageurs,
  totalVoyageurs,
  STATUTS_BILLET,
  STATUTS_BILLET_OUVERTS,
  MOIS_VALIDITE_PASSEPORT_REQUIS,
  type DemandeBilletSaisie,
} from "@/lib/billets";

const src = (p: string) => readFileSync(join(process.cwd(), "src", p), "utf8");

// Date de référence fixe : les tests ne doivent pas dépendre du jour où ils tournent.
const AUJOURDHUI = new Date("2026-07-29T10:00:00.000Z");

const base: DemandeBilletSaisie = {
  typeTrajet: "aller_retour",
  depart: "Abidjan (ABJ)",
  destination: "Paris (CDG)",
  dateDepart: "2026-12-01",
  dateRetour: "2026-12-20",
  classe: "economique",
  voyageurs: { adultes: 1, enfants: 0, bebes: 0 },
  passeportNom: "KONE AWA",
  passeportNumero: "21AB45678",
  passeportExpiration: "2028-01-01",
};

const err = (r: ReturnType<typeof validerDemandeBillet>) =>
  "error" in r ? r.error : "";

describe("validerDemandeBillet — trajet", () => {
  it("accepte un aller-retour complet", () => {
    expect(validerDemandeBillet(base, AUJOURDHUI)).toEqual({ ok: true });
  });

  it("accepte un aller simple sans retour", () => {
    expect(validerDemandeBillet(
      { ...base, typeTrajet: "aller_simple", dateRetour: "" }, AUJOURDHUI
    )).toEqual({ ok: true });
  });

  it("refuse un aller-retour sans date de retour", () => {
    expect(err(validerDemandeBillet({ ...base, dateRetour: "" }, AUJOURDHUI))).toContain("date de retour");
  });

  it("refuse une date de retour sur un aller simple", () => {
    const r = validerDemandeBillet({ ...base, typeTrajet: "aller_simple" }, AUJOURDHUI);
    expect(err(r)).toContain("aller simple");
  });

  it("refuse un retour antérieur au départ", () => {
    expect(err(validerDemandeBillet({ ...base, dateRetour: "2026-11-01" }, AUJOURDHUI))).toContain("précéder");
  });

  it("refuse un départ dans le passé", () => {
    expect(err(validerDemandeBillet({ ...base, dateDepart: "2026-01-01", dateRetour: "2026-02-01" }, AUJOURDHUI)))
      .toContain("passé");
  });

  it("accepte un départ le jour même", () => {
    expect(validerDemandeBillet(
      { ...base, dateDepart: "2026-07-29", dateRetour: "2026-08-30" }, AUJOURDHUI
    )).toEqual({ ok: true });
  });

  it("refuse un départ et une destination identiques", () => {
    const r = validerDemandeBillet({ ...base, destination: "abidjan (abj)" }, AUJOURDHUI);
    expect(err(r)).toContain("différents");
  });

  it("refuse un type de trajet ou une classe inconnus", () => {
    expect(err(validerDemandeBillet({ ...base, typeTrajet: "multi" }, AUJOURDHUI))).toContain("trajet");
    expect(err(validerDemandeBillet({ ...base, classe: "luxe" }, AUJOURDHUI))).toContain("Classe");
  });
});

describe("validerDemandeBillet — voyageurs", () => {
  it("exige au moins un adulte", () => {
    const r = validerDemandeBillet({ ...base, voyageurs: { adultes: 0, enfants: 2, bebes: 0 } }, AUJOURDHUI);
    expect(err(r)).toContain("adulte");
  });

  it("refuse plus de bébés que d'adultes — un bébé voyage sur les genoux", () => {
    const r = validerDemandeBillet({ ...base, voyageurs: { adultes: 1, enfants: 0, bebes: 2 } }, AUJOURDHUI);
    expect(err(r)).toContain("bébé");
  });

  it("accepte autant de bébés que d'adultes", () => {
    expect(validerDemandeBillet(
      { ...base, voyageurs: { adultes: 2, enfants: 1, bebes: 2 } }, AUJOURDHUI
    )).toEqual({ ok: true });
  });

  it("renvoie vers le tarif groupe au-delà de 9 voyageurs", () => {
    const r = validerDemandeBillet({ ...base, voyageurs: { adultes: 9, enfants: 1, bebes: 0 } }, AUJOURDHUI);
    expect(err(r)).toContain("groupe");
  });

  it("refuse un compte non entier ou négatif", () => {
    for (const v of [{ adultes: 1.5, enfants: 0, bebes: 0 }, { adultes: 1, enfants: -1, bebes: 0 }]) {
      expect(err(validerDemandeBillet({ ...base, voyageurs: v }, AUJOURDHUI))).toContain("invalide");
    }
  });
});

describe("validerDemandeBillet — passeport", () => {
  it("exige nom et numéro", () => {
    expect(err(validerDemandeBillet({ ...base, passeportNom: "  " }, AUJOURDHUI))).toContain("nom");
    expect(err(validerDemandeBillet({ ...base, passeportNumero: "" }, AUJOURDHUI))).toContain("numéro");
  });

  it("refuse un passeport expiré", () => {
    expect(err(validerDemandeBillet({ ...base, passeportExpiration: "2026-01-01" }, AUJOURDHUI))).toContain("expiré");
  });

  it("exige la validité résiduelle après le DÉPART, pas après la demande", () => {
    // Valable aujourd'hui, mais expire 3 mois après un départ en décembre.
    const r = validerDemandeBillet({ ...base, passeportExpiration: "2027-01-15" }, AUJOURDHUI);
    expect(err(r)).toContain(`${MOIS_VALIDITE_PASSEPORT_REQUIS} mois`);
  });

  it("accepte pile la validité minimale", () => {
    // Départ 2026-12-01 + 6 mois = 2027-06-01.
    expect(validerDemandeBillet({ ...base, passeportExpiration: "2027-06-01" }, AUJOURDHUI))
      .toEqual({ ok: true });
  });
});

describe("libellés voyageurs", () => {
  it("n'affiche que les tranches présentes", () => {
    expect(libelleVoyageurs({ adultes: 1, enfants: 0, bebes: 0 })).toBe("1 adulte");
    expect(libelleVoyageurs({ adultes: 2, enfants: 1, bebes: 1 })).toBe("2 adultes · 1 enfant · 1 bébé");
  });

  it("compte tout le monde", () => {
    expect(totalVoyageurs({ adultes: 2, enfants: 3, bebes: 1 })).toBe(6);
  });
});

describe("statuts", () => {
  it("les statuts ouverts sont tous des statuts connus", () => {
    for (const s of STATUTS_BILLET_OUVERTS) expect(STATUTS_BILLET).toContain(s);
  });

  it("une demande émise ou annulée n'est plus ouverte", () => {
    for (const s of ["emise", "annulee"]) expect(STATUTS_BILLET_OUVERTS).not.toContain(s);
  });
});

describe("gardes du chiffrage", () => {
  it("le devis exige le propriétaire", () => {
    const source = src("app/actions/billets.ts");
    const debut = source.indexOf("export async function proposerDevisBillet");
    const corps = source.slice(debut, source.indexOf("\nexport ", debut + 1));
    expect(corps).toContain("requireProprietaireAvecId()");
  });

  it("le statut devis_envoye n'est pas atteignable par le sélecteur générique", () => {
    const source = src("app/actions/billets.ts");
    expect(source).toContain('statut === "devis_envoye"');
    expect(source).toContain("Passez par le formulaire de devis");
  });

  it("la garde base sur le montant existe et reste en security invoker", () => {
    const migration = readFileSync(
      join(process.cwd(), "..", "..", "supabase", "migrations", "00055_demandes_billet.sql"),
      "utf8"
    );
    expect(migration).toContain("create trigger garde_montant");
    expect(migration).toContain("current_user not in ('anon', 'authenticated')");
    const debut = migration.indexOf("function public.garde_montant_billet()");
    expect(migration.slice(debut, migration.indexOf("$$;", debut))).not.toContain("security definer");
  });
});
