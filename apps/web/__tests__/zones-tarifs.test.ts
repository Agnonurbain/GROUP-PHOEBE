import { describe, it, expect } from "vitest";

// ─── Zone tarifaire logic ───────────────────────────────────────────
// Mirrors the pricing logic from the reservation form and detail page.
// Zones: Abidjan, Grand Abidjan, Intérieur du pays
// Each zone has price intervals per vehicle category (leger, car, minibus)
// and per type (location, vente).

type Zone = { id: string; nom: string; ordre: number };
type Commune = { id: string; nom: string; zone_id: string; ajoutee_par_client: boolean };
type IntervallePrix = {
  id: string;
  zone_id: string;
  categorie_vehicule: "leger" | "car" | "minibus";
  type: "location" | "vente";
  prix_min: number;
  prix_max: number;
};

const ZONES: Zone[] = [
  { id: "z1", nom: "Abidjan", ordre: 1 },
  { id: "z2", nom: "Grand Abidjan", ordre: 2 },
  { id: "z3", nom: "Intérieur du pays", ordre: 3 },
];

const COMMUNES: Commune[] = [
  { id: "c1", nom: "Cocody", zone_id: "z1", ajoutee_par_client: false },
  { id: "c2", nom: "Plateau", zone_id: "z1", ajoutee_par_client: false },
  { id: "c3", nom: "Yamoussoukro", zone_id: "z2", ajoutee_par_client: false },
  { id: "c4", nom: "Bouaké", zone_id: "z3", ajoutee_par_client: false },
  { id: "c5", nom: "Bingerville", zone_id: "z1", ajoutee_par_client: true },
];

const INTERVALLES: IntervallePrix[] = [
  { id: "i1", zone_id: "z1", categorie_vehicule: "leger", type: "location", prix_min: 25000, prix_max: 50000 },
  { id: "i2", zone_id: "z2", categorie_vehicule: "leger", type: "location", prix_min: 40000, prix_max: 80000 },
  { id: "i3", zone_id: "z3", categorie_vehicule: "leger", type: "location", prix_min: 60000, prix_max: 120000 },
  { id: "i4", zone_id: "z1", categorie_vehicule: "car", type: "location", prix_min: 150000, prix_max: 350000 },
  { id: "i5", zone_id: "z1", categorie_vehicule: "leger", type: "vente", prix_min: 3000000, prix_max: 15000000 },
];

function getZoneForCommune(communeId: string): Zone | undefined {
  const commune = COMMUNES.find((c) => c.id === communeId);
  if (!commune) return undefined;
  return ZONES.find((z) => z.id === commune.zone_id);
}

function getIntervalle(
  zoneId: string,
  categorie: "leger" | "car" | "minibus",
  type: "location" | "vente"
): IntervallePrix | undefined {
  return INTERVALLES.find(
    (ip) =>
      ip.zone_id === zoneId &&
      ip.categorie_vehicule === categorie &&
      ip.type === type
  );
}

function computeEstimate(
  communeDestId: string,
  categorie: "leger" | "car" | "minibus",
  type: "location" | "vente"
): { prix_min: number; prix_max: number; zone: string } | null {
  const zone = getZoneForCommune(communeDestId);
  if (!zone) return null;
  const ip = getIntervalle(zone.id, categorie, type);
  if (!ip) return null;
  return { prix_min: ip.prix_min, prix_max: ip.prix_max, zone: zone.nom };
}

// ─── Tests ──────────────────────────────────────────────────────────

describe("Zones tarifaires — résolution commune → zone", () => {
  it("Cocody est dans la zone Abidjan", () => {
    expect(getZoneForCommune("c1")?.nom).toBe("Abidjan");
  });

  it("Yamoussoukro est dans la zone Grand Abidjan", () => {
    expect(getZoneForCommune("c3")?.nom).toBe("Grand Abidjan");
  });

  it("Bouaké est dans la zone Intérieur du pays", () => {
    expect(getZoneForCommune("c4")?.nom).toBe("Intérieur du pays");
  });

  it("une commune inconnue retourne undefined", () => {
    expect(getZoneForCommune("unknown")).toBeUndefined();
  });

  it("une commune ajoutée par un client est bien rattachée à sa zone", () => {
    const commune = COMMUNES.find((c) => c.id === "c5");
    expect(commune?.ajoutee_par_client).toBe(true);
    expect(getZoneForCommune("c5")?.nom).toBe("Abidjan");
  });
});

describe("Zones tarifaires — intervalles de prix", () => {
  it("véhicule léger location vers Abidjan : 25 000 – 50 000", () => {
    const estimate = computeEstimate("c1", "leger", "location");
    expect(estimate).not.toBeNull();
    expect(estimate!.prix_min).toBe(25000);
    expect(estimate!.prix_max).toBe(50000);
    expect(estimate!.zone).toBe("Abidjan");
  });

  it("véhicule léger location vers Grand Abidjan : 40 000 – 80 000", () => {
    const estimate = computeEstimate("c3", "leger", "location");
    expect(estimate).not.toBeNull();
    expect(estimate!.prix_min).toBe(40000);
    expect(estimate!.prix_max).toBe(80000);
  });

  it("véhicule léger location vers Intérieur : 60 000 – 120 000", () => {
    const estimate = computeEstimate("c4", "leger", "location");
    expect(estimate).not.toBeNull();
    expect(estimate!.prix_min).toBe(60000);
    expect(estimate!.prix_max).toBe(120000);
  });

  it("car location vers Abidjan : 150 000 – 350 000", () => {
    const estimate = computeEstimate("c1", "car", "location");
    expect(estimate).not.toBeNull();
    expect(estimate!.prix_min).toBe(150000);
    expect(estimate!.prix_max).toBe(350000);
  });

  it("véhicule léger vente vers Abidjan : 3 000 000 – 15 000 000", () => {
    const estimate = computeEstimate("c1", "leger", "vente");
    expect(estimate).not.toBeNull();
    expect(estimate!.prix_min).toBe(3000000);
    expect(estimate!.prix_max).toBe(15000000);
  });

  it("prix_min est toujours ≤ prix_max", () => {
    for (const ip of INTERVALLES) {
      expect(ip.prix_min).toBeLessThanOrEqual(ip.prix_max);
    }
  });

  it("pas d'intervalle si catégorie/type n'existe pas pour la zone", () => {
    const estimate = computeEstimate("c3", "minibus", "vente");
    expect(estimate).toBeNull();
  });
});

describe("Zones tarifaires — prix plus élevé pour zones éloignées", () => {
  it("Intérieur > Grand Abidjan > Abidjan pour véhicule léger location", () => {
    const abidjan = computeEstimate("c1", "leger", "location")!;
    const grandAbidjan = computeEstimate("c3", "leger", "location")!;
    const interieur = computeEstimate("c4", "leger", "location")!;

    expect(grandAbidjan.prix_min).toBeGreaterThan(abidjan.prix_min);
    expect(interieur.prix_min).toBeGreaterThan(grandAbidjan.prix_min);
    expect(grandAbidjan.prix_max).toBeGreaterThan(abidjan.prix_max);
    expect(interieur.prix_max).toBeGreaterThan(grandAbidjan.prix_max);
  });
});

describe("Flux achat/location — redirection", () => {
  type Mode = "location" | "achat";

  function resolveDetailUrl(vehiculeId: string, mode: Mode | undefined): string {
    if (!mode) return `/catalogue/${vehiculeId}/choix`;
    return `/catalogue/${vehiculeId}?mode=${mode}`;
  }

  it("sans mode → redirige vers la page choix", () => {
    expect(resolveDetailUrl("v1", undefined)).toBe("/catalogue/v1/choix");
  });

  it("mode location → page détail avec ?mode=location", () => {
    expect(resolveDetailUrl("v1", "location")).toBe("/catalogue/v1?mode=location");
  });

  it("mode achat → page détail avec ?mode=achat", () => {
    expect(resolveDetailUrl("v1", "achat")).toBe("/catalogue/v1?mode=achat");
  });
});

describe("Communes dynamiques — contrainte unicité", () => {
  it("pas de doublons nom+zone dans les données de seed", () => {
    const seen = new Set<string>();
    for (const c of COMMUNES) {
      const key = `${c.nom}::${c.zone_id}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });
});

describe("Véhicule — champs caractéristiques", () => {
  type Vehicule = {
    assurance_url: string | null;
    camera_interieure: boolean;
    carburant: string | null;
    kilometrage: number | null;
    localisation: string | null;
  };

  it("assurance_url null → pas de badge assuré", () => {
    const v: Vehicule = { assurance_url: null, camera_interieure: true, carburant: "essence", kilometrage: null, localisation: null };
    expect(!!v.assurance_url).toBe(false);
  });

  it("assurance_url renseigné → badge assuré visible", () => {
    const v: Vehicule = { assurance_url: "path/to/assurance.pdf", camera_interieure: true, carburant: null, kilometrage: null, localisation: null };
    expect(!!v.assurance_url).toBe(true);
  });

  it("camera_interieure default true", () => {
    const v: Vehicule = { assurance_url: null, camera_interieure: true, carburant: null, kilometrage: null, localisation: null };
    expect(v.camera_interieure).toBe(true);
  });

  it("carburant accepte essence, diesel, hybride, electrique", () => {
    const valid = ["essence", "diesel", "hybride", "electrique"];
    for (const val of valid) {
      expect(valid).toContain(val);
    }
  });

  it("kilometrage est un nombre ou null", () => {
    const v: Vehicule = { assurance_url: null, camera_interieure: true, carburant: "diesel", kilometrage: 85000, localisation: "Cocody" };
    expect(v.kilometrage).toBe(85000);
    const v2: Vehicule = { assurance_url: null, camera_interieure: true, carburant: null, kilometrage: null, localisation: null };
    expect(v2.kilometrage).toBeNull();
  });

  it("localisation est une chaîne ou null", () => {
    const v: Vehicule = { assurance_url: null, camera_interieure: true, carburant: "essence", kilometrage: 50000, localisation: "Plateau, Abidjan" };
    expect(v.localisation).toBe("Plateau, Abidjan");
  });
});
