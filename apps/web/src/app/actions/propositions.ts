"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Database } from "@group-phoebe/database/types";
import { SEUIL_APPROBATION_AUTO_PCT } from "@/lib/constants";
import { logAudit } from "@/lib/audit";

function getAdmin() {
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export type PropositionState = { error?: string; success?: boolean };

export async function proposerPrix(
  _prev: PropositionState,
  formData: FormData
): Promise<PropositionState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) return { error: "Non connecté." };

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.sub)
    .single();
  if (!profile || profile.role !== "operateur") {
    return { error: "Seuls les opérateurs peuvent proposer un prix." };
  }

  const vehiculeId = formData.get("vehicule_id") as string;
  const champ = formData.get("champ") as string;
  const valeurProposee = Number(formData.get("valeur_proposee"));
  const commentaire = (formData.get("commentaire") as string) || null;

  if (!vehiculeId || !champ || isNaN(valeurProposee) || valeurProposee <= 0) {
    return { error: "Champ, véhicule et valeur proposée sont obligatoires." };
  }

  if (!["prix_journalier", "prix_mensuel", "prix_vente"].includes(champ)) {
    return { error: "Champ de prix invalide." };
  }

  const admin = getAdmin();
  const { data: vehicule } = await admin
    .from("vehicules")
    .select("prix_journalier, prix_mensuel, prix_vente")
    .eq("id", vehiculeId)
    .single();

  if (!vehicule) return { error: "Véhicule introuvable." };

  const valeurActuelle = vehicule[champ as keyof typeof vehicule] as number | null;

  const reductionPct = valeurActuelle && valeurActuelle > 0
    ? Math.abs(valeurProposee - valeurActuelle) / valeurActuelle * 100
    : null;

  const autoApprouve = reductionPct !== null && reductionPct <= SEUIL_APPROBATION_AUTO_PCT;

  const { error } = await admin.from("propositions_prix").insert({
    vehicule_id: vehiculeId,
    operateur_id: user.sub,
    champ: champ as "prix_journalier" | "prix_mensuel" | "prix_vente",
    valeur_actuelle: valeurActuelle,
    valeur_proposee: valeurProposee,
    commentaire,
    ...(autoApprouve ? { statut: "acceptee" as const } : {}),
  });

  if (error) return { error: error.message };

  if (autoApprouve) {
    await admin
      .from("vehicules")
      .update({
        [champ]: valeurProposee,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", vehiculeId);

    await logAudit({
      userId: user.sub,
      action: "auto_approuver",
      tableName: "propositions_prix",
      recordId: vehiculeId,
      oldValues: { [champ]: valeurActuelle },
      newValues: { [champ]: valeurProposee, ecart_pct: reductionPct },
    });
  }

  revalidatePath("/admin/vehicules");
  revalidatePath("/admin/propositions");
  revalidatePath(`/catalogue/${vehiculeId}`);
  return { success: true };
}

export async function traiterProposition(
  _prev: PropositionState,
  formData: FormData
): Promise<PropositionState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) return { error: "Non connecté." };

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.sub)
    .single();
  if (!profile || profile.role !== "proprietaire") {
    return { error: "Seul le propriétaire peut valider ou refuser." };
  }

  const propositionId = formData.get("proposition_id") as string;
  const decision = formData.get("decision") as string;

  if (!propositionId || !["acceptee", "refusee"].includes(decision)) {
    return { error: "Décision invalide." };
  }

  const admin = getAdmin();
  const { data: prop } = await admin
    .from("propositions_prix")
    .select("*")
    .eq("id", propositionId)
    .single();

  if (!prop) return { error: "Proposition introuvable." };
  if (prop.statut !== "en_attente") {
    return { error: "Cette proposition a déjà été traitée." };
  }

  await admin
    .from("propositions_prix")
    .update({
      statut: decision as "acceptee" | "refusee",
      updated_at: new Date().toISOString(),
    })
    .eq("id", propositionId)
    .eq("statut", "en_attente");

  await logAudit({
    userId: user.sub,
    action: decision === "acceptee" ? "accepter" : "refuser",
    tableName: "propositions_prix",
    recordId: propositionId,
    oldValues: { statut: "en_attente", valeur_actuelle: prop.valeur_actuelle },
    newValues: { statut: decision, valeur_proposee: prop.valeur_proposee },
  });

  if (decision === "acceptee") {
    const champ = prop.champ as "prix_journalier" | "prix_mensuel" | "prix_vente";
    await admin
      .from("vehicules")
      .update({
        [champ]: prop.valeur_proposee,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", prop.vehicule_id);
  }

  revalidatePath("/admin/propositions");
  revalidatePath("/admin/vehicules");
  revalidatePath(`/catalogue/${prop.vehicule_id}`);
  return { success: true };
}
