"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateDocumentUpload } from "@/lib/upload-validation";

export type VerificationState = {
  error?: string;
  success?: boolean;
};

export async function soumettreDocuments(
  _prev: VerificationState,
  formData: FormData
): Promise<VerificationState> {
  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) return { error: "Non authentifié." };

  const pieceIdentite = formData.get("piece_identite") as File;
  const permisConduire = formData.get("permis_conduire") as File;

  if (!pieceIdentite?.size || !permisConduire?.size) {
    return { error: "Les deux documents sont obligatoires." };
  }

  let ext1: string, ext2: string;
  try {
    ({ ext: ext1 } = validateDocumentUpload(pieceIdentite));
    ({ ext: ext2 } = validateDocumentUpload(permisConduire));
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Fichier invalide." };
  }

  const { error: err1 } = await supabase.storage
    .from("identity-documents")
    .upload(`${user.sub}/piece_identite.${ext1}`, pieceIdentite, { upsert: true });
  if (err1) return { error: `Erreur upload pièce d'identité : ${err1.message}` };

  const { error: err2 } = await supabase.storage
    .from("identity-documents")
    .upload(`${user.sub}/permis_conduire.${ext2}`, permisConduire, { upsert: true });
  if (err2) return { error: `Erreur upload permis de conduire : ${err2.message}` };

  const pieceUrl = `${user.sub}/piece_identite.${ext1}`;
  const permisUrl = `${user.sub}/permis_conduire.${ext2}`;

  const { error: updateError } = await supabase
    .from("users")
    .update({
      piece_identite_url: pieceUrl,
      permis_conduire_url: permisUrl,
      statut_verification: "documents_soumis",
      motif_rejet: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.sub);

  if (updateError) return { error: `Erreur mise à jour : ${updateError.message}` };

  revalidatePath("/compte/profil");
  return { success: true };
}
