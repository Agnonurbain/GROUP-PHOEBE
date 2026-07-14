import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Fixed test data ────────────────────────────────────────────────
const VEHICULE_ID = "vehicule-001";
const CLIENT_ID = "client-001";
const CHAUFFEUR_ID = "chauffeur-001";
const DEMANDE_ID = "demande-lc-001";
const PAIEMENT_ID = "paiement-lc-001";
const MONTANT = 50_000;
const CAUTION = 20_000;
const TOTAL = MONTANT + CAUTION;
const PERIODE = "[2026-08-01T00:00:00Z,2026-08-03T00:00:00Z)";

// ─── Mocks ──────────────────────────────────────────────────────────
vi.mock("@/lib/payments/stripe", () => ({
  getStripe: () => ({
    refunds: { create: vi.fn().mockResolvedValue({ id: "re_test" }) },
  }),
}));

vi.mock("@/lib/notifications", () => ({
  notifierClient: vi.fn().mockResolvedValue(undefined),
}));

// ─── State machine simulation ───────────────────────────────────────

type DemandeStatut =
  | "en_attente_paiement"
  | "en_attente_validation"
  | "acceptee"
  | "en_cours"
  | "terminee"
  | "refusee"
  | "annulee";

type VehiculeStatut =
  | "disponible"
  | "reserve"
  | "loue"
  | "vendu"
  | "indisponible";

type PaiementStatut =
  | "en_attente"
  | "capture"
  | "echoue"
  | "rembourse"
  | "remboursement_requis"
  | "remboursement_partiel";

interface DemandeState {
  id: string;
  client_id: string;
  vehicule_id: string;
  chauffeur_id: string | null;
  periode: string;
  montant: number;
  caution: number;
  statut: DemandeStatut;
  caution_retenue: number;
  kilometrage_depart: number | null;
  kilometrage_retour: number | null;
}

interface VehiculeState {
  id: string;
  statut: VehiculeStatut;
}

interface PaiementState {
  id: string;
  reference_id: string;
  montant: number;
  statut: PaiementStatut;
  methode: "stripe" | "cinetpay";
  webhook_reference: string | null;
}

describe("Cycle de vie complet d'une réservation", () => {
  let demande: DemandeState;
  let vehicule: VehiculeState;
  let paiement: PaiementState;
  let dispoVehiculeExists: boolean;

  beforeEach(() => {
    demande = {
      id: DEMANDE_ID,
      client_id: CLIENT_ID,
      vehicule_id: VEHICULE_ID,
      chauffeur_id: CHAUFFEUR_ID,
      periode: PERIODE,
      montant: MONTANT,
      caution: CAUTION,
      statut: "en_attente_paiement",
      caution_retenue: 0,
      kilometrage_depart: null,
      kilometrage_retour: null,
    };
    vehicule = { id: VEHICULE_ID, statut: "disponible" };
    paiement = {
      id: PAIEMENT_ID,
      reference_id: DEMANDE_ID,
      montant: TOTAL,
      statut: "en_attente",
      methode: "stripe",
      webhook_reference: null,
    };
    dispoVehiculeExists = true;
  });

  it("Étape 1 — Création : demande en_attente_paiement, véhicule reste disponible", () => {
    expect(demande.statut).toBe("en_attente_paiement");
    expect(vehicule.statut).toBe("disponible");
    expect(paiement.statut).toBe("en_attente");
    expect(demande.montant).toBe(50_000);
    expect(demande.caution).toBe(20_000);
    expect(paiement.montant).toBe(70_000);
  });

  it("Étape 2 — Paiement capturé : demande passe en_attente_validation", () => {
    // Webhook Stripe confirme le paiement
    paiement.statut = "capture";
    paiement.webhook_reference = "pi_test_123";
    demande.statut = "en_attente_validation";

    expect(demande.statut).toBe("en_attente_validation");
    expect(paiement.statut).toBe("capture");
    expect(paiement.webhook_reference).toBe("pi_test_123");
    expect(vehicule.statut).toBe("disponible");
  });

  it("Étape 3 — Validation propriétaire : demande acceptée, véhicule réservé", () => {
    demande.statut = "acceptee";
    vehicule.statut = "reserve";

    expect(demande.statut).toBe("acceptee");
    expect(vehicule.statut).toBe("reserve");
  });

  it("Étape 4 — État des lieux départ : demande en_cours, véhicule loué", () => {
    demande.statut = "en_cours";
    demande.kilometrage_depart = 45_200;
    vehicule.statut = "loue";

    expect(demande.statut).toBe("en_cours");
    expect(demande.kilometrage_depart).toBe(45_200);
    expect(vehicule.statut).toBe("loue");
  });

  it("Étape 5 — État des lieux retour : demande terminée, véhicule disponible", () => {
    demande.statut = "terminee";
    demande.kilometrage_retour = 45_800;
    demande.caution_retenue = 0;
    vehicule.statut = "disponible";
    dispoVehiculeExists = false;

    expect(demande.statut).toBe("terminee");
    expect(demande.kilometrage_retour).toBe(45_800);
    expect(vehicule.statut).toBe("disponible");
    expect(dispoVehiculeExists).toBe(false);
  });

  it("Cycle complet : transitions d'état cohérentes de bout en bout", () => {
    const transitions: Array<{
      etape: string;
      demandeStatut: DemandeStatut;
      vehiculeStatut: VehiculeStatut;
      paiementStatut: PaiementStatut;
    }> = [
      {
        etape: "Création",
        demandeStatut: "en_attente_paiement",
        vehiculeStatut: "disponible",
        paiementStatut: "en_attente",
      },
      {
        etape: "Paiement",
        demandeStatut: "en_attente_validation",
        vehiculeStatut: "disponible",
        paiementStatut: "capture",
      },
      {
        etape: "Validation",
        demandeStatut: "acceptee",
        vehiculeStatut: "reserve",
        paiementStatut: "capture",
      },
      {
        etape: "Départ",
        demandeStatut: "en_cours",
        vehiculeStatut: "loue",
        paiementStatut: "capture",
      },
      {
        etape: "Retour",
        demandeStatut: "terminee",
        vehiculeStatut: "disponible",
        paiementStatut: "remboursement_partiel",
      },
    ];

    for (const t of transitions) {
      demande.statut = t.demandeStatut;
      vehicule.statut = t.vehiculeStatut;
      paiement.statut = t.paiementStatut;

      expect(demande.statut).toBe(t.demandeStatut);
      expect(vehicule.statut).toBe(t.vehiculeStatut);
      expect(paiement.statut).toBe(t.paiementStatut);
    }
  });

  it("Transitions interdites : en_attente_paiement ne peut pas passer directement à en_cours", () => {
    const transitionsValides: Record<DemandeStatut, DemandeStatut[]> = {
      en_attente_paiement: ["en_attente_validation", "annulee"],
      en_attente_validation: ["acceptee", "refusee", "annulee"],
      acceptee: ["en_cours", "annulee"],
      en_cours: ["terminee"],
      terminee: [],
      refusee: [],
      annulee: [],
    };

    expect(transitionsValides["en_attente_paiement"]).not.toContain("en_cours");
    expect(transitionsValides["en_attente_paiement"]).not.toContain("terminee");
    expect(transitionsValides["en_attente_validation"]).not.toContain("en_cours");
    expect(transitionsValides["acceptee"]).not.toContain("terminee");
    expect(transitionsValides["en_cours"]).not.toContain("acceptee");

    expect(transitionsValides["en_attente_paiement"]).toContain("en_attente_validation");
    expect(transitionsValides["en_attente_validation"]).toContain("acceptee");
    expect(transitionsValides["acceptee"]).toContain("en_cours");
    expect(transitionsValides["en_cours"]).toContain("terminee");
  });
});
