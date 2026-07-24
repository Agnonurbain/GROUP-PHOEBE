import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";

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

    if (ids.length === 0) return { vehicules: [], photoMap: new Map() };

    const supabase = createPublicClient();
    const { data: allPhotos } = await supabase
      .from("vehicule_photos")
      .select("vehicule_id, url")
      .in("vehicule_id", ids)
      .order("ordre", { ascending: true });

    const photoMap = new Map<string, string>();
    for (const p of allPhotos ?? []) {
      if (!photoMap.has(p.vehicule_id)) photoMap.set(p.vehicule_id, p.url);
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

    const { data } = await query;
    return data ?? [];
  },
  ["biens_immobiliers"],
  { revalidate: 3600, tags: ["biens"] }
);

export const getBiensWithPhotos = unstable_cache(
  async (filters: Record<string, string | undefined> = {}) => {
    const biens = await getBiensImmobiliers(filters);
    const ids = biens.map((b) => b.id);

    if (ids.length === 0) return { biens: [], photoMap: new Map() };

    const supabase = createPublicClient();
    const { data: allPhotos } = await supabase
      .from("bien_medias")
      .select("bien_id, url")
      .in("bien_id", ids)
      .eq("type", "image")
      .order("ordre", { ascending: true });

    const photoMap = new Map<string, string>();
    for (const p of allPhotos ?? []) {
      if (!photoMap.has(p.bien_id)) photoMap.set(p.bien_id, p.url);
    }

    return { biens, photoMap };
  },
  ["biens_with_photos"],
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
}