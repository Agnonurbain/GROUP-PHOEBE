"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Database } from "@group-phoebe/database/types";
import { hasMinimumAge } from "@/lib/auth";
import { validerTelephone } from "@/lib/telephone";
import { checkRateLimit, getRemainingAttempts } from "@/lib/rate-limit";

export type AuthState = {
  error?: string;
  phone?: string;
};

export async function inscription(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const nom = formData.get("nom") as string;
  const mode = formData.get("mode") as string;
  const telephone = formData.get("telephone") as string;
  const email = formData.get("email") as string;
  const dateNaissance = formData.get("date_naissance") as string;
  const password = formData.get("password") as string;

  const identifiant = mode === "email" ? email : telephone;

  if (!nom || !identifiant || !dateNaissance || !password) {
    return { error: "Tous les champs sont obligatoires." };
  }

  if (!hasMinimumAge(dateNaissance, 21)) {
    return { error: "Vous devez avoir au moins 21 ans pour vous inscrire." };
  }

  if (password.length < 8) {
    return { error: "Le mot de passe doit contenir au moins 8 caractères." };
  }

  if (mode === "phone" && telephone) {
    const errTel = validerTelephone(telephone);
    if (errTel) return { error: errTel };
  }

  const supabase = await createClient();

  const credentials =
    mode === "email"
      ? {
          email,
          password,
          options: {
            data: { nom, display_name: nom, date_naissance: dateNaissance, role: "client" },
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/connexion`,
          },
        }
      : {
          phone: telephone,
          password,
          options: {
            data: { nom, display_name: nom, date_naissance: dateNaissance, role: "client" },
          },
        };

  const { error } = await supabase.auth.signUp(credentials);

  if (error) {
    if (error.message.includes("already registered")) {
      return {
        error:
          mode === "email"
            ? "Cette adresse email est déjà utilisée."
            : "Ce numéro de téléphone est déjà utilisé.",
      };
    }
    return { error: error.message };
  }

  if (mode === "email") {
    return { phone: "email_sent" };
  }

  const nextUrl = formData.get("redirect") as string | null;
  const otpParams = new URLSearchParams({ phone: telephone });
  if (nextUrl && nextUrl.startsWith("/")) otpParams.set("next", nextUrl);
  redirect(`/verifier-otp?${otpParams.toString()}`);
}

export async function connexion(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const identifiant = formData.get("identifiant") as string;
  const password = formData.get("password") as string;

  if (!identifiant || !password) {
    return { error: "Tous les champs sont obligatoires." };
  }

  if (!checkRateLimit(`login:${identifiant}`)) {
    return { error: "Trop de tentatives. Réessayez dans une minute." };
  }

  const supabase = await createClient();
  const isEmail = identifiant.includes("@");

  const { error, data } = await supabase.auth.signInWithPassword(
    isEmail
      ? { email: identifiant, password }
      : { phone: identifiant, password }
  );

  if (error) {
    return { error: "Identifiant ou mot de passe incorrect." };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", data.user.id)
    .single();

  const isStaff =
    profile?.role === "operateur" || profile?.role === "proprietaire";

  const next = formData.get("redirect") as string | null;
  const safeNext = next && next.startsWith("/") ? next : null;

  redirect(safeNext ?? (isStaff ? "/admin" : "/compte/profil"));
}

export async function verifierOtp(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const phone = formData.get("phone") as string;
  const token = formData.get("token") as string;
  const next = formData.get("next") as string | null;

  if (!phone || !token) {
    return { error: "Le code de vérification est obligatoire." };
  }

  if (!checkRateLimit(`otp:${phone}`)) {
    return { error: "Trop de tentatives. Réessayez dans une minute." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: "sms",
  });

  if (error) {
    return { error: "Code invalide ou expiré. Veuillez réessayer." };
  }

  const safeNext = next && next.startsWith("/") ? next : "/compte/profil";
  redirect(safeNext);
}

export async function envoyerCodeReset(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const telephone = formData.get("telephone") as string;

  if (!telephone) {
    return { error: "Le numéro de téléphone est obligatoire." };
  }

  const errTel = validerTelephone(telephone);
  if (errTel) return { error: errTel };

  if (!checkRateLimit(`reset:sms:${telephone}`)) {
    return { error: "Trop de tentatives. Réessayez dans une minute." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({ phone: telephone });

  if (error) {
    return { error: "Impossible d’envoyer le code. Vérifiez le numéro." };
  }

  redirect(
    `/verifier-otp?phone=${encodeURIComponent(telephone)}&next=/nouveau-mot-de-passe`
  );
}

export async function envoyerResetEmail(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get("email") as string;

  if (!email) {
    return { error: "L'adresse email est obligatoire." };
  }

  if (!checkRateLimit(`reset:email:${email}`)) {
    return { error: "Trop de tentatives. Réessayez dans une minute." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/nouveau-mot-de-passe`,
  });

  if (error) {
    return { error: "Impossible d'envoyer l'email. Vérifiez l'adresse." };
  }

  return { phone: "sent" };
}

export async function changerMotDePasse(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const password = formData.get("password") as string;
  const confirmation = formData.get("confirmation") as string;

  if (!password || !confirmation) {
    return { error: "Tous les champs sont obligatoires." };
  }

  if (password.length < 8) {
    return { error: "Le mot de passe doit contenir au moins 8 caractères." };
  }

  if (password !== confirmation) {
    return { error: "Les mots de passe ne correspondent pas." };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Session expirée. Veuillez recommencer." };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  redirect("/compte/profil");
}

export async function updateProfile(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const nom = formData.get("nom") as string;
  const telephone = formData.get("telephone") as string;
  const dateNaissance = formData.get("date_naissance") as string;

  if (!nom) {
    return { error: "Le nom est obligatoire." };
  }

  if (telephone) {
    const errTel = validerTelephone(telephone);
    if (errTel) return { error: errTel };
  }

  if (dateNaissance && !hasMinimumAge(dateNaissance, 21)) {
    return { error: "Vous devez avoir au moins 21 ans." };
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) {
    return { error: "Session expirée. Veuillez vous reconnecter." };
  }

  const { error } = await supabase
    .from("users")
    .update({
      nom,
      telephone: telephone || undefined,
      date_naissance: dateNaissance || undefined,
    })
    .eq("id", user.sub);

  if (error) {
    return { error: "Impossible de mettre à jour le profil." };
  }

  redirect("/compte/profil");
}

export async function renvoyerCode(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const phone = formData.get("phone") as string;

  if (!phone) {
    return { error: "Numéro de téléphone requis." };
  }

  const errTel = validerTelephone(phone);
  if (errTel) return { error: errTel };

  if (!checkRateLimit(`renvoyer:code:${phone}`)) {
    return { error: "Trop de tentatives. Réessayez dans une minute." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ phone });

  if (error) {
    return { error: "Impossible de renvoyer le code. Réessayez plus tard." };
  }

  return { phone: "resent" };
}

export async function supprimerCompte(): Promise<AuthState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) return { error: "Session expirée." };

  const admin = createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.sub);

  if (deleteError) {
    return { error: "Impossible de supprimer le compte." };
  }

  redirect("/");
}

export async function deconnexion() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
