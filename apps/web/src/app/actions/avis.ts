"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AvisState = { error?: string; success?: boolean };

export async function noterVehicule(
  _prev: AvisState,
  formData: FormData
): Promise<AvisState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) return { error: "Non connecté." };

  const demandeId = formData.get("demande_id") as string;
  const note = Number(formData.get("note"));
  const commentaire = (formData.get("commentaire") as string) || null;

  if (!demandeId || isNaN(note) || note < 1 || note > 5) {
    return { error: "Note entre 1 et 5 obligatoire." };
  }

  const { data: demande } = await supabase
    .from("demandes_transport")
    .select("id, client_id, vehicule_id, statut")
    .eq("id", demandeId)
    .eq("client_id", user.sub)
    .single();

  if (!demande) return { error: "Demande introuvable." };
  if (demande.statut !== "terminee") {
    return { error: "Vous ne pouvez noter qu'une location terminée." };
  }

  const { error } = await supabase.from("avis_transport").insert({
    demande_id: demandeId,
    note,
    commentaire,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Vous avez déjà noté cette location." };
    }
    return { error: error.message };
  }

  if (demande.vehicule_id) {
    revalidatePath(`/catalogue/${demande.vehicule_id}`);
  }
  return { success: true };
}
