"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";

async function rollbackUser(
  admin: ReturnType<typeof createAdminClient>,
  userId: string
) {
  const { error: delPublic } = await admin
    .from("users")
    .delete()
    .eq("id", userId);

  const { error: delAuth } = await admin.auth.admin.deleteUser(userId);

  if (delPublic || delAuth) {
    console.error("Rollback partiel lors de la création de compte interne", {
      userId,
      delPublic: delPublic?.message,
      delAuth: delAuth?.message,
    });
  }
}

async function requireStaff() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) throw new Error("Non authentifié");

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.sub)
    .single();
  if (!profile || !["operateur", "proprietaire"].includes(profile.role)) {
    throw new Error("Accès refusé");
  }
  return { userId: user.sub as string, role: profile.role };
}

export type AdminState = {
  error?: string;
  success?: boolean;
  createdLogin?: string;
  createdPassword?: string;
};

export async function validerVerification(
  userId: string
): Promise<AdminState> {
  const staff = await requireStaff();
  const supabase = await createClient();

  const { error } = await supabase
    .from("users")
    .update({
      statut_verification: "verifie",
      verifie_par: staff.userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .eq("statut_verification", "documents_soumis");

  if (error) return { error: error.message };

  await logAudit({
    userId: staff.userId,
    action: "verifier",
    tableName: "users",
    recordId: userId,
    oldValues: { statut_verification: "documents_soumis" },
    newValues: { statut_verification: "verifie" },
  });

  revalidatePath("/admin/verifications");
  return { success: true };
}

export async function rejeterVerification(
  userId: string,
  motif: string
): Promise<AdminState> {
  const staff = await requireStaff();

  if (!motif.trim()) {
    return { error: "Le motif de rejet est obligatoire." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("users")
    .update({
      statut_verification: "rejete",
      motif_rejet: motif.trim(),
      verifie_par: staff.userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .eq("statut_verification", "documents_soumis");

  if (error) return { error: error.message };

  await logAudit({
    userId: staff.userId,
    action: "refuser",
    tableName: "users",
    recordId: userId,
    oldValues: { statut_verification: "documents_soumis" },
    newValues: { statut_verification: "rejete", motif_rejet: motif.trim() },
  });

  revalidatePath("/admin/verifications");
  return { success: true };
}

export async function creerCompteInterne(
  _prev: AdminState,
  formData: FormData
): Promise<AdminState> {
  const staff = await requireStaff();
  if (staff.role !== "proprietaire") {
    return { error: "Seul le propriétaire peut créer des comptes internes." };
  }

  const nom = formData.get("nom") as string;
  const telephone = formData.get("telephone") as string;
  const role = formData.get("role") as "operateur" | "livreur" | "agent_immobilier";
  const password = formData.get("password") as string;
  const zoneCouverture = ((formData.get("zone_couverture") as string) || "").trim();

  if (!nom || !telephone || !role || !password) {
    return { error: "Tous les champs sont obligatoires." };
  }

  if (!["operateur", "livreur", "agent_immobilier"].includes(role)) {
    return { error: "Rôle invalide." };
  }

  // La zone sert à l'affectation automatique d'un bien à sa création
  // (autoAssignAgent) : sans elle, l'agent existe mais ne reçoit jamais de bien.
  if (role === "agent_immobilier" && !zoneCouverture) {
    return { error: "La zone de couverture est obligatoire pour un agent immobilier." };
  }

  if (password.length < 8) {
    return { error: "Le mot de passe doit contenir au moins 8 caractères." };
  }

  const isEmail = telephone.includes("@");
  const admin = createAdminClient();

  const { data, error: authError } = await admin.auth.admin.createUser({
    [isEmail ? "email" : "phone"]: telephone,
    password,
    [isEmail ? "email_confirm" : "phone_confirm"]: true,
    user_metadata: { nom },
  });

  if (authError) {
    if (authError.message.includes("already been registered")) {
      return { error: "Ce numéro de téléphone est déjà utilisé." };
    }
    return { error: authError.message };
  }

  const { error: roleError } = await admin
    .from("users")
    .update({ role })
    .eq("id", data.user.id);

  if (roleError) {
    await rollbackUser(admin, data.user.id);
    return { error: roleError.message };
  }

  if (role === "livreur") {
    const { error: livreurError } = await admin
      .from("livreurs")
      .insert({ user_id: data.user.id });

    if (livreurError) {
      await rollbackUser(admin, data.user.id);
      return { error: livreurError.message };
    }
  }

  if (role === "agent_immobilier") {
    const { error: agentError } = await admin
      .from("agents_immobiliers")
      .insert({ user_id: data.user.id, zone_couverture: zoneCouverture });

    if (agentError) {
      await rollbackUser(admin, data.user.id);
      return { error: agentError.message };
    }
  }

  await logAudit({
    userId: staff.userId,
    action: "creer",
    tableName: "users",
    recordId: data.user.id,
    newValues: { nom, telephone, role, ...(zoneCouverture ? { zone_couverture: zoneCouverture } : {}) },
  });

  revalidatePath("/admin/comptes");
  revalidatePath("/admin/demandes-immobilier");
  return { success: true, createdLogin: telephone, createdPassword: password };
}

export async function desactiverCompteInterne(
  userId: string,
  motif: string
): Promise<AdminState> {
  const staff = await requireStaff();
  if (staff.role !== "proprietaire") {
    return { error: "Seul le propriétaire peut désactiver des comptes." };
  }

  if (!motif.trim()) {
    return { error: "Le motif est obligatoire." };
  }

  const supabase = await createClient();
  const { data: target } = await supabase
    .from("users")
    .select("role, nom")
    .eq("id", userId)
    .single();

  if (!target || !["operateur", "livreur", "agent_immobilier"].includes(target.role)) {
    return { error: "Ce compte ne peut pas être désactivé." };
  }

  const admin = createAdminClient();

  const { error: updateErr } = await admin
    .from("users")
    .update({ role: "desactive", updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (updateErr) return { error: updateErr.message };

  await admin.auth.admin.updateUserById(userId, {
    ban_duration: "876000h",
  });

  await logAudit({
    userId: staff.userId,
    action: "desactiver",
    tableName: "users",
    recordId: userId,
    oldValues: { role: target.role, nom: target.nom },
    newValues: { role: "desactive", motif: motif.trim() },
  });

  revalidatePath("/admin/comptes");
  return { success: true };
}
