import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import {
  TARIFS_LIVRAISON,
  PALIERS_POIDS,
  isZoneLivraison,
  isModeLivraison,
  type GrilleTarifs,
  type PalierPoids,
} from "@/lib/livraison";
import type { TarifsAssistance } from "@/lib/assistance";
import { CONTACT_VIDE, type ParametresContact } from "@/lib/contact";
import { PARAMETRES_IMMO_DEFAUT, type ParametresImmobilier } from "@/lib/immobilier";
import { makeGroupKey } from "@/lib/vehicle-group";

// Transport catalogue
export const getVehiculesCatalogue = unstable_cache(
  async (filters: Record<string, string | undefined> = {}) => {
    const supabase = createPublicClient();

    let query = supabase
      .from("vehicules")
      .select("*")
      .neq("statut", "indisponible")
      .neq("statut", "reserve")
      .order("created_at", { ascending: false });

    if (filters.categorie) query = query.eq("categorie", filters.categorie as "leger" | "car" | "minibus");
    if (filters.q) {
      const q = `%${filters.q}%`;
      query = query.or(`marque.ilike.${q},modele.ilike.${q}`);
    }
    if (filters.carburant) query = query.ilike("carburant", `%${filters.carburant}%`);
    if (filters.boite) query = query.eq("boite", filters.boite);
    if (filters.annee_min) query = query.gte("annee", Number(filters.annee_min));
    if (filters.places_min) query = query.gte("nb_places", Number(filters.places_min));
    if (filters.chauffeur === "oui") query = query.eq("chauffeur_disponible", true);
    if (filters.chauffeur === "non") query = query.eq("chauffeur_disponible", false);
    if (filters.clim === "oui") query = query.eq("climatisation", true);
    if (filters.gps === "oui") query = query.eq("gps", true);
    if (filters.vente === "oui") query = query.gt("prix_vente", 0);
    if (filters.prix_min) query = query.gte("prix_journalier", Number(filters.prix_min));
    if (filters.prix_max) query = query.lte("prix_journalier", Number(filters.prix_max));
    if (filters.etat) query = query.eq("etat", filters.etat);
    if (filters.zone) {
      const { data: zoneCategories } = await supabase
        .from("intervalles_prix")
        .select("categorie_vehicule")
        .eq("zone_id", filters.zone)
        .eq("type", "location");
      if (zoneCategories && zoneCategories.length > 0) {
        const cats = [...new Set(zoneCategories.map((z) => z.categorie_vehicule))];
        query = query.in("categorie", cats);
      }
    }

    const { data } = await query;
    return data ?? [];
  },
  ["vehicules_catalogue"],
  { revalidate: 3600, tags: ["vehicules"] }
);

export const getVehiculesWithPhotos = unstable_cache(
  async (filters: Record<string, string | undefined> = {}) => {
    const vehicules = await getVehiculesCatalogue(filters);
    const ids = vehicules.map((v) => v.id);

    if (ids.length === 0) return { vehicules, photoMap: {} };

    const supabase = createPublicClient();
    const { data: allPhotos } = await supabase
      .from("vehicule_photos")
      .select("vehicule_id, url")
      .in("vehicule_id", ids)
      .order("ordre", { ascending: true });

    const photoMap: Record<string, string> = {};
    for (const p of allPhotos ?? []) {
      if (!photoMap[p.vehicule_id]) photoMap[p.vehicule_id] = p.url;
    }

    return { vehicules, photoMap };
  },
  ["vehicules_catalogue_with_photos"],
  { revalidate: 3600, tags: ["vehicules"] }
);

// Zones tarifaires
export const getZonesTarifaires = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("zones_tarifaires")
      .select("*")
      .order("ordre", { ascending: true });
    return data ?? [];
  },
  ["zones_tarifaires"],
  { revalidate: 3600, tags: ["zones"] }
);

export const getIntervallesPrix = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("intervalles_prix")
      .select("*")
      .order("zone_id", { ascending: true });
    return data ?? [];
  },
  ["intervalles_prix"],
  { revalidate: 3600, tags: ["tarifs"] }
);

export const getCommunes = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("communes")
      .select("id, nom, zone_id")
      .order("nom", { ascending: true });
    return data ?? [];
  },
  ["communes"],
  { revalidate: 3600, tags: ["communes"] }
);

// Immobilier
// Biens retirés du catalogue parce qu'une visite y est réellement engagée.
//
// « Réellement » : seuls comptent les statuts atteints après encaissement de la
// caution — `en_cours_traitement` (posé par le webhook de paiement) et
// `visite_programmee`. Auparavant la requête retenait toute demande de visite
// non close, `en_attente` comprise : un tunnel de paiement abandonné, ou une
// simple demande jamais payée, suffisait à faire disparaître le bien du
// catalogue public. Une demande de visite sur chaque bien vidait la vitrine.
const STATUTS_VISITE_ENGAGEE = ["en_cours_traitement", "visite_programmee"] as const;

async function getBienIdsAvecVisiteActive(supabase: ReturnType<typeof createPublicClient>): Promise<string[]> {
  const { data } = await supabase
    .from("demandes_immobilier")
    .select("bien_id")
    .eq("type", "visite")
    .in("statut", STATUTS_VISITE_ENGAGEE as unknown as string[]);
  return [...new Set((data ?? []).map((d) => d.bien_id))];
}

async function getCompteurOffres(supabase: ReturnType<typeof createPublicClient>, ids: string[]): Promise<Record<string, number>> {
  if (ids.length === 0) return {};
  const { data } = await supabase
    .from("demandes_immobilier")
    .select("bien_id")
    .in("bien_id", ids)
    .eq("type", "offre")
    .neq("statut", "refusee")
    .neq("statut", "annulee")
    .neq("statut", "finalisee");
  const map: Record<string, number> = {};
  for (const d of data ?? []) {
    map[d.bien_id] = (map[d.bien_id] ?? 0) + 1;
  }
  return map;
}

export const getBiensImmobiliers = unstable_cache(
  async (filters: Record<string, string | undefined> = {}) => {
    const supabase = createPublicClient();

    let query = supabase
      .from("biens")
      .select("*")
      .neq("statut", "vendu")
      .neq("statut", "loue")
      .order("created_at", { ascending: false });

    if (filters.type) query = query.eq("type", filters.type);
    if (filters.statut) query = query.eq("statut", filters.statut);
    if (filters.localisation) query = query.ilike("localisation", `%${filters.localisation}%`);
    if (filters.prix_min) query = query.gte("prix", Number(filters.prix_min));
    if (filters.prix_max) query = query.lte("prix", Number(filters.prix_max));
    if (filters.surface_min) query = query.gte("surface_m2", Number(filters.surface_min));
    if (filters.chambres_min) query = query.gte("nb_chambres", Number(filters.chambres_min));
    if (filters.transaction) query = query.eq("transaction", filters.transaction);

    const { data } = await query;
    let biens = data ?? [];

    // Exclure les biens avec une visite active (caution payée, visite en cours)
    const idsExclus = await getBienIdsAvecVisiteActive(supabase);
    if (idsExclus.length > 0) {
      biens = biens.filter((b) => !idsExclus.includes(b.id));
    }

    return biens;
  },
  ["biens_immobiliers"],
  { revalidate: 3600, tags: ["biens"] }
);

export const getBiensWithPhotos = unstable_cache(
  async (filters: Record<string, string | undefined> = {}) => {
    const biens = await getBiensImmobiliers(filters);
    const ids = biens.map((b) => b.id);

    if (ids.length === 0) return { biens, photoMap: {}, offreCountMap: {} };

    const supabase = createPublicClient();
    const [allPhotos, offreCountMap] = await Promise.all([
      supabase
        .from("bien_medias")
        .select("bien_id, url")
        .in("bien_id", ids)
        .eq("type", "photo")
        .order("ordre", { ascending: true }),
      getCompteurOffres(supabase, ids),
    ]);

    const photoMap: Record<string, string> = {};
    for (const p of allPhotos.data ?? []) {
      if (!photoMap[p.bien_id]) photoMap[p.bien_id] = p.url;
    }

    return { biens, photoMap, offreCountMap };
  },
  ["biens_with_photos"],
  { revalidate: 3600, tags: ["biens"] }
);

export const getBienById = unstable_cache(
  async (id: string) => {
    const supabase = createPublicClient();
    const { data: bien } = await supabase.from("biens").select("*").eq("id", id).single();
    if (!bien) return null;

    const [medias, offreCountMap] = await Promise.all([
      supabase
        .from("bien_medias")
        .select("url, type, ordre")
        .eq("bien_id", id)
        .eq("type", "photo")
        .order("ordre", { ascending: true }),
      getCompteurOffres(supabase, [id]),
    ]);

    return { bien, photos: (medias.data ?? []).map((m) => ({ url: m.url })), offreCount: offreCountMap[id] ?? 0 };
  },
  ["bien_by_id"],
  { revalidate: 3600, tags: ["biens"] }
);

// Assistance
export const getPaysAssistance = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from as any)("pays_assistance")
      .select("*")
      .order("nom", { ascending: true });
    return data ?? [];
  },
  ["pays_assistance"],
  { revalidate: 3600, tags: ["assistance"] }
);

export const getPaysAssistanceBySlug = unstable_cache(
  async (slug: string) => {
    const supabase = createPublicClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from as any)("pays_assistance")
      .select("*")
      .eq("slug", slug)
      .single();
    return data;
  },
  ["pays_assistance_slug"],
  { revalidate: 3600, tags: ["assistance"] }
);

// Cache invalidation
export async function revalidatePublicCache() {
  const { revalidateTag } = await import("next/cache");
  (revalidateTag as (tag: string) => void)("vehicules");
  (revalidateTag as (tag: string) => void)("zones");
  (revalidateTag as (tag: string) => void)("tarifs");
  (revalidateTag as (tag: string) => void)("communes");
  (revalidateTag as (tag: string) => void)("biens");
  (revalidateTag as (tag: string) => void)("assistance");
  (revalidateTag as (tag: string) => void)("tarifs_livraison");
  (revalidateTag as (tag: string) => void)("tarifs_assistance");
  (revalidateTag as (tag: string) => void)("parametres_contact");
}
// Livraison — grille tarifaire et paliers de poids pilotés depuis /admin/tarifs.
// Repli sur les constantes du module si la base ne répond pas : mieux vaut un
// prix cohérent (celui du seed) qu'une page de commande cassée.
export const getTarifsLivraison = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const [{ data: tarifs }, { data: paliers }] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from as any)("tarifs_livraison").select("zone, mode, prix"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from as any)("paliers_poids")
        .select("id, ordre, label, max_kg, multiplicateur")
        .order("ordre", { ascending: true }),
    ]);

    const grille = structuredClone(TARIFS_LIVRAISON) as GrilleTarifs;
    for (const t of (tarifs ?? []) as { zone: string; mode: string; prix: number }[]) {
      if (isZoneLivraison(t.zone) && isModeLivraison(t.mode)) {
        grille[t.zone][t.mode] = Number(t.prix);
      }
    }

    const rows = (paliers ?? []) as {
      id: string; ordre: number; label: string; max_kg: number; multiplicateur: number;
    }[];
    const paliersPoids: PalierPoids[] =
      rows.length > 0
        ? rows.map((p) => ({
            maxKg: Number(p.max_kg),
            multiplicateur: Number(p.multiplicateur),
            label: p.label,
          }))
        : PALIERS_POIDS;

    return { grille, paliers: paliersPoids };
  },
  ["tarifs_livraison"],
  { revalidate: 3600, tags: ["tarifs_livraison"] }
);

// Assistance — prix des prestations pilotés depuis /admin/tarifs.
// Repli sur un objet vide : les constantes de lib/assistance.ts s'appliquent
// alors telles quelles, plutôt qu'une page sans prix.
export const getTarifsAssistance = unstable_cache(
  async (): Promise<TarifsAssistance> => {
    const supabase = createPublicClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from as any)("tarifs_assistance")
      .select("pays_slug, prestation_key, prix");

    const tarifs: TarifsAssistance = {};
    for (const t of (data ?? []) as {
      pays_slug: string; prestation_key: string; prix: number | null;
    }[]) {
      tarifs[t.pays_slug] ??= {};
      tarifs[t.pays_slug][t.prestation_key] = t.prix === null ? null : Number(t.prix);
    }
    return tarifs;
  },
  ["tarifs_assistance"],
  { revalidate: 3600, tags: ["tarifs_assistance"] }
);

// Coordonnées & réseaux sociaux — pilotés depuis /admin/tarifs.
// Repli sur CONTACT_VIDE : sans base, aucune coordonnée n'est affichée, plutôt
// qu'une valeur fictive.
export const getParametresContact = unstable_cache(
  async (): Promise<ParametresContact> => {
    const supabase = createPublicClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from as any)("parametres_contact")
      .select("telephone, email, adresse, horaires, whatsapp, facebook, instagram, linkedin, tiktok, youtube")
      .maybeSingle();

    if (!data) return CONTACT_VIDE;
    return { ...CONTACT_VIDE, ...(data as Partial<ParametresContact>) };
  },
  ["parametres_contact"],
  { revalidate: 3600, tags: ["parametres_contact"] }
);

// Paramétrage immobilier (caution visite, taux réduction, limite offres).
// Repli sur les valeurs par défaut si la table est absente (pré-migration).
export const getParametresImmobilier = unstable_cache(
  async (): Promise<ParametresImmobilier> => {
    const supabase = createPublicClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from as any)("parametres_immobilier")
      .select("caution_visite, taux_max_reduction, max_offres_client")
      .maybeSingle();

    if (!data) return PARAMETRES_IMMO_DEFAUT;
    return {
      caution_visite: Number(data.caution_visite) || PARAMETRES_IMMO_DEFAUT.caution_visite,
      taux_max_reduction: Number(data.taux_max_reduction) || PARAMETRES_IMMO_DEFAUT.taux_max_reduction,
      max_offres_client: Number(data.max_offres_client) || PARAMETRES_IMMO_DEFAUT.max_offres_client,
    };
  },
  ["parametres_immobilier"],
  { revalidate: 3600, tags: ["parametres_immobilier"] }
);

// Chiffres affichés sur l'accueil (bande de preuve).
// Sans cache, chaque visite de la page la plus fréquentée déclenchait un
// balayage complet de `vehicules` juste pour compter les modèles distincts.
// Le tag "vehicules" est déjà invalidé par revalidatePublicCache().
export const getStatsAccueil = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data, count } = await supabase
      .from("vehicules")
      .select("marque, modele", { count: "exact" })
      .neq("statut", "indisponible");

    const vehiculeCount = count ?? data?.length ?? 0;
    const modeleCount = new Set(
      (data ?? []).map((v) => makeGroupKey(v.marque, v.modele))
    ).size;

    return { vehiculeCount, modeleCount };
  },
  ["stats_accueil"],
  { revalidate: 3600, tags: ["vehicules"] }
);
