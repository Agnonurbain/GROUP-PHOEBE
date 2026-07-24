import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Fixed test amounts ─────────────────────────────────────────────
const MONTANT_LOCATION = 50_000; // 50 000 FCFA
const MONTANT_CAUTION = 20_000; // 20 000 FCFA
const TOTAL_PAIEMENT = MONTANT_LOCATION + MONTANT_CAUTION; // 70 000 FCFA
const DOMMAGE_PARTIEL = 8_000; // 8 000 FCFA retenus sur caution

// ─── Stripe mock ─────────────────────────────────────────────────────
const mockRefundsCreate = vi.fn().mockResolvedValue({ id: "re_test" });

vi.mock("@/lib/payments/stripe", () => ({
  getStripe: () => ({
    refunds: { create: mockRefundsCreate },
  }),
}));

vi.mock("@/lib/notifications", () => ({
  notifierClient: vi.fn().mockResolvedValue(undefined),
}));

// ─── rembourserPaiement under test ──────────────────────────────────
// Import AFTER mocks are set up
const { rembourserPaiement } = await import(
  "@/lib/payments/expiration-demandes"
);

type AdminClient = Parameters<typeof rembourserPaiement>[0];

// ─── Helper: build a mock admin client ──────────────────────────────
function buildAdmin(paiementMontant: number, methode: "stripe" | "cinetpay" = "stripe") {
  const updates: Array<{ statut: string }> = [];

  const admin = {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: "paiement-001",
                  montant: paiementMontant,
                  methode,
                  statut: "capture",
                  webhook_reference: methode === "stripe" ? "pi_test_123" : null,
                },
                error: null,
              }),
            })),
          })),
        })),
      })),
      update: vi.fn((vals: Record<string, unknown>) => {
        updates.push({ statut: vals.statut as string });
        return { eq: vi.fn().mockResolvedValue({ error: null }) };
      }),
    })),
    _updates: updates,
  };

  return admin;
}

function buildAdminNoPaiement() {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            })),
          })),
        })),
      })),
    })),
    _updates: [] as Array<{ statut: string }>,
  };
}

// ─── Tests ──────────────────────────────────────────────────────────

describe("Remboursement — 8 cas avec montants exacts en FCFA", () => {
  beforeEach(() => {
    mockRefundsCreate.mockClear();
  });

  // ────────────────────────────────────────────────────────────
  // Cas 1 : Refus du propriétaire → remboursement intégral
  // Le propriétaire refuse la demande. Le client récupère tout.
  // rembourserPaiement(admin, id, 0)
  // ────────────────────────────────────────────────────────────
  it("Cas 1 — Refus propriétaire : remboursement intégral de 70 000 FCFA", async () => {
    const admin = buildAdmin(TOTAL_PAIEMENT);

    await rembourserPaiement(admin as unknown as AdminClient, "demande-001", 0);

    expect(mockRefundsCreate).toHaveBeenCalledOnce();
    expect(mockRefundsCreate).toHaveBeenCalledWith({
      payment_intent: "pi_test_123",
      amount: 70_000,
    });
    expect(admin._updates[0].statut).toBe("rembourse");
  });

  // ────────────────────────────────────────────────────────────
  // Cas 2 : Sans réponse 24h → remboursement intégral
  // Le propriétaire ne répond pas dans les 24h.
  // rembourserPaiement(admin, id, 0)
  // ────────────────────────────────────────────────────────────
  it("Cas 2 — Sans réponse 24h : remboursement intégral de 70 000 FCFA", async () => {
    const admin = buildAdmin(TOTAL_PAIEMENT);

    await rembourserPaiement(admin as unknown as AdminClient, "demande-002", 0);

    expect(mockRefundsCreate).toHaveBeenCalledOnce();
    expect(mockRefundsCreate).toHaveBeenCalledWith({
      payment_intent: "pi_test_123",
      amount: 70_000,
    });
    expect(admin._updates[0].statut).toBe("rembourse");
  });

  // ────────────────────────────────────────────────────────────
  // Cas 3 : Annulation client ≥ 48h → remboursement intégral
  // Le client annule plus de 48h avant le départ.
  // rembourserPaiement(admin, id, 0)
  // ────────────────────────────────────────────────────────────
  it("Cas 3 — Annulation ≥ 48h avant départ : remboursement intégral de 70 000 FCFA", async () => {
    const admin = buildAdmin(TOTAL_PAIEMENT);

    await rembourserPaiement(admin as unknown as AdminClient, "demande-003", 0);

    expect(mockRefundsCreate).toHaveBeenCalledOnce();
    expect(mockRefundsCreate).toHaveBeenCalledWith({
      payment_intent: "pi_test_123",
      amount: 70_000,
    });
    expect(admin._updates[0].statut).toBe("rembourse");
  });

  // ────────────────────────────────────────────────────────────
  // Cas 4 : Annulation client < 48h → caution retenue
  // Le client annule moins de 48h avant le départ.
  // Caution retenue (20 000), location remboursée (50 000).
  // rembourserPaiement(admin, id, 20 000)
  // ────────────────────────────────────────────────────────────
  it("Cas 4 — Annulation < 48h : caution retenue, remboursement de 50 000 FCFA", async () => {
    const admin = buildAdmin(TOTAL_PAIEMENT);

    await rembourserPaiement(admin as unknown as AdminClient, "demande-004", MONTANT_CAUTION);

    expect(mockRefundsCreate).toHaveBeenCalledOnce();
    expect(mockRefundsCreate).toHaveBeenCalledWith({
      payment_intent: "pi_test_123",
      amount: 50_000,
    });
    expect(admin._updates[0].statut).toBe("remboursement_partiel");
  });

  // ────────────────────────────────────────────────────────────
  // Cas 5 : Non-présentation → caution retenue
  // Le client ne se présente pas au retrait du véhicule.
  // Location remboursée (50 000), caution retenue (20 000).
  // rembourserPaiement(admin, id, 20 000)
  // ────────────────────────────────────────────────────────────
  it("Cas 5 — Non-présentation : caution retenue, remboursement de 50 000 FCFA", async () => {
    const admin = buildAdmin(TOTAL_PAIEMENT);

    await rembourserPaiement(admin as unknown as AdminClient, "demande-005", MONTANT_CAUTION);

    expect(mockRefundsCreate).toHaveBeenCalledOnce();
    expect(mockRefundsCreate).toHaveBeenCalledWith({
      payment_intent: "pi_test_123",
      amount: 50_000,
    });
    expect(admin._updates[0].statut).toBe("remboursement_partiel");
  });

  // ────────────────────────────────────────────────────────────
  // Cas 6 : État des lieux retour — 0 dommage → caution intégralement rendue
  // Location terminée normalement, aucun dommage.
  // Le propriétaire garde la location (50 000), le client récupère la caution (20 000).
  // rembourserPaiement(admin, id, 50 000 + 0) = rembourserPaiement(admin, id, 50 000)
  // ────────────────────────────────────────────────────────────
  it("Cas 6 — État des lieux 0 dommage : remboursement caution intégrale de 20 000 FCFA", async () => {
    const admin = buildAdmin(TOTAL_PAIEMENT);
    const cautionRetenue = 0;

    await rembourserPaiement(
      admin as unknown as AdminClient,
      "demande-006",
      MONTANT_LOCATION + cautionRetenue
    );

    expect(mockRefundsCreate).toHaveBeenCalledOnce();
    expect(mockRefundsCreate).toHaveBeenCalledWith({
      payment_intent: "pi_test_123",
      amount: 20_000,
    });
    expect(admin._updates[0].statut).toBe("remboursement_partiel");
  });

  // ────────────────────────────────────────────────────────────
  // Cas 7 : État des lieux retour — dommage partiel (8 000 FCFA)
  // Location terminée, dommage partiel.
  // Le propriétaire garde la location (50 000) + 8 000 de caution retenue.
  // Le client récupère 20 000 - 8 000 = 12 000 FCFA.
  // rembourserPaiement(admin, id, 50 000 + 8 000) = rembourserPaiement(admin, id, 58 000)
  // ────────────────────────────────────────────────────────────
  it("Cas 7 — État des lieux dommage partiel : remboursement de 12 000 FCFA", async () => {
    const admin = buildAdmin(TOTAL_PAIEMENT);

    await rembourserPaiement(
      admin as unknown as AdminClient,
      "demande-007",
      MONTANT_LOCATION + DOMMAGE_PARTIEL
    );

    expect(mockRefundsCreate).toHaveBeenCalledOnce();
    expect(mockRefundsCreate).toHaveBeenCalledWith({
      payment_intent: "pi_test_123",
      amount: 12_000,
    });
    expect(admin._updates[0].statut).toBe("remboursement_partiel");
  });

  // ────────────────────────────────────────────────────────────
  // Cas 8 : État des lieux retour — caution pleine retenue
  // Location terminée, dommages importants.
  // Le propriétaire garde location (50 000) + caution pleine (20 000) = 70 000.
  // Le client ne récupère rien : 70 000 - 70 000 = 0.
  // rembourserPaiement(admin, id, 70 000)
  // ────────────────────────────────────────────────────────────
  it("Cas 8 — État des lieux caution pleine retenue : aucun remboursement (0 FCFA)", async () => {
    const admin = buildAdmin(TOTAL_PAIEMENT);

    await rembourserPaiement(
      admin as unknown as AdminClient,
      "demande-008",
      MONTANT_LOCATION + MONTANT_CAUTION
    );

    // montantARefund = 70 000 - 70 000 = 0 → early return, pas d'appel Stripe
    expect(mockRefundsCreate).not.toHaveBeenCalled();
    // Pas de mise à jour du statut non plus
    expect(admin._updates).toHaveLength(0);
  });
});

// ─── Tests complémentaires ─────────────────────────────────────────

describe("Remboursement — cas limites et CinetPay", () => {
  beforeEach(() => {
    mockRefundsCreate.mockClear();
  });

  it("CinetPay : passe en remboursement_requis (remboursement manuel)", async () => {
    const admin = buildAdmin(TOTAL_PAIEMENT, "cinetpay");

    await rembourserPaiement(admin as unknown as AdminClient, "demande-cp", 0);

    expect(mockRefundsCreate).not.toHaveBeenCalled();
    expect(admin._updates[0].statut).toBe("remboursement_requis");
  });

  it("Stripe échoue : passe en remboursement_requis", async () => {
    mockRefundsCreate.mockRejectedValueOnce(new Error("Stripe error"));
    const admin = buildAdmin(TOTAL_PAIEMENT);

    await rembourserPaiement(admin as unknown as AdminClient, "demande-err", 0);

    expect(mockRefundsCreate).toHaveBeenCalledOnce();
    expect(admin._updates[0].statut).toBe("remboursement_requis");
  });

  it("Pas de paiement capturé : ne fait rien", async () => {
    const admin = buildAdminNoPaiement();

    await rembourserPaiement(admin as unknown as AdminClient, "demande-none", 0);

    expect(mockRefundsCreate).not.toHaveBeenCalled();
    expect(admin._updates).toHaveLength(0);
  });
});
