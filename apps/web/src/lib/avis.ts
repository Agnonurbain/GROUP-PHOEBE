import { unstable_cache } from "next/cache"
import { createPublicClient } from "@/lib/supabase/public"

export type AvisPublic = {
  id: string
  note: number
  titre: string | null
  commentaire: string | null
  reponse_admin: string | null
  created_at: string
  client_nom: string | null
  reference_table: string
}

export const AVIS_STATUTS = ["en_attente", "publie", "refuse"] as const
export type AvisStatut = (typeof AVIS_STATUTS)[number]

export const AVIS_STATUT_LABELS: Record<AvisStatut, string> = {
  en_attente: "En attente",
  publie: "Publié",
  refuse: "Refusé",
}

export const AVIS_STATUT_COLORS: Record<AvisStatut, string> = {
  en_attente: "bg-phoebe-gold/10 text-phoebe-gold-dark",
  publie: "bg-phoebe-green/10 text-phoebe-green-deep",
  refuse: "bg-error/10 text-error",
}

export function libelleReference(reference_table: string): string {
  const map: Record<string, string> = {
    demandes_transport: "Transport",
    demandes_immobilier: "Immobilier",
    dossiers_voyage: "Assistance",
    demandes_billet: "Billet d'avion",
    expeditions: "Livraison",
  }
  return map[reference_table] ?? reference_table
}

export function referenceHref(reference_table: string, reference_id: string): string {
  if (reference_table === "demandes_transport" || reference_table === "demandes_immobilier") {
    return `/reservation/confirmation?demande=${reference_id}`
  }
  return "/compte/reservations"
}

export const getAvisPublies = unstable_cache(
  async (limit = 20) => {
    const supabase = createPublicClient()
    const { data } = await supabase
      .from("avis")
      .select("id, note, titre, commentaire, reponse_admin, created_at, reference_table, client_id")
      .eq("statut", "publie")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (!data) return []

    const clientIds = [...new Set(data.map((a) => a.client_id))]
    const { data: users } = clientIds.length
      ? await supabase.from("users").select("id, nom").in("id", clientIds)
      : { data: [] }
    const nomMap = new Map((users ?? []).map((u) => [u.id, u.nom]))

    return data.map((a) => ({
      id: a.id,
      note: a.note,
      titre: a.titre,
      commentaire: a.commentaire,
      reponse_admin: a.reponse_admin,
      created_at: a.created_at,
      client_nom: nomMap.get(a.client_id) ?? null,
      reference_table: a.reference_table,
    })) as AvisPublic[]
  },
  ["avis_publies"],
  { revalidate: 3600, tags: ["avis"] }
)

export async function revalidateAvisCache() {
  const { revalidateTag } = await import("next/cache")
  ;(revalidateTag as (tag: string) => void)("avis")
}
