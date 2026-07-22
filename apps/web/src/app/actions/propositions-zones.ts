"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Database } from "@group-phoebe/database/types";
import { SEUIL_APPROBATION_AUTO_PCT } from "@/lib/constants";
import { logAudit } from "@/lib/audit";
import { notifier } from "@/lib/notifications";

function getAdmin() {
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export type PropositionZoneState = { error?: string; success?: boolean };

const CHAMPS_MODIFIABLES = [
  "coefficient_majoration",
  "caution_multiplicateur",
  "km_inclus_par_jour",
  "supplement_km_fcfa",
  "tarif_chauffeur_journalier",
] as const;

export async function proposerModificationZone(
  _prev: PropositionZoneState,
  formData: FormData
): Promise<PropositionZoneState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) return { error: "Non connecté." };

  const { data: profile } = await supabase
    .from("users")
    .select("role, nom")
    .eq("id", user.sub)
    .single();
  if (!profile || profile.role !== "operateur") {
    return { error: "Seuls les opérateurs peuvent proposer une modification." };
  }

  const zoneId = formData.get("zone_id") as string;
  const champ = formData.get("champ") as string;
  const valeurProposee = formData.get("valeur_proposee") as string;
  const commentaire = (formData.get("commentaire") as string) || null;

  if (!zoneId || !champ || !valeurProposee) {
    return { error: "Zone, champ et valeur proposée sont obligatoires." };
  }

  if (!CHAMPS_MODIFIABLES.includes(champ as typeof CHAMPS_MODIFIABLES[number])) {
    return { error: "Champ invalide." };
  }

  const admin = getAdmin();
  const { data: zone } = await admin
    .from("zones_tarifaires")
    .select("*")
    .eq("id", zoneId)
    .single();

  if (!zone) return { error: "Zone introuvable." };

  const valeurActuelle = String((zone as Record<string, unknown>)[champ] ?? "");

  const numActuel = parseFloat(valeurActuelle);
  const numPropose = parseFloat(valeurProposee);
  const reductionPct = !isNaN(numActuel) && numActuel > 0 && !isNaN(numPropose)
    ? Math.abs(numPropose - numActuel) / numActuel * 100
    : null;

  const autoApprouve = reductionPct !== null && reductionPct <= SEUIL_APPROBATION_AUTO_PCT;

  const { error } = await supabase.from("propositions_zones_tarifaires" as never).insert({
    zone_id: zoneId,
    operateur_id: user.sub,
    champ,
    valeur_actuelle: valeurActuelle || null,
    valeur_proposee: valeurProposee,
    commentaire,
    ...(autoApprouve ? { statut: "acceptee" } : {}),
  } as never);

  if (error) return { error: error.message };

  if (!autoApprouve) {
    const { data: proprios } = await supabase
      .from("users")
      .select("id, telephone")
      .eq("role", "proprietaire");

    for (const p of proprios ?? []) {
      await notifier({
        userId: p.id,
        evenement: "Nouvelle proposition de modification de zone",
        contenu: `Une modification de ${champ} a été proposée pour la zone ${zone.nom} par ${profile.nom}. Consultez-la dans votre back-office.`,
        telephone: p.telephone ?? undefined,
      });
    }
  }

  if (autoApprouve) {
    await admin
      .from("zones_tarifaires")
      .update({
        [champ]: isNaN(numPropose) ? valeurProposee : numPropose,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", zoneId);

    await logAudit({
      userId: user.sub,
      action: "auto_approuver_zone",
      tableName: "zones_tarifaires",
      recordId: zoneId,
      oldValues: { [champ]: valeurActuelle },
      newValues: { [champ]: valeurProposee, ecart_pct: reductionPct },
    });
  }

  revalidatePath("/admin/vehicules");
  revalidatePath("/admin/propositions");
  return { success: true };
}

export async function traiterPropositionZone(
  _prev: PropositionZoneState,
  formData: FormData
): Promise<PropositionZoneState> {
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
  const { data: rawProp } = await admin
    .from("propositions_zones_tarifaires" as never)
    .select("*")
    .eq("id", propositionId)
    .single() as never;

  const prop = rawProp as { id: string; zone_id: string; champ: string; valeur_proposee: string; valeur_actuelle: string | null; statut: string } | null;

  if (!prop) return { error: "Proposition introuvable." };
  if (prop.statut !== "en_attente") {
    return { error: "Cette proposition a déjà été traitée." };
  }

  await admin
    .from("propositions_zones_tarifaires" as never)
    .update({
      statut: decision,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", propositionId)
    .eq("statut", "en_attente");

  await logAudit({
    userId: user.sub,
    action: decision === "acceptee" ? "accepter_zone" : "refuser_zone",
    tableName: "propositions_zones_tarifaires",
    recordId: propositionId,
    oldValues: { statut: "en_attente", valeur_actuelle: prop.valeur_actuelle },
    newValues: { statut: decision, valeur_proposee: prop.valeur_proposee },
  });

  if (decision === "acceptee") {
    const numVal = parseFloat(prop.valeur_proposee);
    await admin
      .from("zones_tarifaires")
      .update({
        [prop.champ]: isNaN(numVal) ? prop.valeur_proposee : numVal,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", prop.zone_id);
  }

  revalidatePath("/admin/propositions");
  revalidatePath("/admin/tarifs");
  return { success: true };
}
