import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  STATUTS_DEMANDE,
  STATUTS_CONTRE_OFFRE_POSSIBLE,
  STATUTS_DEMANDE_OFFRE_ACTIFS,
  formaterCreneau,
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
    expect(source).toContain('.select("type, localisation, statut, agent_id")');
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
