"use server"

import { createClient } from "@/lib/supabase/server"
import { err } from "@/lib/i18n/erreurs";
import { revalidateAvisCache } from "@/lib/avis"

export type AvisState = {
  error?: string
  success?: boolean
}

/**
 * Motifs renvoyés par `public.avis_refus_motif` (00077), mis en français.
 *
 * `introuvable` couvre volontairement deux cas — la prestation n'existe pas, ou
 * elle n'est pas la vôtre. Les distinguer indiquerait à un curieux quels
 * identifiants existent.
 */
const MESSAGES_REFUS: Record<string, string> = {
  non_connecte: "Vous devez être connecté.",
  service_inconnu: "Ce service n'accepte pas d'avis.",
  introuvable: "Réservation introuvable.",
  non_terminee: "Vous pourrez donner votre avis une fois la prestation terminée.",
  delai_depasse: "Le délai pour donner votre avis sur cette prestation est écoulé.",
}

export async function soumettreAvis(
  prevState: AvisState,
  formData: FormData
): Promise<AvisState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: await err("vousDevezEtreConnecte") }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()
  if (profile?.role !== "client") return { error: await err("seulsLesClientsPeuventLaisserUn") }

  const reference_table = formData.get("reference_table") as string
  const reference_id = formData.get("reference_id") as string
  const note = parseInt(formData.get("note") as string)
  const titre = formData.get("titre") as string | null
  const commentaire = formData.get("commentaire") as string | null

  if (!reference_table || !reference_id) return { error: await err("reservationRequise") }
  if (isNaN(note) || note < 1 || note > 5) return { error: await err("noteInvalide15") }

  // La règle vit en base (`avis_refus_motif`, 00077) et la policy d'insertion
  // s'en sert : cet appel ne garde rien, il sert à dire POURQUOI plutôt que de
  // laisser remonter une violation de policy que personne ne peut lire.
  const { data: motif } = await supabase.rpc("avis_refus_motif", {
    p_reference_table: reference_table,
    p_reference_id: reference_id,
  })
  if (motif) return { error: MESSAGES_REFUS[motif] ?? MESSAGES_REFUS.introuvable }

  const { error } = await supabase.from("avis").insert({
    reference_table,
    reference_id,
    client_id: user.id,
    note,
    titre: titre || null,
    commentaire: commentaire || null,
  })

  if (error) {
    if (error.code === "23505") return { error: await err("vousAvezDejaLaisseUnAvis") }
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
  if (!user) return { error: await err("nonAuthentifie") }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()
  if (!profile || !["operateur", "proprietaire"].includes(profile.role)) {
    return { error: await err("accesRefuse") }
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
