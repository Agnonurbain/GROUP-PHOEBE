"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Database } from "@group-phoebe/database/types";
import { creerSessionStripe } from "@/lib/payments/stripe";
import { creerSessionCinetPay } from "@/lib/payments/cinetpay";

export type AssistanceState = {
  error?: string;
  success?: boolean;
  dossierId?: string;
};

const PRICES: Record<string, { base: number; premium: number; express: number }> = {
  chine: { base: 150000, premium: 175000, express: 200000 },
  italie: { base: 150000, premium: 175000, express: 200000 },
  grece: { base: 85000, premium: 110000, express: 130000 },
  pologne: { base: 75000, premium: 100000, express: 120000 },
  portugal: { base: 95000, premium: 120000, express: 140000 },
  schengen: { base: 120000, premium: 145000, express: 165000 },
};

const OFFER_MAP: Record<string, { offerName: string; price: number }> = {
  "Service seul": { offerName: "Service seul", price: 0 },
  "Service + Accompagnement": { offerName: "Service + Accompagnement", price: 0 },
  "Service + Rendez-vous Express": { offerName: "Service + Rendez-vous Express", price: 0 },
};

function getAdmin() {
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function creerDossierVoyage(
  _prev: AssistanceState,
  formData: FormData
): Promise<AssistanceState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) return { error: "Vous devez être connecté." };

  const { data: profile } = await supabase
    .from("users")
    .select("id, nom, prenom, email")
    .eq("id", user.sub)
    .single();

  if (!profile) return { error: "Profil introuvable." };

  const pays = formData.get("pays") as string;
  const type = formData.get("type") as string;
  const offer = formData.get("offre") as string;
  const methode = formData.get("methode_paiement") as string || "cinetpay";

  if (!pays || !type || !offer) {
    return { error: "Pays, type et offre sont obligatoires." };
  }

  if (!["etudes", "tourisme_visa"].includes(type)) {
    return { error: "Type de dossier invalide." };
  }

  if (!["cinetpay", "stripe"].includes(methode)) {
    return { error: "Méthode de paiement invalide." };
  }

  const admin = getAdmin();

  const { data: dossier, error: dossierErr } = await admin
    .from("dossiers_voyage")
    .insert({
      client_id: user.sub,
      type: type as "etudes" | "tourisme_visa",
      pays_cible: pays,
      statut: "soumis",
    })
    .select("id")
    .single();

  if (dossierErr) return { error: dossierErr.message };

  const paysLower = pays.toLowerCase();
  const priceTier = PRICES[paysLower];
  let montant = 150000;

  if (priceTier) {
    if (offer.includes("Rendez-vous Express")) montant = priceTier.express;
    else if (offer.includes("Accompagnement")) montant = priceTier.premium;
    else montant = priceTier.base;
  }

  const { error: paiementErr } = await admin
    .from("paiements")
    .insert({
      module: "voyage",
      reference_table: "dossiers_voyage",
      reference_id: dossier.id,
      type: "montant",
      montant,
      methode: methode as "cinetpay" | "stripe",
      statut: "en_attente",
    });

  if (paiementErr) return { error: paiementErr.message };

  revalidatePath("/assistance");

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  let paymentUrl: string;
  const description = `Visa ${pays} · ${offer}`;

  try {
    if (methode === "stripe") {
      paymentUrl = await creerSessionStripe({
        montantCFA: montant,
        description,
        paiementId: dossier.id,
        successUrl: `${baseUrl}/compte/profil`,
        cancelUrl: `${baseUrl}/assistance/pays/${paysLower}`,
      });
    } else {
      paymentUrl = await creerSessionCinetPay({
        montantCFA: montant,
        description,
        paiementId: dossier.id,
        returnUrl: `${baseUrl}/compte/profil`,
        notifyUrl: `${baseUrl}/api/webhooks/cinetpay`,
      });
    }
  } catch (err) {
    return {
      error: `Erreur d'initialisation du paiement : ${err instanceof Error ? err.message : "erreur inconnue"}`,
    };
  }

  redirect(paymentUrl);
}
