import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  validerDemandeBillet,
  libelleVoyageurs,
  totalVoyageurs,
  STATUTS_BILLET,
  STATUTS_BILLET_OUVERTS,
  PARAMETRES_BILLET_DEFAUT,
  libelleDelai,
  nbPassagersAttendus,
  type DemandeBilletSaisie,
} from "@/lib/billets";

const src = (p: string) => readFileSync(join(process.cwd(), "src", p), "utf8");

// Date de référence fixe : les tests ne doivent pas dépendre du jour où ils tournent.
const AUJOURDHUI = new Date("2026-07-29T10:00:00.000Z");
const P = PARAMETRES_BILLET_DEFAUT;

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
  certificatFievreJaune: true,
  mineurAutorisationParentale: false,
};

const err = (r: ReturnType<typeof validerDemandeBillet>) =>
  "error" in r ? r.error : "";

/**
 * Accompagnants valides, un par voyageur hors bébés et hors titulaire.
 * Depuis 00079 la validation exige leur passeport : un dossier à trois
 * voyageurs avec deux passeports laisserait un billet impossible à émettre.
 */
const accompagnants = (adultes: number, enfants: number) => [
  ...Array.from({ length: Math.max(0, adultes - 1) }, (_, i) => ({
    nom: `ADULTE ${i + 2}`,
    passeportNumero: `AD${i}0000${i}`,
    passeportExpiration: "2028-01-01",
    type: "adulte" as const,
  })),
  ...Array.from({ length: enfants }, (_, i) => ({
    nom: `ENFANT ${i + 1}`,
    passeportNumero: `EN${i}0000${i}`,
    passeportExpiration: "2028-01-01",
    type: "enfant" as const,
  })),
];

describe("validerDemandeBillet — trajet", () => {
  it("accepte un aller-retour complet", () => {
    expect(validerDemandeBillet(base, P, AUJOURDHUI)).toEqual({ ok: true });
  });

  it("accepte un aller simple sans retour", () => {
    expect(validerDemandeBillet(
      { ...base, typeTrajet: "aller_simple", dateRetour: "" }, P, AUJOURDHUI
    )).toEqual({ ok: true });
  });

  it("refuse un aller-retour sans date de retour", () => {
    expect(err(validerDemandeBillet({ ...base, dateRetour: "" }, P, AUJOURDHUI))).toContain("date de retour");
  });

  it("refuse une date de retour sur un aller simple", () => {
    const r = validerDemandeBillet({ ...base, typeTrajet: "aller_simple" }, P, AUJOURDHUI);
    expect(err(r)).toContain("aller simple");
  });

  it("refuse un retour antérieur au départ", () => {
    expect(err(validerDemandeBillet({ ...base, dateRetour: "2026-11-01" }, P, AUJOURDHUI))).toContain("précéder");
  });

  it("refuse un départ dans le passé", () => {
    expect(err(validerDemandeBillet({ ...base, dateDepart: "2026-01-01", dateRetour: "2026-02-01" }, P, AUJOURDHUI)))
      .toContain("passé");
  });

  it("accepte un départ le jour même", () => {
    expect(validerDemandeBillet(
      { ...base, dateDepart: "2026-07-29", dateRetour: "2026-08-30" }, P, AUJOURDHUI
    )).toEqual({ ok: true });
  });

  it("refuse un départ et une destination identiques", () => {
    const r = validerDemandeBillet({ ...base, destination: "abidjan (abj)" }, P, AUJOURDHUI);
    expect(err(r)).toContain("différents");
  });

  it("refuse un type de trajet ou une classe inconnus", () => {
    expect(err(validerDemandeBillet({ ...base, typeTrajet: "multi" }, P, AUJOURDHUI))).toContain("trajet");
    expect(err(validerDemandeBillet({ ...base, classe: "luxe" }, P, AUJOURDHUI))).toContain("Classe");
  });
});

describe("validerDemandeBillet — voyageurs", () => {
  it("exige au moins un adulte", () => {
    const r = validerDemandeBillet({ ...base, voyageurs: { adultes: 0, enfants: 2, bebes: 0 } }, P, AUJOURDHUI);
    expect(err(r)).toContain("adulte");
  });

  it("refuse plus de bébés que d'adultes — un bébé voyage sur les genoux", () => {
    const r = validerDemandeBillet({ ...base, voyageurs: { adultes: 1, enfants: 0, bebes: 2 } }, P, AUJOURDHUI);
    expect(err(r)).toContain("bébé");
  });

  it("accepte autant de bébés que d'adultes", () => {
    expect(validerDemandeBillet(
      {
        ...base,
        voyageurs: { adultes: 2, enfants: 1, bebes: 2 },
        mineurAutorisationParentale: true,
        passagers: accompagnants(2, 1),
      }, P, AUJOURDHUI
    )).toEqual({ ok: true });
  });

  it("renvoie vers le tarif groupe au-delà de 9 voyageurs", () => {
    const r = validerDemandeBillet({ ...base, voyageurs: { adultes: 9, enfants: 1, bebes: 0 } }, P, AUJOURDHUI);
    expect(err(r)).toContain("groupe");
  });

  it("refuse un compte non entier ou négatif", () => {
    for (const v of [{ adultes: 1.5, enfants: 0, bebes: 0 }, { adultes: 1, enfants: -1, bebes: 0 }]) {
      expect(err(validerDemandeBillet({ ...base, voyageurs: v }, P, AUJOURDHUI))).toContain("invalide");
    }
  });
});

describe("validerDemandeBillet — passeport", () => {
  it("exige nom et numéro", () => {
    expect(err(validerDemandeBillet({ ...base, passeportNom: "  " }, P, AUJOURDHUI))).toContain("nom");
    expect(err(validerDemandeBillet({ ...base, passeportNumero: "" }, P, AUJOURDHUI))).toContain("numéro");
  });

  it("refuse un passeport expiré", () => {
    expect(err(validerDemandeBillet({ ...base, passeportExpiration: "2026-01-01" }, P, AUJOURDHUI))).toContain("expiré");
  });

  it("exige la validité résiduelle après le DÉPART, pas après la demande", () => {
    // Valable aujourd'hui, mais expire 3 mois après un départ en décembre.
    const r = validerDemandeBillet({ ...base, passeportExpiration: "2027-01-15" }, P, AUJOURDHUI);
    expect(err(r)).toContain(`${P.mois_validite_passeport} mois`);
  });

  it("accepte pile la validité minimale", () => {
    // Départ 2026-12-01 + 6 mois = 2027-06-01.
    expect(validerDemandeBillet({ ...base, passeportExpiration: "2027-06-01" }, P, AUJOURDHUI))
      .toEqual({ ok: true });
  });
});

describe("validerDemandeBillet — documents obligatoires", () => {
  it("exige le certificat fièvre jaune", () => {
    expect(err(validerDemandeBillet({ ...base, certificatFievreJaune: false }, P, AUJOURDHUI)))
      .toContain("fièvre jaune");
  });

  it("accepte avec le certificat déclaré", () => {
    expect(validerDemandeBillet({ ...base, certificatFievreJaune: true }, P, AUJOURDHUI))
      .toEqual({ ok: true });
  });

  it("exige l'autorisation parentale quand il y a des enfants", () => {
    const avecEnfants = { ...base, voyageurs: { adultes: 1, enfants: 1, bebes: 0 }, mineurAutorisationParentale: false };
    expect(err(validerDemandeBillet(avecEnfants, P, AUJOURDHUI)))
      .toContain("autorisation parentale");
  });

  it("accepte quand l'autorisation parentale est déclarée pour les enfants", () => {
    const avecEnfants = {
      ...base,
      voyageurs: { adultes: 1, enfants: 1, bebes: 0 },
      mineurAutorisationParentale: true,
      passagers: accompagnants(1, 1),
    };
    expect(validerDemandeBillet(avecEnfants, P, AUJOURDHUI))
      .toEqual({ ok: true });
  });

  it("n'exige pas l'autorisation parentale sans enfants", () => {
    expect(validerDemandeBillet(base, P, AUJOURDHUI))
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

  it("payée est une demande ouverte (en attente d'émission)", () => {
    expect(STATUTS_BILLET_OUVERTS).toContain("payee");
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
    expect(source).toContain('err("passezParLeFormulaireDeDevis")');
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

describe("les règles sont pilotées, pas figées", () => {
  it("le plafond de voyageurs suit le paramètre", () => {
    const strict = { ...P, max_voyageurs: 2 };
    const trois = { ...base, voyageurs: { adultes: 3, enfants: 0, bebes: 0 }, passagers: accompagnants(3, 0) };
    expect(err(validerDemandeBillet(trois, strict, AUJOURDHUI))).toContain("2 voyageurs");
    // Le même dossier passe avec le plafond par défaut.
    expect(validerDemandeBillet(trois, P, AUJOURDHUI)).toEqual({ ok: true });
  });

  it("la validité de passeport exigée suit le paramètre", () => {
    const court = { ...base, passeportExpiration: "2027-01-15" };
    // 6 mois après un départ en décembre : refusé.
    expect(err(validerDemandeBillet(court, P, AUJOURDHUI))).toContain("6 mois");
    // 1 mois exigé : le même passeport passe.
    expect(validerDemandeBillet(court, { ...P, mois_validite_passeport: 1 }, AUJOURDHUI))
      .toEqual({ ok: true });
  });

  it("une validité à 0 désactive l'exigence sans désactiver l'expiration", () => {
    const zero = { ...P, mois_validite_passeport: 0 };
    // Passeport valable mais expirant peu après le départ : accepté.
    expect(validerDemandeBillet({ ...base, passeportExpiration: "2026-12-05" }, zero, AUJOURDHUI))
      .toEqual({ ok: true });
    // Passeport déjà expiré : toujours refusé.
    expect(err(validerDemandeBillet({ ...base, passeportExpiration: "2026-01-01" }, zero, AUJOURDHUI)))
      .toContain("expiré");
  });

  it("libelleDelai parle en heures puis en jours", () => {
    expect(libelleDelai(6)).toBe("sous 6 h");
    expect(libelleDelai(24)).toBe("sous 24 h");
    expect(libelleDelai(48)).toBe("sous 2 jours");
    expect(libelleDelai(72)).toBe("sous 3 jours");
  });

  it("les frais de service sont figés sur la demande", () => {
    // Le barème peut changer : ce qui a été annoncé au client ne doit pas bouger.
    const source = src("app/actions/billets.ts");
    expect(source).toContain("frais_service: params.frais_service");
    expect(source).toContain("validerDemandeBillet(saisie, params)");
  });

  it("modifier les paramètres exige le propriétaire", () => {
    const source = src("app/actions/billets.ts");
    const debut = source.indexOf("export async function modifierParametresBillet");
    const corps = source.slice(debut);
    expect(corps).toContain("requireProprietaireAvecId()");
  });

  it("payer un devis exige le statut devis_envoye", () => {
    const source = src("app/actions/billets.ts");
    const debut = source.indexOf("export async function payerDevisBillet");
    const corps = source.slice(debut, source.indexOf("\nexport ", debut + 1));
    expect(corps).toContain('demande.statut !== "devis_envoye"');
  });

  it("payer un devis vérifie l'expiration", () => {
    const source = src("app/actions/billets.ts");
    expect(source).toContain("devis_valable_jusqu_a");
    expect(source).toContain('err("ceDevisAExpireContactezNous")');
  });
});

/**
 * Le passeport de CHAQUE voyageur, dès la demande (00079).
 *
 * Les accompagnants étaient lus à l'étape du PAIEMENT — `passager_nom_0` et
 * suivants — alors que l'écran de paiement n'envoie que l'identifiant de la
 * demande et la méthode. Toute demande à plus d'un voyageur était donc
 * impayable : le client recevait « Le nom du passager 1 est obligatoire » pour
 * un champ qui ne lui avait jamais été présenté. Une seule personne au dossier
 * passait, ce qui explique que personne ne l'ait signalé.
 */
describe("Passeports des accompagnants", () => {
  it("un dossier à un seul voyageur n'attend aucun accompagnant", () => {
    expect(nbPassagersAttendus({ adultes: 1, enfants: 0, bebes: 0 })).toBe(0);
    expect(validerDemandeBillet(base, P, AUJOURDHUI)).toEqual({ ok: true });
  });

  // Le titulaire de la demande est le voyageur 1 : il ne se compte pas deux fois.
  it("compte les adultes hors titulaire, plus les enfants", () => {
    expect(nbPassagersAttendus({ adultes: 3, enfants: 2, bebes: 0 })).toBe(4);
  });

  // Un bébé voyage sur les genoux d'un adulte : pas de siège, pas de bloc.
  it("n'attend rien pour les bébés de moins de 2 ans", () => {
    expect(nbPassagersAttendus({ adultes: 1, enfants: 0, bebes: 2 })).toBe(0);
  });

  it("refuse un dossier où il manque un passeport", () => {
    const r = validerDemandeBillet(
      { ...base, voyageurs: { adultes: 3, enfants: 0, bebes: 0 }, passagers: accompagnants(2, 0) },
      P, AUJOURDHUI
    );
    expect(err(r)).toContain("2 accompagnants");
  });

  it("refuse un accompagnant sans numéro de passeport", () => {
    const r = validerDemandeBillet(
      {
        ...base,
        voyageurs: { adultes: 2, enfants: 0, bebes: 0 },
        passagers: [{ nom: "DIALLO M", passeportNumero: "  ", passeportExpiration: "2028-01-01", type: "adulte" }],
      },
      P, AUJOURDHUI
    );
    expect(err(r)).toContain("voyageur 2");
  });

  // La règle de validité résiduelle vaut pour tout le monde : c'est le même
  // avion, la même date de départ.
  it("applique aux accompagnants la validité exigée du passeport", () => {
    const r = validerDemandeBillet(
      {
        ...base,
        voyageurs: { adultes: 2, enfants: 0, bebes: 0 },
        passagers: [{ nom: "DIALLO M", passeportNumero: "ZZ999", passeportExpiration: "2027-01-15", type: "adulte" }],
      },
      P, AUJOURDHUI
    );
    expect(err(r)).toContain("6 mois");
    expect(err(r)).toContain("voyageur 2");
  });

  it("refuse un passeport d'accompagnant déjà expiré", () => {
    const r = validerDemandeBillet(
      {
        ...base,
        voyageurs: { adultes: 2, enfants: 0, bebes: 0 },
        passagers: [{ nom: "DIALLO M", passeportNumero: "ZZ999", passeportExpiration: "2026-01-01", type: "adulte" }],
      },
      P, AUJOURDHUI
    );
    expect(err(r)).toContain("expiré");
  });

  // Presque toujours la même ligne saisie deux fois — et la compagnie
  // rejetterait l'émission.
  it("refuse deux voyageurs partageant un numéro de passeport", () => {
    const r = validerDemandeBillet(
      {
        ...base,
        voyageurs: { adultes: 2, enfants: 0, bebes: 0 },
        passagers: [{ nom: "DIALLO M", passeportNumero: "21ab45678", passeportExpiration: "2028-01-01", type: "adulte" }],
      },
      P, AUJOURDHUI
    );
    expect(err(r)).toContain("déjà utilisé");
  });

  it("accepte un dossier complet à quatre voyageurs", () => {
    expect(validerDemandeBillet(
      {
        ...base,
        voyageurs: { adultes: 2, enfants: 2, bebes: 0 },
        mineurAutorisationParentale: true,
        passagers: accompagnants(2, 2),
      }, P, AUJOURDHUI
    )).toEqual({ ok: true });
  });
});

describe("Passeports — ce que fait le dépôt", () => {
  const action = src("app/actions/billets.ts");

  /**
   * Le fichier monte depuis le NAVIGATEUR : une pièce va jusqu'à 10 Mo et un
   * dossier jusqu'à 9 voyageurs, quand une Server Action Next plafonne à 1 Mo.
   * Seul le chemin transite — et un chemin est une chaîne que le client choisit.
   */
  it("un chemin hors du dossier du client est rejeté", () => {
    expect(action).toContain("cheminAutorise");
    expect(action).toMatch(/startsWith\(`billets\/\$\{userId\}\//);
    // Une remontée ferait sortir du préfixe qu'on vient de vérifier.
    expect(action).toContain('chemin.includes("..")');
  });

  it("le paiement ne redemande plus les accompagnants", () => {
    const debut = action.indexOf("export async function payerDevisBillet");
    const corps = action.slice(debut, action.indexOf("\nexport ", debut + 1));
    // On vise la LECTURE, pas la prose : le commentaire qui explique le retrait
    // cite forcément le nom des champs supprimés.
    expect(corps).not.toMatch(/formData\.get\(`passager_/);
    expect(corps).not.toContain('from("passagers_billet")');
  });

  // Neuf insertions séquentielles pouvaient échouer à la sixième et laisser un
  // dossier à moitié peuplé, sans que rien ne le signale.
  it("les accompagnants sont écrits avec la demande, en un seul appel", () => {
    const debut = action.indexOf("export async function creerDemandeBillet");
    const corps = action.slice(debut, action.indexOf("\nexport ", debut + 1));
    expect(corps).toContain('from("passagers_billet").insert');
    // Sans eux le billet ne peut pas être émis : la demande ne doit pas rester.
    expect(corps).toContain('from("demandes_billet").delete()');
  });

  it("le staff peut ouvrir le passeport d'un accompagnant, borné à sa demande", () => {
    const debut = action.indexOf("export async function lienPieceBillet");
    const corps = action.slice(debut);
    expect(corps).toContain('piece.startsWith("passager:")');
    // Sans ce recoupement, un identifiant forgé lirait le passeport d'un
    // dossier auquel on n'a pas accès.
    expect(corps).toContain('.eq("demande_id", demandeId)');
    expect(corps).toContain("createSignedUrl");
  });
});
