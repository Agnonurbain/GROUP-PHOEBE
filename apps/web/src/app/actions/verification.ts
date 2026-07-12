"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type VerificationState = {
  error?: string;
  success?: boolean;
};

export async function soumettreDocuments(
  _prev: VerificationState,
  formData: FormData
): Promise<VerificationState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const pieceIdentite = formData.get("piece_identite") as File;
  const permisConduire = formData.get("permis_conduire") as File;

  if (!pieceIdentite?.size || !permisConduire?.size) {
    return { error: "Les deux documents sont obligatoires." };
  }

  const maxSize = 5 * 1024 * 1024; // 5 Mo
  if (pieceIdentite.size > maxSize || permisConduire.size > maxSize) {
    return { error: "Chaque fichier ne doit pas dépasser 5 Mo." };
  }

  const ext1 = pieceIdentite.name.split(".").pop();
  const ext2 = permisConduire.name.split(".").pop();

  const { error: err1 } = await supabase.storage
    .from("identity-documents")
    .upload(`${user.id}/piece_identite.${ext1}`, pieceIdentite, { upsert: true });
  if (err1) return { error: `Erreur upload pièce d'identité : ${err1.message}` };

  const { error: err2 } = await supabase.storage
    .from("identity-documents")
    .upload(`${user.id}/permis_conduire.${ext2}`, permisConduire, { upsert: true });
  if (err2) return { error: `Erreur upload permis de conduire : ${err2.message}` };

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const pieceUrl = `${baseUrl}/storage/v1/object/identity-documents/${user.id}/piece_identite.${ext1}`;
  const permisUrl = `${baseUrl}/storage/v1/object/identity-documents/${user.id}/permis_conduire.${ext2}`;

  const { error: updateError } = await supabase
    .from("users")
    .update({
      piece_identite_url: pieceUrl,
      permis_conduire_url: permisUrl,
      statut_verification: "documents_soumis",
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (updateError) return { error: `Erreur mise à jour : ${updateError.message}` };

  revalidatePath("/profil");
  return { success: true };
}
