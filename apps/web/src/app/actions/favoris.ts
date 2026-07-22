"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleFavori(vehiculeId: string) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) return { error: "Non authentifié" };

  const { data: existing } = await supabase
    .from("favoris")
    .select("id")
    .eq("user_id", user.sub)
    .eq("vehicule_id", vehiculeId)
    .maybeSingle();

  if (existing) {
    await supabase.from("favoris").delete().eq("id", existing.id);
  } else {
    await supabase
      .from("favoris")
      .insert({ user_id: user.sub, vehicule_id: vehiculeId });
  }

  revalidatePath("/transport/catalogue");
  revalidatePath(`/transport/catalogue/${vehiculeId}`);
  revalidatePath("/compte/favoris");
}
