import { describe, it, expect } from "vitest";
import { computeItemPricing, type ZonePricing } from "@/lib/pricing";

describe("computeItemPricing — tarification véhicule (source unique client/serveur)", () => {
  it("sans zone : prix plat × jours, caution = % du montant, aucun chauffeur", () => {
    const r = computeItemPricing({
      prixJournalier: 50000,
      tauxCaution: 0.3,
      nbJours: 4,
      avecChauffeur: false,
      zone: null,
    });
    expect(r.montantLocation).toBe(200000);
    expect(r.montantChauffeur).toBe(0);
    expect(r.montant).toBe(200000);
    expect(r.caution).toBe(60000); // round(200000 × 0.3)
    expect(r.chauffeurObligatoire).toBe(false);
  });

  it("zone avec coefficient : le prix journalier est majoré avant multiplication", () => {
    const zone: ZonePricing = {
      coefficient_majoration: 1.5,
      tarif_chauffeur_journalier: 0,
      chauffeur_statut: "optionnel",
      caution_multiplicateur: 1,
    };
    const r = computeItemPricing({
      prixJournalier: 50000,
      tauxCaution: 0.3,
      nbJours: 4,
      avecChauffeur: false,
      zone,
    });
    // round(50000 × 1.5) = 75000 ; × 4 = 300000
    expect(r.montantLocation).toBe(300000);
    expect(r.montant).toBe(300000);
    expect(r.caution).toBe(90000); // round(300000 × 0.3)
  });

  it("zone intérieure : chauffeur obligatoire ajouté même sans être coché", () => {
    const zone: ZonePricing = {
      coefficient_majoration: 2,
      tarif_chauffeur_journalier: 15000,
      chauffeur_statut: "obligatoire",
      caution_multiplicateur: 1,
    };
    const r = computeItemPricing({
      prixJournalier: 50000,
      tauxCaution: 0.3,
      nbJours: 3,
      avecChauffeur: false, // non coché, mais imposé par la zone
      zone,
    });
    expect(r.chauffeurObligatoire).toBe(true);
    // location = round(50000×2)×3 = 300000 ; chauffeur = 15000×3 = 45000
    expect(r.montantLocation).toBe(300000);
    expect(r.montantChauffeur).toBe(45000);
    expect(r.montant).toBe(345000);
    // caution basée sur la location seule
    expect(r.caution).toBe(90000);
  });

  it("chauffeur coché mais aucune zone : pas de tarif chauffeur (le tarif vient de la zone)", () => {
    const r = computeItemPricing({
      prixJournalier: 40000,
      tauxCaution: 0.25,
      nbJours: 2,
      avecChauffeur: true,
      zone: null,
    });
    expect(r.montantChauffeur).toBe(0);
    expect(r.montant).toBe(80000);
    expect(r.caution).toBe(20000);
  });
});
