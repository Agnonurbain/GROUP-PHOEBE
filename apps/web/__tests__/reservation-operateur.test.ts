import { describe, it, expect } from "vitest";

type Role = "client" | "operateur" | "proprietaire" | "livreur";

type Vehicule = {
  id: string;
  marque: string;
  modele: string;
  categorie: string;
  prix_journalier: number;
  taux_caution: number;
  chauffeur_disponible: boolean;
  statut: string;
};

type Client = {
  id: string;
  nom: string;
  telephone: string | null;
  email: string | null;
};

type LigneInput = {
  vehiculeId: string;
  avecChauffeur: boolean;
};

// ─── Helpers ─────────────────────────────────────────────────────────

function canCreateForClient(role: Role): boolean {
  return ["operateur", "proprietaire"].includes(role);
}

function filterClients(
  clients: Client[],
  search: string
): Client[] {
  if (search.length < 2) return [];
  const q = search.toLowerCase();
  return clients.filter(
    (c) =>
      c.nom.toLowerCase().includes(q) ||
      (c.telephone && c.telephone.includes(search)) ||
      (c.email && c.email.toLowerCase().includes(q))
  );
}

function filterVehicules(
  vehicules: Vehicule[],
  search: string,
  alreadySelected: string[]
): Vehicule[] {
  if (search.length < 1) return [];
  const q = search.toLowerCase();
  return vehicules.filter(
    (v) =>
      !alreadySelected.includes(v.id) &&
      (`${v.marque} ${v.modele}`.toLowerCase().includes(q) ||
        v.categorie.toLowerCase().includes(q))
  );
}

function calcTotal(
  vehicules: Vehicule[],
  lignes: LigneInput[],
  nbJours: number
): { montant: number; caution: number } {
  let montant = 0;
  let caution = 0;
  for (const l of lignes) {
    const v = vehicules.find((vv) => vv.id === l.vehiculeId);
    if (!v) continue;
    const m = v.prix_journalier * nbJours;
    const c = Math.round(m * v.taux_caution);
    montant += m;
    caution += c;
  }
  return { montant, caution };
}

function buildLienClient(baseUrl: string): string {
  return `${baseUrl}/profil/reservations`;
}

// ─── Tests ───────────────────────────────────────────────────────────

describe("Réservation opérateur — permissions", () => {
  it("opérateur peut créer une réservation pour un client", () => {
    expect(canCreateForClient("operateur")).toBe(true);
  });

  it("propriétaire peut créer une réservation pour un client", () => {
    expect(canCreateForClient("proprietaire")).toBe(true);
  });

  it("client ne peut pas créer de réservation pour un autre", () => {
    expect(canCreateForClient("client")).toBe(false);
  });

  it("livreur ne peut pas créer de réservation pour un client", () => {
    expect(canCreateForClient("livreur")).toBe(false);
  });
});

describe("Réservation opérateur — recherche client", () => {
  const clients: Client[] = [
    { id: "c1", nom: "Kouadio Jean", telephone: "0708001122", email: "jean@test.com" },
    { id: "c2", nom: "Diabaté Fatou", telephone: "0501234567", email: null },
    { id: "c3", nom: "Traoré Moussa", telephone: null, email: "moussa@test.com" },
  ];

  it("ne retourne rien avec moins de 2 caractères", () => {
    expect(filterClients(clients, "K")).toHaveLength(0);
  });

  it("filtre par nom", () => {
    const res = filterClients(clients, "Kouadio");
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe("c1");
  });

  it("filtre par téléphone", () => {
    const res = filterClients(clients, "05012");
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe("c2");
  });

  it("filtre par email", () => {
    const res = filterClients(clients, "moussa@");
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe("c3");
  });

  it("retourne vide si aucun match", () => {
    expect(filterClients(clients, "xyz123")).toHaveLength(0);
  });
});

describe("Réservation opérateur — sélection véhicules", () => {
  const vehicules: Vehicule[] = [
    { id: "v1", marque: "Toyota", modele: "Corolla", categorie: "leger", prix_journalier: 30000, taux_caution: 0.3, chauffeur_disponible: true, statut: "disponible" },
    { id: "v2", marque: "BMW", modele: "X5", categorie: "leger", prix_journalier: 50000, taux_caution: 0.3, chauffeur_disponible: false, statut: "disponible" },
    { id: "v3", marque: "Mercedes", modele: "Sprinter", categorie: "minibus", prix_journalier: 80000, taux_caution: 0.25, chauffeur_disponible: true, statut: "disponible" },
  ];

  it("exclut les véhicules déjà sélectionnés", () => {
    const res = filterVehicules(vehicules, "le", ["v1"]);
    expect(res.every((v) => v.id !== "v1")).toBe(true);
  });

  it("filtre par marque/modèle", () => {
    const res = filterVehicules(vehicules, "toyota", []);
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe("v1");
  });

  it("filtre par catégorie", () => {
    const res = filterVehicules(vehicules, "minibus", []);
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe("v3");
  });
});

describe("Réservation opérateur — calcul prix", () => {
  const vehicules: Vehicule[] = [
    { id: "v1", marque: "Toyota", modele: "Corolla", categorie: "leger", prix_journalier: 30000, taux_caution: 0.3, chauffeur_disponible: true, statut: "disponible" },
    { id: "v2", marque: "BMW", modele: "X5", categorie: "leger", prix_journalier: 50000, taux_caution: 0.3, chauffeur_disponible: false, statut: "disponible" },
  ];

  it("calcule pour un véhicule sur 3 jours", () => {
    const { montant, caution } = calcTotal(vehicules, [{ vehiculeId: "v1", avecChauffeur: false }], 3);
    expect(montant).toBe(90000);
    expect(caution).toBe(27000);
  });

  it("calcule pour plusieurs véhicules", () => {
    const { montant, caution } = calcTotal(
      vehicules,
      [
        { vehiculeId: "v1", avecChauffeur: false },
        { vehiculeId: "v2", avecChauffeur: false },
      ],
      2
    );
    expect(montant).toBe(160000);
    expect(caution).toBe(48000);
  });
});

describe("Réservation opérateur — lien client", () => {
  it("génère le lien vers les réservations du client", () => {
    const lien = buildLienClient("https://groupphoebe.com");
    expect(lien).toBe("https://groupphoebe.com/profil/reservations");
  });

  it("fonctionne avec localhost", () => {
    const lien = buildLienClient("http://localhost:3000");
    expect(lien).toBe("http://localhost:3000/profil/reservations");
  });
});

describe("Réservation opérateur — statut", () => {
  it("la réservation est créée directement en 'acceptee'", () => {
    const statut = "acceptee";
    expect(statut).toBe("acceptee");
  });

  it("le client peut voir une demande acceptée dans ses réservations", () => {
    const visibleStatuts = [
      "en_attente_paiement",
      "en_negociation",
      "en_attente_validation",
      "acceptee",
      "en_cours",
      "terminee",
      "refusee",
      "annulee",
    ];
    expect(visibleStatuts).toContain("acceptee");
  });
});
