import { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { makeGroupKey } from "@/lib/vehicle-group";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://group-phoebe.com";

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/transport/catalogue`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/livraison`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/assistance`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/immobilier`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/connexion`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/inscription`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];

  const supabase = await createClient();

  const { data: vehicules } = await supabase
    .from("vehicules")
    .select("marque, modele, updated_at")
    .neq("statut", "indisponible");

  const seen = new Set<string>();
  const groupPages: MetadataRoute.Sitemap = [];

  for (const v of vehicules ?? []) {
    const key = makeGroupKey(v.marque, v.modele);
    if (seen.has(key)) continue;
    seen.add(key);

    groupPages.push({
      url: `${baseUrl}/transport/catalogue/groupe/${encodeURIComponent(key)}/choix`,
      lastModified: new Date(v.updated_at ?? new Date()),
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  return [...staticPages, ...groupPages];
}
