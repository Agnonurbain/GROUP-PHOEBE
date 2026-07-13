"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type RemboursementState = {
  error?: string;
  success?: boolean;
};

export async function marquerRembourse(
  _prev: RemboursementState,
  formData: FormData
): Promise<RemboursementState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["operateur", "proprietaire"].includes(profile.role)) {
    return { error: "Accès refusé." };
  }

  const paiementId = formData.get("paiement_id") as string;
  if (!paiementId) return { error: "ID paiement manquant." };

  const { error } = await supabase
    .from("paiements")
    .update({ statut: "rembourse" })
    .eq("id", paiementId)
    .eq("statut", "remboursement_requis");

  if (error) return { error: error.message };

  revalidatePath("/admin/remboursements");
  return { success: true };
}
