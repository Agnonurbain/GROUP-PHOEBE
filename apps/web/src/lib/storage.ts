import { SupabaseClient } from "@supabase/supabase-js";

// Un document stocké est-il un PDF ? (sinon on le traite comme une image.)
export function isPdfPath(path: string | null | undefined): boolean {
  if (!path) return false;
  return path.toLowerCase().split("?")[0].endsWith(".pdf");
}

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
