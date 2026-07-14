import { vi } from "vitest";

export type MockPaiement = {
  id: string;
  module: string;
  reference_table: string;
  reference_id: string;
  type: string;
  montant: number;
  methode: "stripe" | "cinetpay";
  statut: string;
  webhook_reference: string | null;
  created_at: string;
};

export function createMockPaiement(
  overrides: Partial<MockPaiement> = {}
): MockPaiement {
  return {
    id: "paiement-001",
    module: "transport",
    reference_table: "demandes_transport",
    reference_id: "demande-001",
    type: "montant",
    montant: 70000,
    methode: "stripe",
    statut: "capture",
    webhook_reference: "pi_test_123",
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockAdminClient(paiement: MockPaiement | null) {
  let lastUpdateStatut: string | null = null;
  let updateCalledOnId: string | null = null;

  const mockUpdate = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: null }),
  });

  const wrappedUpdate = (vals: Record<string, unknown>) => {
    lastUpdateStatut = vals.statut as string;
    return mockUpdate(vals);
  };

  const adminClient = {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: paiement,
                error: null,
              }),
            }),
          }),
        }),
      }),
      update: vi.fn((vals: Record<string, unknown>) => {
        lastUpdateStatut = vals.statut as string;
        updateCalledOnId = paiement?.id ?? null;
        return {
          eq: vi.fn().mockResolvedValue({ error: null }),
        };
      }),
    }),
    _getLastUpdateStatut: () => lastUpdateStatut,
    _getUpdateCalledOnId: () => updateCalledOnId,
  };

  return adminClient;
}
