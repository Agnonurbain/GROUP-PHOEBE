"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
};

export async function validerVerification(
  userId: string
): Promise<AdminState> {
  await requireStaff();
  const supabase = await createClient();

  const { error } = await supabase
    .from("users")
    .update({
      statut_verification: "verifie",
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .eq("statut_verification", "documents_soumis");

  if (error) return { error: error.message };

  revalidatePath("/admin/verifications");
  return { success: true };
}

export async function rejeterVerification(
  userId: string
): Promise<AdminState> {
  await requireStaff();
  const supabase = await createClient();

  const { error } = await supabase
    .from("users")
    .update({
      statut_verification: "rejete",
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .eq("statut_verification", "documents_soumis");

  if (error) return { error: error.message };

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
  const role = formData.get("role") as "operateur" | "livreur";
  const password = formData.get("password") as string;

  if (!nom || !telephone || !role || !password) {
    return { error: "Tous les champs sont obligatoires." };
  }

  if (!["operateur", "livreur"].includes(role)) {
    return { error: "Rôle invalide." };
  }

  if (password.length < 8) {
    return { error: "Le mot de passe doit contenir au moins 8 caractères." };
  }

  const admin = createAdminClient();

  const { data, error: authError } = await admin.auth.admin.createUser({
    phone: telephone,
    password,
    phone_confirm: true,
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

  revalidatePath("/admin/comptes");
  return { success: true };
}
