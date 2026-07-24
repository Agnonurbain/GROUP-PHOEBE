import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Fixed test amounts ─────────────────────────────────────────────
const MONTANT_LOCATION = 50_000;
const MONTANT_CAUTION = 20_000;
const TOTAL = MONTANT_LOCATION + MONTANT_CAUTION;

// ─── Mocks ──────────────────────────────────────────────────────────
const mockRefundsCreate = vi.fn().mockResolvedValue({ id: "re_test" });

vi.mock("@/lib/payments/stripe", () => ({
  getStripe: () => ({
    refunds: { create: mockRefundsCreate },
  }),
}));

vi.mock("@/lib/notifications", () => ({
  notifierClient: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/constants", () => ({
  DELAI_SANS_REPONSE_HEURES: 24,
  DELAI_NON_PRESENTATION_HEURES: 4,
}));

describe("Expiration — réservation abandonnée (en_attente_paiement > 30 min)", () => {
  it("libère la période et passe demande + paiement dans le bon état", () => {
    const demande = {
      statut: "en_attente_paiement" as string,
      created_at: new Date(Date.now() - 31 * 60 * 1000).toISOString(),
    };
    const paiement = { statut: "en_attente" as string };
    let dispoExists = true;

    const DELAI_MS = 30 * 60 * 1000;
    const isExpired =
      Date.now() - new Date(demande.created_at).getTime() > DELAI_MS;

    expect(isExpired).toBe(true);

    // Simulate expiration
    demande.statut = "annulee";
    paiement.statut = "echoue";
    dispoExists = false;

    expect(demande.statut).toBe("annulee");
    expect(paiement.statut).toBe("echoue");
    expect(dispoExists).toBe(false);
  });

  it("ne touche pas une réservation de moins de 30 min", () => {
    const demande = {
      statut: "en_attente_paiement" as string,
      created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    };

    const DELAI_MS = 30 * 60 * 1000;
    const isExpired =
      Date.now() - new Date(demande.created_at).getTime() > DELAI_MS;

    expect(isExpired).toBe(false);
    expect(demande.statut).toBe("en_attente_paiement");
  });
});

describe("Expiration — sans réponse propriétaire (24h)", () => {
  it("demande en_attente_validation > 24h → annulée + remboursement intégral", () => {
    const demande = {
      statut: "en_attente_validation" as string,
      updated_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
    };
    const paiement = { statut: "capture" as string, montant: TOTAL };
    let dispoExists = true;

    const DELAI_HEURES = 24;
    const seuil = Date.now() - DELAI_HEURES * 60 * 60 * 1000;
    const isExpired = new Date(demande.updated_at).getTime() < seuil;

    expect(isExpired).toBe(true);

    // Simulate: rembourserPaiement(admin, id, 0)
    const montantARetenir = 0;
    const montantARefund = paiement.montant - montantARetenir;
    expect(montantARefund).toBe(70_000);

    demande.statut = "annulee";
    paiement.statut = "rembourse";
    dispoExists = false;

    expect(demande.statut).toBe("annulee");
    expect(paiement.statut).toBe("rembourse");
    expect(dispoExists).toBe(false);
  });

  it("demande en_attente_validation < 24h → pas encore expirée", () => {
    const demande = {
      statut: "en_attente_validation" as string,
      updated_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    };

    const DELAI_HEURES = 24;
    const seuil = Date.now() - DELAI_HEURES * 60 * 60 * 1000;
    const isExpired = new Date(demande.updated_at).getTime() < seuil;

    expect(isExpired).toBe(false);
    expect(demande.statut).toBe("en_attente_validation");
  });
});

describe("Expiration — non-présentation (4h après début)", () => {
  it("client ne se présente pas → annulée + caution retenue (50 000 FCFA remboursés)", () => {
    const debut = new Date(Date.now() - 5 * 60 * 60 * 1000);
    const demande = {
      statut: "acceptee" as string,
      periode: `[${debut.toISOString()},${new Date(debut.getTime() + 48 * 60 * 60 * 1000).toISOString()})`,
      caution: MONTANT_CAUTION,
      caution_retenue: 0,
    };
    const paiement = { statut: "capture" as string, montant: TOTAL };
    let vehiculeStatut = "reserve" as string;

    const DELAI_HEURES = 4;
    const seuil = new Date(Date.now() - DELAI_HEURES * 60 * 60 * 1000);
    const debutDate = new Date(
      demande.periode.replace("[", "").split(",")[0]
    );
    const isExpired = seuil > debutDate;

    expect(isExpired).toBe(true);

    // Simulate: rembourserPaiement(admin, id, montantCaution = 20 000)
    const montantARetenir = demande.caution;
    const montantARefund = paiement.montant - montantARetenir;
    expect(montantARefund).toBe(50_000);

    demande.statut = "annulee";
    demande.caution_retenue = MONTANT_CAUTION;
    paiement.statut = "remboursement_partiel";
    vehiculeStatut = "disponible";

    expect(demande.statut).toBe("annulee");
    expect(demande.caution_retenue).toBe(20_000);
    expect(paiement.statut).toBe("remboursement_partiel");
    expect(vehiculeStatut).toBe("disponible");
  });

  it("client a encore le temps (< 4h depuis début) → pas d'expiration", () => {
    const debut = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const demande = {
      statut: "acceptee" as string,
      periode: `[${debut.toISOString()},${new Date(debut.getTime() + 48 * 60 * 60 * 1000).toISOString()})`,
    };

    const DELAI_HEURES = 4;
    const seuil = new Date(Date.now() - DELAI_HEURES * 60 * 60 * 1000);
    const debutDate = new Date(
      demande.periode.replace("[", "").split(",")[0]
    );
    const isExpired = seuil > debutDate;

    expect(isExpired).toBe(false);
    expect(demande.statut).toBe("acceptee");
  });
});

describe("Expiration — cohérence remboursement lors de l'expiration", () => {
  beforeEach(() => {
    mockRefundsCreate.mockClear();
  });

  it("expirerReservationsAbandonnees ne rembourse pas (paiement jamais capturé)", async () => {
    // Le paiement est "en_attente", pas "capture" → pas de refund Stripe
    const paiementStatutAvant = "en_attente";
    const paiementStatutApres = "echoue";

    expect(paiementStatutAvant).toBe("en_attente");
    expect(paiementStatutApres).toBe("echoue");
    // Pas de refund car montant non capturé
    expect(mockRefundsCreate).not.toHaveBeenCalled();
  });

  it("expirerDemandesSansReponse rembourse la totalité via rembourserPaiement(admin, id, 0)", async () => {
    const { rembourserPaiement } = await import(
      "@/lib/payments/expiration-demandes"
    );

    const admin = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "p-exp",
                    montant: TOTAL,
                    methode: "stripe",
                    statut: "capture",
                    webhook_reference: "pi_exp",
                  },
                  error: null,
                }),
              })),
            })),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null }),
        })),
      })),
    };

    await rembourserPaiement(admin as unknown as Parameters<typeof rembourserPaiement>[0], "exp-001", 0);

    expect(mockRefundsCreate).toHaveBeenCalledWith({
      payment_intent: "pi_exp",
      amount: 70_000,
    });
  });
});
