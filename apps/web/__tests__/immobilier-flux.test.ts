import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  STATUTS_DEMANDE,
  STATUTS_CONTRE_OFFRE_POSSIBLE,
  STATUTS_DEMANDE_OFFRE_ACTIFS,
  formaterCreneau,
  calculerCommission,
  estLocation,
  formaterPeriodeLocation,
} from "@/lib/immobilier";

const src = (p: string) => readFileSync(join(process.cwd(), "src", p), "utf8");

describe("formaterCreneau", () => {
  it("rend la date et l'heure en français", () => {
    const s = formaterCreneau("2026-08-15T14:30:00.000Z");
    expect(s).toContain("15");
    expect(s).toContain("août");
  });

  it("accepte un Date comme une chaîne", () => {
    const d = new Date("2026-08-15T14:30:00.000Z");
    expect(formaterCreneau(d)).toBe(formaterCreneau(d.toISOString()));
  });

  it("ne jette pas sur une date illisible", () => {
    expect(formaterCreneau("pas une date")).toBe("—");
  });
});

describe("cohérence des statuts de demande", () => {
  it("les listes dérivées ne contiennent que des statuts connus", () => {
    for (const liste of [STATUTS_CONTRE_OFFRE_POSSIBLE, STATUTS_DEMANDE_OFFRE_ACTIFS]) {
      for (const statut of liste) {
        expect(STATUTS_DEMANDE).toContain(statut);
      }
    }
  });

  it("une offre naît en offre_soumise, pas en en_attente", () => {
    // Le statut existait sans que rien ne le pose : indistinguable d'une simple
    // demande d'information dans la liste admin.
    const source = src("app/actions/immobilier.ts");
    expect(source).toContain('statut: type === "offre" ? "offre_soumise" : "en_attente"');
  });

  it("la demande hérite de l'agent référent du bien", () => {
    // `visites.agent_id` est NOT NULL : sans cet héritage, il fallait affecter un
    // agent à la main sur chaque demande avant de pouvoir programmer une visite.
    const source = src("app/actions/immobilier.ts");
    expect(source).toContain("agent_id: bien.agent_id");
    // Sur la colonne, pas sur la liste entière : ajouter un champ au select ne
    // doit pas casser un test qui parle de l'héritage de l'agent.
    const selectBien = source.match(/\.from\("biens"\)\s*\n\s*\.select\("([^"]+)"\)/);
    expect(selectBien?.[1]).toContain("agent_id");
  });
});

describe("le cron d'expiration couvre tous les statuts d'attente", () => {
  // Garde-fou contre une classe de bug rencontrée deux fois : ajouter un statut
  // d'attente sans l'ajouter au cron laisse la demande — et le bien — en suspens
  // indéfiniment. Ce test casse si un statut d'attente est ajouté sans le cron.
  const STATUTS_ATTENTE = ["en_attente", "offre_soumise", "en_cours_traitement", "contre_offre"] as const;

  it("les quatre statuts d'attente sont expirés", () => {
    const source = src("lib/payments/expiration-immobilier.ts");
    const debut = source.indexOf('.in("statut"');
    const liste = source.slice(debut, source.indexOf("]", debut));
    for (const statut of STATUTS_ATTENTE) {
      expect(liste).toContain(statut);
    }
  });

  it("visite_programmee est volontairement exclu du cron", () => {
    // Son échéance se juge sur le créneau de la visite, pas sur updated_at :
    // expirer par updated_at annulerait des visites futures légitimes.
    const source = src("lib/payments/expiration-immobilier.ts");
    const debut = source.indexOf('.in("statut"');
    expect(source.slice(debut, source.indexOf("]", debut))).not.toContain("visite_programmee");
  });
});

describe("exclusion du catalogue", () => {
  const source = src("lib/public-cache.ts");

  it("ne masque un bien que sur des frais encaissés", () => {
    expect(source).toContain('STATUTS_VISITE_ENGAGEE = ["en_cours_traitement", "visite_programmee"]');
  });

  it("borne l'exclusion d'une visite programmée par son créneau", () => {
    // Sans borne, un agent oubliant de clôturer la visite retirait le bien du
    // catalogue définitivement.
    expect(source).toContain("GRACE_APRES_CRENEAU_MS");
    expect(source).toContain('.gte("creneau", seuil)');
  });
});

describe("le montant convenu est un fait figé", () => {
  const source = src("app/actions/immobilier.ts");

  it("l'acceptation d'une contre-offre fige le montant", () => {
    // Écrit dans le même UPDATE que le statut : le trigger refuse toute écriture
    // de montant sur une demande DÉJÀ acceptée (comparaison sur OLD.statut).
    expect(source).toContain("montant_convenu: demande.montant_contre_offre");
  });

  it("l'acceptation par l'admin fige le montant, contre-offre ou offre", () => {
    expect(source).toContain("demande.montant_contre_offre ?? demande.montant_offre");
  });

  it("le gel en base s'applique à tous les rôles, service_role compris", () => {
    const migration = readFileSync(
      join(process.cwd(), "..", "..", "supabase", "migrations", "00053_montant_convenu.sql"),
      "utf8"
    );
    // Le gel doit précéder la sortie anticipée sur le rôle : sinon les server
    // actions, qui écrivent en service_role, passeraient outre.
    const posGel = migration.indexOf("old.statut in ('acceptee', 'finalisee')");
    const posSortieRole = migration.indexOf("current_user not in ('anon', 'authenticated')");
    expect(posGel).toBeGreaterThan(-1);
    expect(posSortieRole).toBeGreaterThan(-1);
    expect(posGel).toBeLessThan(posSortieRole);
  });
});

describe("le client est informé de sa visite", () => {
  const source = src("app/actions/immobilier.ts");

  it("la création d'un créneau notifie le client", () => {
    expect(source).toContain("Votre visite est programmée");
  });

  it("la confirmation du créneau notifie le client", () => {
    expect(source).toContain("Votre visite est confirmée");
  });

  it("un créneau passé est refusé", () => {
    expect(source).toContain("Le créneau doit être dans le futur.");
  });
});

describe("commission d'intermédiation", () => {
  it("applique le taux au montant convenu", () => {
    expect(calculerCommission(50_000_000, 10)).toBe(5_000_000);
    expect(calculerCommission(50_000_000, 12)).toBe(6_000_000);
  });

  it("arrondit à l'unité — le FCFA n'a pas de subdivision", () => {
    expect(calculerCommission(333_333, 12)).toBe(40_000);
    expect(Number.isInteger(calculerCommission(1_234_567, 11.5))).toBe(true);
  });

  it("rend 0 sur un taux ou un montant inexploitable", () => {
    for (const [m, t] of [[0, 10], [-1, 10], [1000, 0], [1000, -5], [Number.NaN, 10]] as const) {
      expect(calculerCommission(m, t)).toBe(0);
    }
  });

  it("est figée à l'acceptation, taux compris", () => {
    // Le taux vit dans les paramètres et peut changer : la ligne doit rester
    // lisible après un changement de barème, d'où le taux conservé.
    const source = src("app/actions/immobilier.ts");
    expect(source).toContain("taux_commission: commission.taux");
    expect(source).toContain("montant_commission: commission.montant");
  });
});

describe("location", () => {
  it("distingue location et vente", () => {
    expect(estLocation("location")).toBe(true);
    expect(estLocation("vente")).toBe(false);
  });

  it("formate la période, ou rien si elle est vide", () => {
    expect(formaterPeriodeLocation(null, null)).toBeNull();
    expect(formaterPeriodeLocation("2026-09-01", 12)).toContain("12 mois");
    expect(formaterPeriodeLocation(null, 6)).toBe("6 mois");
  });

  it("exige début et durée sur une offre de location", () => {
    const source = src("app/actions/immobilier.ts");
    expect(source).toContain("Indiquez la durée de location souhaitée");
    expect(source).toContain("Indiquez la date de début de location souhaitée");
  });
});

describe("gardes de l'acceptation", () => {
  const source = src("app/actions/immobilier.ts");

  it("les offres concurrentes du bien sont refusées et notifiées", () => {
    expect(source).toContain("cloturerConcurrentes");
    expect(source).toContain("Votre offre n'a pas été retenue");
  });

  it("un bien déjà pris ne peut pas faire l'objet d'un second accord", () => {
    expect(source).toContain("un accord a été conclu entre-temps");
  });

  it("une seule demande de visite active par client et par bien", () => {
    expect(source).toContain("Vous avez déjà une demande de visite en cours sur ce bien");
  });
});

describe("paiement des frais de visite", () => {
  const source = src("app/actions/immobilier.ts");

  it("accepte Mobile Money comme la carte", () => {
    // CinetPay était importé sans jamais être appelé : les clients sans carte
    // étaient exclus du seul parcours payant du module.
    expect(source).toContain("creerSessionCinetPay");
    expect(source).toContain('["stripe", "cinetpay"].includes(methode)');
  });

  it("refuse un moyen de paiement inconnu", () => {
    expect(source).toContain("Moyen de paiement invalide.");
  });
});
