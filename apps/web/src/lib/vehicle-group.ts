export type VehicleGroup = {
  groupKey: string;
  marque: string;
  modele: string;
  categorie: string;
  prixJournalier: number;
  cautionBaseFcfa: number;
  chauffeurDisponible: boolean;
  totalCount: number;
  photoUrl: string | null;
  representativeId: string;
  climatisation: boolean;
  gps: boolean;
  boite: string | null;
  nbPlaces: number | null;
  annee: number | null;
  assurance: boolean;
  prixVente: number | null;
  carburant: string | null;
  kilometrage: number | null;
  localisation: string | null;
  etat: string | null;
};

export function makeGroupKey(marque: string, modele: string): string {
  return `${slugify(marque)}--${slugify(modele)}`;
}

export function parseGroupKey(key: string): { marque: string; modele: string } | null {
  const parts = key.split("--");
  if (parts.length < 2) return null;
  return { marque: parts[0], modele: parts.slice(1).join("--") };
}

function slugify(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

type VehiculeRow = {
  id: string;
  marque: string;
  modele: string;
  categorie: string;
  prix_journalier: number | null;
  taux_caution: number | null;
  chauffeur_disponible: boolean;
  statut: string;
  climatisation: boolean;
  gps: boolean;
  boite: string | null;
  nb_places: number | null;
  annee: number | null;
  assurance_url: string | null;
  prix_vente: number | null;
  carburant: string | null;
  kilometrage: number | null;
  localisation: string | null;
  etat: string;
};

export function groupVehicles(
  vehicules: VehiculeRow[],
  photoMap?: Record<string, string>
): VehicleGroup[] {
  const map = new Map<string, VehiculeRow[]>();

  for (const v of vehicules) {
    const key = makeGroupKey(v.marque, v.modele);
    const arr = map.get(key);
    if (arr) arr.push(v);
    else map.set(key, [v]);
  }

  const groups: VehicleGroup[] = [];

  for (const [groupKey, items] of map) {
    const rep = items[0];
    const disponibles = items.filter((v) => v.statut === "disponible");

    let photo: string | null = null;
    if (photoMap) {
      for (const v of items) {
        const p = photoMap[v.id];
        if (p) {
          photo = p;
          break;
        }
      }
    }

    const prices = items
      .map((v) => Number(v.prix_journalier))
      .filter((p) => p > 0);

    const boites = new Set(items.map((v) => v.boite).filter(Boolean));
    const places = new Set(items.map((v) => v.nb_places).filter(Boolean));

    groups.push({
      groupKey,
      marque: rep.marque,
      modele: rep.modele,
      categorie: rep.categorie,
      prixJournalier: prices.length > 0 ? Math.min(...prices) : 0,
      cautionBaseFcfa: Math.max(...items.map((v) => Number(v.taux_caution) || 0)),
      chauffeurDisponible: items.some((v) => v.chauffeur_disponible),
      totalCount: disponibles.length,
      photoUrl: photo,
      representativeId: rep.id,
      climatisation: items.every((v) => v.climatisation),
      gps: items.every((v) => v.gps),
      boite: boites.size === 1 ? [...boites][0]! : null,
      nbPlaces: places.size === 1 ? [...places][0]! : null,
      annee: Math.min(...items.map((v) => v.annee ?? 9999)),
      assurance: items.every((v) => !!v.assurance_url),
      prixVente: (() => {
        const vp = items.map((v) => Number(v.prix_vente)).filter((p) => p > 0);
        return vp.length > 0 ? Math.min(...vp) : null;
      })(),
      carburant: (() => {
        const c = new Set(items.map((v) => v.carburant).filter(Boolean));
        return c.size === 1 ? [...c][0]! : null;
      })(),
      kilometrage: rep.kilometrage ? Number(rep.kilometrage) : null,
      localisation: rep.localisation,
      etat: (() => {
        const e = new Set(items.map((v) => v.etat).filter(Boolean));
        return e.size === 1 ? [...e][0]! : null;
      })(),
    });
  }

  return groups.sort((a, b) => b.totalCount - a.totalCount);
}

/**
 * Photos d'un GROUPE de véhicules (même marque + modèle).
 *
 * La fiche véhicule ne chargeait que les photos du premier exemplaire : si
 * l'admin les avait mises sur un autre véhicule du même modèle, la page
 * n'affichait rien — alors que la carte du catalogue, elle, balaie tout le
 * groupe. On clique sur une belle photo et on atterrit sur une page vide.
 *
 * Ordre : par position du véhicule dans le groupe, puis par `ordre` de la photo.
 * Les URL en double (même cliché rattaché à deux exemplaires) sont retirées.
 */
export function photosDuGroupe(
  vehiculeIds: string[],
  photos: { vehicule_id: string; url: string; ordre: number | null }[] | null | undefined
): { url: string }[] {
  const rang = new Map(vehiculeIds.map((id, i) => [id, i]));
  const triees = [...(photos ?? [])]
    .filter((p) => rang.has(p.vehicule_id))
    .sort(
      (a, b) =>
        rang.get(a.vehicule_id)! - rang.get(b.vehicule_id)! ||
        (a.ordre ?? 0) - (b.ordre ?? 0)
    );
  const uniques = new Map<string, { url: string }>();
  for (const p of triees) if (!uniques.has(p.url)) uniques.set(p.url, { url: p.url });
  return [...uniques.values()];
}
