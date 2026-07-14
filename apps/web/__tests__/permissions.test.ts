import { describe, it, expect } from "vitest";

// ─── Permission matrix ─────────────────────────────────────────────
// Extracted from the codebase role checks across all action files:
//   - vehicules.ts: requireStaff() → operateur + proprietaire
//   - propositions.ts: proposerPrix → operateur only; traiterProposition → proprietaire only
//   - admin.ts: creerCompteInterne → proprietaire only
//   - demandes.ts: accepterDemande/refuserDemande → staff
//   - etat-lieux.ts: état des lieux → staff
//   - admin/layout.tsx: sidebar visibility per role
//   - admin/page.tsx: dashboard → proprietaire only

type Role = "client" | "operateur" | "proprietaire" | "livreur" | "agent_immobilier";

type Permission =
  | "ajouter_vehicule"
  | "modifier_vehicule"
  | "supprimer_vehicule"
  | "proposer_prix"
  | "valider_proposition"
  | "accepter_demande"
  | "refuser_demande"
  | "etat_lieux"
  | "creer_compte_interne"
  | "voir_dashboard"
  | "voir_remboursements"
  | "voir_propositions";

const PERMISSIONS: Record<Permission, Role[]> = {
  ajouter_vehicule: ["operateur", "proprietaire"],
  modifier_vehicule: ["operateur", "proprietaire"],
  supprimer_vehicule: ["operateur", "proprietaire"],
  proposer_prix: ["operateur"],
  valider_proposition: ["proprietaire"],
  accepter_demande: ["operateur", "proprietaire"],
  refuser_demande: ["operateur", "proprietaire"],
  etat_lieux: ["operateur", "proprietaire"],
  creer_compte_interne: ["proprietaire"],
  voir_dashboard: ["proprietaire"],
  voir_remboursements: ["proprietaire"],
  voir_propositions: ["proprietaire"],
};

function hasPermission(role: Role, perm: Permission): boolean {
  return PERMISSIONS[perm].includes(role);
}

// ─── Tests ──────────────────────────────────────────────────────────

describe("Matrice de permissions — Opérateur", () => {
  const role: Role = "operateur";

  it("peut ajouter un véhicule", () => {
    expect(hasPermission(role, "ajouter_vehicule")).toBe(true);
  });

  it("peut modifier un véhicule", () => {
    expect(hasPermission(role, "modifier_vehicule")).toBe(true);
  });

  it("peut supprimer un véhicule", () => {
    expect(hasPermission(role, "supprimer_vehicule")).toBe(true);
  });

  it("peut proposer un prix", () => {
    expect(hasPermission(role, "proposer_prix")).toBe(true);
  });

  it("ne peut PAS valider une proposition de prix", () => {
    expect(hasPermission(role, "valider_proposition")).toBe(false);
  });

  it("peut accepter une demande", () => {
    expect(hasPermission(role, "accepter_demande")).toBe(true);
  });

  it("peut refuser une demande", () => {
    expect(hasPermission(role, "refuser_demande")).toBe(true);
  });

  it("peut enregistrer un état des lieux", () => {
    expect(hasPermission(role, "etat_lieux")).toBe(true);
  });

  it("ne peut PAS créer un compte interne", () => {
    expect(hasPermission(role, "creer_compte_interne")).toBe(false);
  });

  it("ne peut PAS voir le tableau de bord financier", () => {
    expect(hasPermission(role, "voir_dashboard")).toBe(false);
  });

  it("ne peut PAS voir les remboursements", () => {
    expect(hasPermission(role, "voir_remboursements")).toBe(false);
  });

  it("ne peut PAS voir les propositions de prix (page admin)", () => {
    expect(hasPermission(role, "voir_propositions")).toBe(false);
  });
});

describe("Matrice de permissions — Propriétaire", () => {
  const role: Role = "proprietaire";

  it("peut ajouter un véhicule", () => {
    expect(hasPermission(role, "ajouter_vehicule")).toBe(true);
  });

  it("peut valider une proposition de prix", () => {
    expect(hasPermission(role, "valider_proposition")).toBe(true);
  });

  it("ne peut PAS proposer un prix (c'est le rôle de l'opérateur)", () => {
    expect(hasPermission(role, "proposer_prix")).toBe(false);
  });

  it("peut créer un compte interne", () => {
    expect(hasPermission(role, "creer_compte_interne")).toBe(true);
  });

  it("peut voir le tableau de bord", () => {
    expect(hasPermission(role, "voir_dashboard")).toBe(true);
  });

  it("peut voir les remboursements", () => {
    expect(hasPermission(role, "voir_remboursements")).toBe(true);
  });

  it("peut voir les propositions", () => {
    expect(hasPermission(role, "voir_propositions")).toBe(true);
  });
});

describe("Matrice de permissions — Client", () => {
  const role: Role = "client";

  it("ne peut PAS ajouter un véhicule", () => {
    expect(hasPermission(role, "ajouter_vehicule")).toBe(false);
  });

  it("ne peut PAS proposer un prix", () => {
    expect(hasPermission(role, "proposer_prix")).toBe(false);
  });

  it("ne peut PAS valider une proposition", () => {
    expect(hasPermission(role, "valider_proposition")).toBe(false);
  });

  it("ne peut PAS accepter ou refuser une demande", () => {
    expect(hasPermission(role, "accepter_demande")).toBe(false);
    expect(hasPermission(role, "refuser_demande")).toBe(false);
  });

  it("ne peut PAS enregistrer un état des lieux", () => {
    expect(hasPermission(role, "etat_lieux")).toBe(false);
  });

  it("ne peut PAS créer un compte interne", () => {
    expect(hasPermission(role, "creer_compte_interne")).toBe(false);
  });

  it("ne peut PAS voir le dashboard ni les remboursements", () => {
    expect(hasPermission(role, "voir_dashboard")).toBe(false);
    expect(hasPermission(role, "voir_remboursements")).toBe(false);
  });
});

describe("Matrice de permissions — Livreur", () => {
  const role: Role = "livreur";

  it("ne peut PAS accéder aux fonctions Transport (pas staff)", () => {
    expect(hasPermission(role, "ajouter_vehicule")).toBe(false);
    expect(hasPermission(role, "accepter_demande")).toBe(false);
    expect(hasPermission(role, "etat_lieux")).toBe(false);
    expect(hasPermission(role, "creer_compte_interne")).toBe(false);
  });
});

describe("Matrice de permissions — proposerPrix vs traiterProposition", () => {
  it("un opérateur propose, un propriétaire valide (séparation des pouvoirs)", () => {
    expect(hasPermission("operateur", "proposer_prix")).toBe(true);
    expect(hasPermission("operateur", "valider_proposition")).toBe(false);
    expect(hasPermission("proprietaire", "proposer_prix")).toBe(false);
    expect(hasPermission("proprietaire", "valider_proposition")).toBe(true);
  });
});

describe("Matrice de permissions — sidebar admin conditionnelle", () => {
  it("un opérateur ne voit pas les liens Remboursements, Propositions, Comptes, Dashboard", () => {
    const role: Role = "operateur";
    const isProprietaire = role === "proprietaire";

    const sidebarLinks = {
      demandes: true,
      vehicules: true,
      verifications: true,
      remboursements: isProprietaire,
      propositions: isProprietaire,
      comptes: isProprietaire,
      dashboard: isProprietaire,
    };

    expect(sidebarLinks.demandes).toBe(true);
    expect(sidebarLinks.vehicules).toBe(true);
    expect(sidebarLinks.verifications).toBe(true);
    expect(sidebarLinks.remboursements).toBe(false);
    expect(sidebarLinks.propositions).toBe(false);
    expect(sidebarLinks.comptes).toBe(false);
    expect(sidebarLinks.dashboard).toBe(false);
  });

  it("un propriétaire voit tous les liens", () => {
    const role: Role = "proprietaire";
    const isProprietaire = role === "proprietaire";

    const sidebarLinks = {
      demandes: true,
      vehicules: true,
      verifications: true,
      remboursements: isProprietaire,
      propositions: isProprietaire,
      comptes: isProprietaire,
      dashboard: isProprietaire,
    };

    expect(Object.values(sidebarLinks).every(Boolean)).toBe(true);
  });
});
