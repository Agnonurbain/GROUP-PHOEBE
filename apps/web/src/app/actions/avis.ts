"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidateAvisCache } from "@/lib/avis"

export type AvisState = {
  error?: string
  success?: boolean
}

export async function soumettreAvis(
  prevState: AvisState,
  formData: FormData
): Promise<AvisState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Vous devez être connecté." }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()
  if (profile?.role !== "client") return { error: "Seuls les clients peuvent laisser un avis." }

  const reference_table = formData.get("reference_table") as string
  const reference_id = formData.get("reference_id") as string
  const note = parseInt(formData.get("note") as string)
  const titre = formData.get("titre") as string | null
  const commentaire = formData.get("commentaire") as string | null

  if (!reference_table || !reference_id) return { error: "Réservation requise." }
  if (isNaN(note) || note < 1 || note > 5) return { error: "Note invalide (1-5)." }

  const { error } = await supabase.from("avis").insert({
    reference_table,
    reference_id,
    client_id: user.id,
    note,
    titre: titre || null,
    commentaire: commentaire || null,
  })

  if (error) {
    if (error.code === "23505") return { error: "Vous avez déjà laissé un avis pour cette réservation." }
    return { error: error.message }
  }

  revalidateAvisCache()
  return { success: true }
}

export async function modererAvis(
  avisId: string,
  statut: "publie" | "refuse",
  reponse?: string
): Promise<AvisState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Non authentifié." }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()
  if (!profile || !["operateur", "proprietaire"].includes(profile.role)) {
    return { error: "Accès refusé." }
  }

  const { error } = await supabase
    .from("avis")
    .update({
      statut,
      modere_at: new Date().toISOString(),
      modere_par: user.id,
      ...(reponse !== undefined ? { reponse_admin: reponse || null } : {}),
    })
    .eq("id", avisId)
  if (error) return { error: error.message }

  revalidateAvisCache()
  return { success: true }
}

export async function modererAvisForm(
  prevState: AvisState,
  formData: FormData
): Promise<AvisState> {
  const avisId = formData.get("avis_id") as string
  const statut = formData.get("statut") as "publie" | "refuse"
  const reponse = formData.get("reponse_admin") as string | null
  return modererAvis(avisId, statut, reponse || undefined)
}
