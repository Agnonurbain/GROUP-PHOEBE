import { SupabaseClient } from "@supabase/supabase-js";

export async function getSignedDocUrl(
  supabase: SupabaseClient,
  path: string | null
): Promise<string | null> {
  if (!path) return null;

  const cleanPath = path.includes("/storage/v1/object/")
    ? path.split("identity-documents/")[1]
    : path;

  if (!cleanPath) return null;

  const { data } = await supabase.storage
    .from("identity-documents")
    .createSignedUrl(cleanPath, 3600);

  return data?.signedUrl ?? null;
}
