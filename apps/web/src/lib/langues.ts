import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";

export const LANGUE_COOKIE = "phoebe_langue";

export interface Langue {
  code: string;
  nom: string;
  drapeau: string | null;
  defaut: boolean;
  actif: boolean;
  ordre: number;
}

export const getLangues = unstable_cache(
  async (): Promise<Langue[]> => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("langues")
      .select("*")
      .eq("actif", true)
      .order("ordre", { ascending: true });
    return (data ?? []) as Langue[];
  },
  ["langues"],
  { revalidate: 3600, tags: ["langues"] }
);

export async function getLangueDefaut(): Promise<Langue | undefined> {
  const langues = await getLangues();
  return langues.find((l) => l.defaut);
}

export function detecterLangue(
  acceptLanguage?: string,
  cookieLangue?: string
): string {
  if (cookieLangue) return cookieLangue;
  if (acceptLanguage) {
    const code = acceptLanguage
      .split(",")[0]
      ?.split("-")[0]
      ?.split(";")[0]
      ?.trim()
      .toLowerCase();
    if (code && code.length === 2) return code;
  }
  return "fr";
}
