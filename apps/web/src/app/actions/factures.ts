"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { logAudit } from "@/lib/audit"

export type FactureState = {
  error?: string
  success?: boolean
  pdf_url?: string
}

// Durée de vie du lien signé. Assez pour ouvrir le PDF, trop court pour qu'un
// lien recopié dans une conversation reste exploitable : une facture porte le
// nom, le téléphone, l'email et les montants d'un client.
const VALIDITE_LIEN_FACTURE_S = 60

export async function telechargerFacture(factureId: string): Promise<FactureState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Non authentifié." }

  // La lecture passe par la session du client : `factures_select_own` et
  // `factures_staff_select` décident qui voit quoi. Interroger en clé de service
  // ici rendrait n'importe quelle facture lisible par n'importe qui connaissant
  // un identifiant.
  const { data: facture } = await supabase
    .from("factures")
    .select("pdf_chemin")
    .eq("id", factureId)
    .single()

  if (!facture?.pdf_chemin) return { error: "Facture non disponible." }

  // Le bucket est privé : la signature se fait en clé de service, l'accès ayant
  // déjà été tranché par la requête ci-dessus.
  const admin = createAdminClient()
  const { data: signee, error } = await admin.storage
    .from("factures")
    .createSignedUrl(facture.pdf_chemin, VALIDITE_LIEN_FACTURE_S)

  if (error || !signee?.signedUrl) {
    return { error: "Lien de téléchargement indisponible." }
  }

  return { success: true, pdf_url: signee.signedUrl }
}

// La numérotation vit dans la fonction SQL `prochain_numero_facture()`, appelée
// par `genererEtStockerFacture` avec le client déjà en main. Elle n'a rien à
// faire ici : tout export d'un fichier "use server" est une route appelable
// depuis le navigateur, et celle-ci consommait un numéro de facture par appel,
// sans authentification.

export type ParametresFacturationState = {
  error?: string
  success?: boolean
}

export async function modifierParametresFacturation(
  _prev: ParametresFacturationState,
  formData: FormData
): Promise<ParametresFacturationState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Non authentifié." }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()
  if (profile?.role !== "proprietaire") {
    return { error: "Accès refusé : propriétaire requis." }
  }

  const tauxTva = Number(formData.get("taux_tva"))
  const prefixe = ((formData.get("prefixe_facture") as string) || "").trim()
  const emailCc = ((formData.get("email_cc") as string) || "").trim()

  // 0 est une valeur légitime (exonération) : la borne porte sur la plage, pas
  // sur la véracité — `!tauxTva` rejetterait une TVA à 0.
  if (!Number.isFinite(tauxTva) || tauxTva < 0 || tauxTva > 100) {
    return { error: "La TVA doit être comprise entre 0 et 100 %." }
  }
  if (!prefixe) return { error: "Le préfixe de facture est obligatoire." }
  if (!/^[A-Z0-9-]{1,10}$/.test(prefixe)) {
    return { error: "Le préfixe doit être en majuscules, 10 caractères au plus." }
  }

  const admin = createAdminClient()

  const { data: ancien } = await admin
    .from("parametres_facturation")
    .select("taux_tva, prefixe_facture, email_cc")
    .eq("id", true)
    .single()

  const { error } = await admin
    .from("parametres_facturation")
    .update({
      taux_tva: tauxTva,
      prefixe_facture: prefixe,
      email_cc: emailCc || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", true)

  if (error) return { error: error.message }

  await logAudit({
    userId: user.id,
    action: "modifier_parametres_facturation",
    tableName: "parametres_facturation",
    oldValues: ancien ?? undefined,
    newValues: { taux_tva: tauxTva, prefixe_facture: prefixe, email_cc: emailCc || null },
  })

  revalidatePath("/admin/factures")
  return { success: true }
}
