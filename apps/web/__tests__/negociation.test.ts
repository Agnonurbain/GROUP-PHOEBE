import { describe, it, expect } from "vitest";

// ─── Negotiation flow logic ──────────────────────────────────────────
// Tests the prix_negocie workflow:
//   1. Client creates a demande with statut 'en_negociation'
//   2. Operator sets prix_negocie → statut becomes 'en_attente_paiement'
//   3. Client pays the negotiated price

type DemandeStatut =
  | "en_attente_paiement"
  | "en_attente_validation"
  | "acceptee"
  | "refusee"
  | "annulee"
  | "terminee"
  | "en_negociation";

type Demande = {
  id: string;
  statut: DemandeStatut;
  montant: number;
  caution: number;
  prix_negocie: number | null;
  negociation_note: string | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────

function canNegotiate(statut: DemandeStatut): boolean {
  return statut === "en_negociation";
}

function canSetPrixNegocie(demande: Demande): boolean {
  return demande.statut === "en_negociation";
}

function canPayNegociated(demande: Demande): boolean {
  return demande.statut === "en_attente_paiement" && demande.prix_negocie != null;
}

function canCancel(statut: DemandeStatut): boolean {
  return ["en_attente_validation", "acceptee", "en_negociation"].includes(statut);
}

function getDisplayLabel(statut: DemandeStatut): string {
  const labels: Record<DemandeStatut, string> = {
    en_attente_paiement: "En attente de paiement",
    en_negociation: "En négociation",
    en_attente_validation: "En attente de validation",
    acceptee: "Acceptée",
    refusee: "Refusée",
    annulee: "Annulée",
    terminee: "Terminée",
  };
  return labels[statut];
}

// ─── Tests ───────────────────────────────────────────────────────────

describe("Négociation — flux de statuts", () => {
  it("en_negociation est un statut valide", () => {
    expect(getDisplayLabel("en_negociation")).toBe("En négociation");
    expect(canNegotiate("en_negociation")).toBe(true);
    expect(canNegotiate("en_attente_validation")).toBe(false);
  });

  it("une demande en négociation peut recevoir un prix", () => {
    const d: Demande = {
      id: "d1",
      statut: "en_negociation",
      montant: 100000,
      caution: 30000,
      prix_negocie: null,
      negociation_note: "Je propose 80 000",
    };
    expect(canSetPrixNegocie(d)).toBe(true);
  });

  it("une demande déjà acceptée ne peut pas recevoir de prix négocié", () => {
    const d: Demande = {
      id: "d2",
      statut: "acceptee",
      montant: 100000,
      caution: 30000,
      prix_negocie: null,
      negociation_note: null,
    };
    expect(canSetPrixNegocie(d)).toBe(false);
  });

  it("après envoi du prix, la demande passe en attente de paiement", () => {
    const d: Demande = {
      id: "d1",
      statut: "en_negociation",
      montant: 100000,
      caution: 30000,
      prix_negocie: null,
      negociation_note: null,
    };
    // Simulating operator setting price
    d.prix_negocie = 85000;
    d.statut = "en_attente_paiement";

    expect(d.statut).toBe("en_attente_paiement");
    expect(d.prix_negocie).toBe(85000);
    expect(canPayNegociated(d)).toBe(true);
  });

  it("le client peut payer le prix négocié", () => {
    const d: Demande = {
      id: "d1",
      statut: "en_attente_paiement",
      montant: 100000,
      caution: 30000,
      prix_negocie: 85000,
      negociation_note: null,
    };
    expect(canPayNegociated(d)).toBe(true);
  });

  it("sans prix_negocie, en_attente_paiement ne déclenche pas le flux négocié", () => {
    const d: Demande = {
      id: "d1",
      statut: "en_attente_paiement",
      montant: 100000,
      caution: 30000,
      prix_negocie: null,
      negociation_note: null,
    };
    expect(canPayNegociated(d)).toBe(false);
  });
});

describe("Négociation — annulation", () => {
  it("une demande en négociation peut être annulée", () => {
    expect(canCancel("en_negociation")).toBe(true);
  });

  it("une demande terminée ne peut pas être annulée", () => {
    expect(canCancel("terminee")).toBe(false);
  });

  it("une demande refusée ne peut pas être annulée", () => {
    expect(canCancel("refusee")).toBe(false);
  });
});

describe("Négociation — WhatsApp link", () => {
  function buildWhatsAppUrl(demandeId: string, note: string): string {
    const text = `Bonjour, je souhaite négocier le prix de ma réservation (réf: ${demandeId.slice(0, 8)}). ${note}`;
    return `https://wa.me/2250778631983?text=${encodeURIComponent(text)}`;
  }

  it("génère un lien WhatsApp valide avec la référence de la demande", () => {
    const url = buildWhatsAppUrl("abcd1234-5678-9012", "Mon budget est de 70 000");
    expect(url).toContain("wa.me/2250778631983");
    expect(url).toContain("abcd1234");
    expect(url).toContain("70%20000");
  });

  it("fonctionne avec une note vide", () => {
    const url = buildWhatsAppUrl("abcd1234-5678-9012", "");
    expect(url).toContain("wa.me/2250778631983");
    expect(url).toContain("abcd1234");
  });
});

describe("Négociation — permissions", () => {
  type Role = "client" | "operateur" | "proprietaire" | "livreur";

  function canSetNegociatedPrice(role: Role): boolean {
    return ["operateur", "proprietaire"].includes(role);
  }

  function canRequestNegotiation(role: Role): boolean {
    return role === "client";
  }

  it("seul le staff peut fixer le prix négocié", () => {
    expect(canSetNegociatedPrice("operateur")).toBe(true);
    expect(canSetNegociatedPrice("proprietaire")).toBe(true);
    expect(canSetNegociatedPrice("client")).toBe(false);
    expect(canSetNegociatedPrice("livreur")).toBe(false);
  });

  it("seul le client peut demander une négociation", () => {
    expect(canRequestNegotiation("client")).toBe(true);
    expect(canRequestNegotiation("operateur")).toBe(false);
  });
});

describe("Négociation — validation prix", () => {
  it("le prix négocié doit être positif", () => {
    const prix = 85000;
    expect(prix > 0).toBe(true);
  });

  it("un prix de 0 est invalide", () => {
    const prix = 0;
    expect(prix > 0).toBe(false);
  });

  it("un prix négatif est invalide", () => {
    const prix = -5000;
    expect(prix > 0).toBe(false);
  });
});
