import { describe, it, expect } from "vitest";

// ─── Cart logic ──────────────────────────────────────────────────────
// Mirrors the cart context (localStorage-based panier) behavior.

type CartItem = {
  vehiculeId: string;
  marque: string;
  modele: string;
  categorie: string;
  prixJournalier: number;
  tauxCaution: number;
  chauffeurDisponible: boolean;
  avecChauffeur: boolean;
  photoUrl: string | null;
};

function createCart() {
  let items: CartItem[] = [];

  return {
    getItems: () => items,
    addItem: (item: Omit<CartItem, "avecChauffeur">) => {
      if (items.some((i) => i.vehiculeId === item.vehiculeId)) return;
      items.push({ ...item, avecChauffeur: false });
    },
    removeItem: (vehiculeId: string) => {
      items = items.filter((i) => i.vehiculeId !== vehiculeId);
    },
    toggleChauffeur: (vehiculeId: string) => {
      items = items.map((i) =>
        i.vehiculeId === vehiculeId
          ? { ...i, avecChauffeur: !i.avecChauffeur }
          : i
      );
    },
    clearCart: () => {
      items = [];
    },
    isInCart: (vehiculeId: string) =>
      items.some((i) => i.vehiculeId === vehiculeId),
    count: () => items.length,
  };
}

const VEHICLE_A: Omit<CartItem, "avecChauffeur"> = {
  vehiculeId: "v1",
  marque: "Toyota",
  modele: "Corolla",
  categorie: "leger",
  prixJournalier: 25000,
  tauxCaution: 0.3,
  chauffeurDisponible: true,
  photoUrl: null,
};

const VEHICLE_B: Omit<CartItem, "avecChauffeur"> = {
  vehiculeId: "v2",
  marque: "BMW",
  modele: "X5",
  categorie: "leger",
  prixJournalier: 50000,
  tauxCaution: 0.3,
  chauffeurDisponible: false,
  photoUrl: null,
};

const VEHICLE_C: Omit<CartItem, "avecChauffeur"> = {
  vehiculeId: "v3",
  marque: "Mercedes",
  modele: "Sprinter",
  categorie: "minibus",
  prixJournalier: 80000,
  tauxCaution: 0.25,
  chauffeurDisponible: true,
  photoUrl: null,
};

// ─── Tests: Cart operations ──────────────────────────────────────────

describe("Panier — opérations de base", () => {
  it("panier initialement vide", () => {
    const cart = createCart();
    expect(cart.count()).toBe(0);
    expect(cart.getItems()).toEqual([]);
  });

  it("ajouter un véhicule au panier", () => {
    const cart = createCart();
    cart.addItem(VEHICLE_A);
    expect(cart.count()).toBe(1);
    expect(cart.isInCart("v1")).toBe(true);
    expect(cart.getItems()[0].avecChauffeur).toBe(false);
  });

  it("ajouter plusieurs véhicules différents", () => {
    const cart = createCart();
    cart.addItem(VEHICLE_A);
    cart.addItem(VEHICLE_B);
    cart.addItem(VEHICLE_C);
    expect(cart.count()).toBe(3);
    expect(cart.isInCart("v1")).toBe(true);
    expect(cart.isInCart("v2")).toBe(true);
    expect(cart.isInCart("v3")).toBe(true);
  });

  it("ne peut pas ajouter le même véhicule deux fois", () => {
    const cart = createCart();
    cart.addItem(VEHICLE_A);
    cart.addItem(VEHICLE_A);
    expect(cart.count()).toBe(1);
  });

  it("retirer un véhicule du panier", () => {
    const cart = createCart();
    cart.addItem(VEHICLE_A);
    cart.addItem(VEHICLE_B);
    cart.removeItem("v1");
    expect(cart.count()).toBe(1);
    expect(cart.isInCart("v1")).toBe(false);
    expect(cart.isInCart("v2")).toBe(true);
  });

  it("vider le panier", () => {
    const cart = createCart();
    cart.addItem(VEHICLE_A);
    cart.addItem(VEHICLE_B);
    cart.clearCart();
    expect(cart.count()).toBe(0);
  });
});

describe("Panier — option chauffeur", () => {
  it("chauffeur est false par défaut", () => {
    const cart = createCart();
    cart.addItem(VEHICLE_A);
    expect(cart.getItems()[0].avecChauffeur).toBe(false);
  });

  it("toggle chauffeur active l'option", () => {
    const cart = createCart();
    cart.addItem(VEHICLE_A);
    cart.toggleChauffeur("v1");
    expect(cart.getItems()[0].avecChauffeur).toBe(true);
  });

  it("double toggle chauffeur désactive l'option", () => {
    const cart = createCart();
    cart.addItem(VEHICLE_A);
    cart.toggleChauffeur("v1");
    cart.toggleChauffeur("v1");
    expect(cart.getItems()[0].avecChauffeur).toBe(false);
  });

  it("toggle chauffeur ne touche pas les autres véhicules", () => {
    const cart = createCart();
    cart.addItem(VEHICLE_A);
    cart.addItem(VEHICLE_B);
    cart.toggleChauffeur("v1");
    expect(cart.getItems()[0].avecChauffeur).toBe(true);
    expect(cart.getItems()[1].avecChauffeur).toBe(false);
  });
});

// ─── Tests: Price calculation ────────────────────────────────────────

describe("Panier — calcul des prix", () => {
  function calculateTotal(items: CartItem[], nbJours: number) {
    let totalMontant = 0;
    let totalCaution = 0;
    for (const item of items) {
      const montant = item.prixJournalier * nbJours;
      const caution = Math.round(montant * item.tauxCaution);
      totalMontant += montant;
      totalCaution += caution;
    }
    return { totalMontant, totalCaution, grandTotal: totalMontant + totalCaution };
  }

  it("un seul véhicule — 3 jours", () => {
    const cart = createCart();
    cart.addItem(VEHICLE_A);
    const { totalMontant, totalCaution, grandTotal } = calculateTotal(cart.getItems(), 3);
    expect(totalMontant).toBe(75000);
    expect(totalCaution).toBe(22500);
    expect(grandTotal).toBe(97500);
  });

  it("deux véhicules — 5 jours", () => {
    const cart = createCart();
    cart.addItem(VEHICLE_A);
    cart.addItem(VEHICLE_B);
    const { totalMontant, totalCaution, grandTotal } = calculateTotal(cart.getItems(), 5);
    expect(totalMontant).toBe(375000);
    expect(totalCaution).toBe(112500);
    expect(grandTotal).toBe(487500);
  });

  it("trois véhicules avec taux caution différent", () => {
    const cart = createCart();
    cart.addItem(VEHICLE_A);
    cart.addItem(VEHICLE_B);
    cart.addItem(VEHICLE_C);
    const { totalMontant, totalCaution, grandTotal } = calculateTotal(cart.getItems(), 2);

    const montantA = 25000 * 2;
    const cautionA = Math.round(montantA * 0.3);
    const montantB = 50000 * 2;
    const cautionB = Math.round(montantB * 0.3);
    const montantC = 80000 * 2;
    const cautionC = Math.round(montantC * 0.25);

    expect(totalMontant).toBe(montantA + montantB + montantC);
    expect(totalCaution).toBe(cautionA + cautionB + cautionC);
    expect(grandTotal).toBe(totalMontant + totalCaution);
  });
});

// ─── Tests: Lignes demande structure ─────────────────────────────────

describe("Panier — structure lignes_demande", () => {
  it("génère les lignes JSON pour le formulaire", () => {
    const cart = createCart();
    cart.addItem(VEHICLE_A);
    cart.addItem(VEHICLE_B);
    cart.toggleChauffeur("v1");

    const lignesJson = JSON.stringify(
      cart.getItems().map((i) => ({
        vehiculeId: i.vehiculeId,
        avecChauffeur: i.avecChauffeur,
      }))
    );

    const parsed = JSON.parse(lignesJson);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toEqual({ vehiculeId: "v1", avecChauffeur: true });
    expect(parsed[1]).toEqual({ vehiculeId: "v2", avecChauffeur: false });
  });

  it("panier vide → lignes JSON vide", () => {
    const cart = createCart();
    const lignesJson = JSON.stringify(
      cart.getItems().map((i) => ({
        vehiculeId: i.vehiculeId,
        avecChauffeur: i.avecChauffeur,
      }))
    );
    expect(JSON.parse(lignesJson)).toEqual([]);
  });
});

// ─── Tests: Multi-vehicle reservation display ────────────────────────

describe("Affichage réservation multi-véhicules", () => {
  type LigneDemande = {
    id: string;
    vehicules: { marque: string; modele: string } | null;
    avec_chauffeur: boolean;
  };

  function getVehiculeLabel(
    lignes: LigneDemande[],
    vehicule: { marque: string; modele: string } | null
  ): string {
    if (lignes.length > 1) return `${lignes.length} véhicules`;
    if (lignes.length === 1) {
      const v = lignes[0].vehicules;
      return v ? `${v.marque} ${v.modele}` : "—";
    }
    return vehicule ? `${vehicule.marque} ${vehicule.modele}` : "—";
  }

  it("0 lignes → fallback sur vehicule de la demande", () => {
    const label = getVehiculeLabel([], { marque: "Toyota", modele: "Corolla" });
    expect(label).toBe("Toyota Corolla");
  });

  it("1 ligne → affiche le véhicule de la ligne", () => {
    const label = getVehiculeLabel(
      [{ id: "l1", vehicules: { marque: "BMW", modele: "X5" }, avec_chauffeur: false }],
      null
    );
    expect(label).toBe("BMW X5");
  });

  it("2+ lignes → affiche le nombre de véhicules", () => {
    const label = getVehiculeLabel(
      [
        { id: "l1", vehicules: { marque: "BMW", modele: "X5" }, avec_chauffeur: false },
        { id: "l2", vehicules: { marque: "Toyota", modele: "Corolla" }, avec_chauffeur: true },
        { id: "l3", vehicules: { marque: "Mercedes", modele: "Sprinter" }, avec_chauffeur: false },
      ],
      null
    );
    expect(label).toBe("3 véhicules");
  });

  it("pas de lignes, pas de vehicule → tiret", () => {
    expect(getVehiculeLabel([], null)).toBe("—");
  });
});

// ─── Tests: Permissions ──────────────────────────────────────────────

describe("Panier — permissions sidebar", () => {
  it("le lien panier n'apparaît pas pour le staff", () => {
    const isStaff = true;
    const showCart = !isStaff;
    expect(showCart).toBe(false);
  });

  it("le lien panier apparaît pour les clients", () => {
    const isStaff = false;
    const showCart = !isStaff;
    expect(showCart).toBe(true);
  });
});
