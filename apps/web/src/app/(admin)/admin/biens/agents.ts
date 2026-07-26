import type { SupabaseClient } from "@supabase/supabase-js";

/** Liste des agents immobiliers (id + nom du user lié), pour l'affectation. */
export async function fetchAgents(
  supabase: SupabaseClient
): Promise<{ id: string; nom: string }[]> {
  const { data: agentsRaw } = await supabase
    .from("agents_immobiliers")
    .select("id, user_id");

  const userIds = [...new Set((agentsRaw ?? []).map((a) => a.user_id))];
  const { data: users } = userIds.length
    ? await supabase.from("users").select("id, nom").in("id", userIds)
    : { data: [] };

  const nomById = new Map((users ?? []).map((u) => [u.id, u.nom]));
  return (agentsRaw ?? []).map((a) => ({
    id: a.id,
    nom: nomById.get(a.user_id) ?? "Agent",
  }));
}
