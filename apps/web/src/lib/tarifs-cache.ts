import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";

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

export const getCommunes = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("communes")
      .select("*")
      .order("nom", { ascending: true });
    return data ?? [];
  },
  ["communes"],
  { revalidate: 3600, tags: ["communes"] }
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

export const getVehiculesPrixBase = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("vehicules")
      .select("categorie, prix_journalier")
      .not("prix_journalier", "is", null)
      .gt("prix_journalier", 0);
    return data ?? [];
  },
  ["vehicules_prix_base"],
  { revalidate: 3600, tags: ["vehicules_prix"] }
);

export const getCategoriesVehicules = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("vehicules")
      .select("categorie")
      .not("prix_journalier", "is", null)
      .gt("prix_journalier", 0);
    return data ?? [];
  },
  ["categories_vehicules"],
  { revalidate: 3600, tags: ["categories"] }
);

export const getZonesWithCommunes = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const [{ data: zones }, { data: communes }] = await Promise.all([
      supabase.from("zones_tarifaires").select("*").order("ordre", { ascending: true }),
      supabase.from("communes").select("id, nom, zone_id").order("nom"),
    ]);
    return { zones: zones ?? [], communes: communes ?? [] };
  },
  ["zones_with_communes"],
  { revalidate: 3600, tags: ["zones", "communes"] }
);

export async function revalidateTarifsCache() {
  const { revalidateTag } = await import("next/cache");
  (revalidateTag as (tag: string) => void)("zones");
  (revalidateTag as (tag: string) => void)("communes");
  (revalidateTag as (tag: string) => void)("tarifs");
  (revalidateTag as (tag: string) => void)("vehicules_prix");
  (revalidateTag as (tag: string) => void)("categories");
}