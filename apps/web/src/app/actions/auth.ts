"use server";

import { redirect } from "next/navigation";
import { err } from "@/lib/i18n/erreurs";
import { accueilSelonRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Database } from "@group-phoebe/database/types";
import { hasMinimumAge } from "@/lib/auth";
import { validerTelephone, normaliserTelephone } from "@/lib/telephone";
import { checkRateLimit } from "@/lib/rate-limit";

export type AuthState = {
  error?: string;
  success?: boolean;
  /** Un e-mail de confirmation d'inscription a été envoyé. */
  emailSent?: boolean;
  /** Un code (SMS ou e-mail) a été envoyé ou renvoyé. */
  codeSent?: boolean;
};

/** Clé de limitation stable : sans normalisation, ajouter une espace au
 *  numéro ou changer la casse de l'e-mail créait un nouveau compteur, ce qui
 *  rendait la limite contournable. */
function cleLimite(prefixe: string, identifiant: string): string {
  const compact = normaliserTelephone(identifiant) ?? identifiant.trim().toLowerCase();
  return `${prefixe}:${compact}`;
}

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
    return { error: await err("tousLesChampsSontObligatoires") };
  }

  // 18 ans : majorité légale pour ouvrir un compte. La contrainte propre à la
  // location de véhicule ne doit pas bloquer un dossier visa ou un envoi de colis.
  if (!hasMinimumAge(dateNaissance, 18)) {
    return { error: await err("vousDevezAvoirAuMoins18") };
  }

  if (password.length < 8) {
    return { error: await err("leMotDePasseDoitContenir") };
  }

  let telephoneNormalise: string | null = null;
  if (mode === "phone") {
    const errTel = validerTelephone(telephone);
    if (errTel) return { error: errTel };
    telephoneNormalise = normaliserTelephone(telephone);
    if (!telephoneNormalise) return { error: await err("formatDeTelephoneInvalide") };
  }

  // Seule action d'authentification qui n'était pas limitée — or une inscription
  // par téléphone déclenche l'envoi d'un SMS facturé.
  if (!checkRateLimit(cleLimite("signup", identifiant))) {
    return { error: await err("tropDeTentativesReessayezDansUne") };
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
          // Valeur NORMALISÉE : « +225 07 00 00 00 00 » et « +2250700000000 »
          // créeraient sinon deux identités, et le compte deviendrait
          // inaccessible selon la façon dont l'utilisateur retape son numéro.
          phone: telephoneNormalise!,
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
    return { emailSent: true };
  }

  const nextUrl = formData.get("redirect") as string | null;
  const otpParams = new URLSearchParams({ phone: telephoneNormalise! });
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
    return { error: await err("tousLesChampsSontObligatoires") };
  }

  if (!checkRateLimit(cleLimite("login", identifiant))) {
    return { error: await err("tropDeTentativesReessayezDansUne") };
  }

  const supabase = await createClient();
  const isEmail = identifiant.includes("@");

  // Même normalisation qu'à l'inscription, sinon un compte créé avec un numéro
  // espacé serait introuvable à la connexion.
  const telephone = isEmail ? null : normaliserTelephone(identifiant);
  if (!isEmail && !telephone) {
    return { error: await err("identifiantOuMotDePasseIncorrect") };
  }

  const { error, data } = await supabase.auth.signInWithPassword(
    isEmail
      ? { email: identifiant.trim(), password }
      : { phone: telephone!, password }
  );

  if (error) {
    return { error: await err("identifiantOuMotDePasseIncorrect") };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", data.user.id)
    .single();

  const next = formData.get("redirect") as string | null;
  const safeNext = next && next.startsWith("/") ? next : null;

  redirect(safeNext ?? accueilSelonRole(profile?.role));
}

export async function verifierOtp(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const phone = formData.get("phone") as string;
  const token = formData.get("token") as string;
  const next = formData.get("next") as string | null;

  if (!phone || !token) {
    return { error: await err("leCodeDeVerificationEstObligatoire") };
  }

  const phoneNormalise = normaliserTelephone(phone);
  if (!phoneNormalise) return { error: await err("numeroDeTelephoneInvalide") };

  if (!checkRateLimit(cleLimite("otp", phone))) {
    return { error: await err("tropDeTentativesReessayezDansUne") };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.verifyOtp({
    phone: phoneNormalise,
    token,
    type: "sms",
  });

  if (error) {
    return { error: await err("codeInvalideOuExpireVeuillezReessayer") };
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
    return { error: await err("leNumeroDeTelephoneEstObligatoire") };
  }

  const errTel = validerTelephone(telephone);
  if (errTel) return { error: errTel };

  const telephoneNormalise = normaliserTelephone(telephone);
  if (!telephoneNormalise) return { error: await err("formatDeTelephoneInvalide") };

  if (!checkRateLimit(cleLimite("reset:sms", telephone))) {
    return { error: await err("tropDeTentativesReessayezDansUne") };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({ phone: telephoneNormalise });

  if (error) {
    return { error: await err("impossibleDEnvoyerLeCodeVerifiez") };
  }

  redirect(
    `/verifier-otp?phone=${encodeURIComponent(telephoneNormalise)}&next=/nouveau-mot-de-passe`
  );
}

export async function envoyerResetEmail(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get("email") as string;

  if (!email) {
    return { error: await err("lAdresseEmailEstObligatoire") };
  }

  if (!checkRateLimit(cleLimite("reset:email", email))) {
    return { error: await err("tropDeTentativesReessayezDansUne") };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/nouveau-mot-de-passe`,
  });

  if (error) {
    return { error: await err("impossibleDEnvoyerLEmailVerifiez") };
  }

  return { codeSent: true };
}

export async function changerMotDePasse(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const password = formData.get("password") as string;
  const confirmation = formData.get("confirmation") as string;

  if (!password || !confirmation) {
    return { error: await err("tousLesChampsSontObligatoires") };
  }

  if (password.length < 8) {
    return { error: await err("leMotDePasseDoitContenir") };
  }

  if (password !== confirmation) {
    return { error: await err("lesMotsDePasseNeCorrespondent") };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: await err("sessionExpireeVeuillezRecommencer") };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  redirect("/compte/profil");
}

// Changement de mot de passe depuis le profil (compte email/telephone).
// Verifie le mot de passe ACTUEL avant de le remplacer : une session volee ne
// suffit pas a changer le mot de passe sans connaitre l'ancien.
export async function changerMotDePasseProfil(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const actuel = formData.get("mot_de_passe_actuel") as string;
  const nouveau = formData.get("nouveau_mot_de_passe") as string;
  const confirmation = formData.get("confirmation") as string;

  if (!actuel || !nouveau || !confirmation) {
    return { error: await err("tousLesChampsSontObligatoires") };
  }
  if (nouveau.length < 8) {
    return { error: await err("leNouveauMotDePasseDoit") };
  }
  if (nouveau !== confirmation) {
    return { error: await err("lesMotsDePasseNeCorrespondent") };
  }
  if (nouveau === actuel) {
    return { error: await err("leNouveauMotDePasseDoit2") };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: await err("sessionExpireeVeuillezVousReconnecter") };
  }
  if (!user.email && !user.phone) {
    return { error: await err("ceCompteNUtilisePasDe") };
  }

  // Verifie le mot de passe actuel sur un client jetable : signInWithPassword
  // n'affecte pas la session courante (persistSession desactive).
  const verif = createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  const { error: verifErr } = await verif.auth.signInWithPassword(
    user.email
      ? { email: user.email, password: actuel }
      : { phone: user.phone!, password: actuel }
  );
  if (verifErr) {
    return { error: await err("motDePasseActuelIncorrect") };
  }

  const { error } = await supabase.auth.updateUser({ password: nouveau });
  if (error) {
    return { error: error.message };
  }

  redirect("/compte/profil?mdp=ok");
}

export async function updateProfile(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const nom = formData.get("nom") as string;
  const telephone = formData.get("telephone") as string;
  const dateNaissance = formData.get("date_naissance") as string;

  if (!nom) {
    return { error: await err("leNomEstObligatoire") };
  }

  let telephoneNormalise: string | null = null;
  if (telephone) {
    const errTel = validerTelephone(telephone);
    if (errTel) return { error: errTel };
    telephoneNormalise = normaliserTelephone(telephone);
    if (!telephoneNormalise) return { error: await err("formatDeTelephoneInvalide") };
  }

  // Aligné sur l'inscription. Les 21 ans restent exigés à la vérification
  // d'identité (compte/verification), seule porte d'accès à la location.
  if (dateNaissance && !hasMinimumAge(dateNaissance, 18)) {
    return { error: await err("vousDevezAvoirAuMoins182") };
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) {
    return { error: await err("sessionExpireeVeuillezVousReconnecter") };
  }

  const { error } = await supabase
    .from("users")
    .update({
      nom,
      telephone: telephoneNormalise || undefined,
      date_naissance: dateNaissance || undefined,
    })
    .eq("id", user.sub);

  if (error) {
    return { error: await err("impossibleDeMettreAJourLe") };
  }

  redirect("/compte/profil");
}

export async function renvoyerCode(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const phone = formData.get("phone") as string;

  if (!phone) {
    return { error: await err("numeroDeTelephoneRequis") };
  }

  const errTel = validerTelephone(phone);
  if (errTel) return { error: errTel };

  const phoneNormalise = normaliserTelephone(phone);
  if (!phoneNormalise) return { error: await err("formatDeTelephoneInvalide") };

  if (!checkRateLimit(cleLimite("renvoyer:code", phone))) {
    return { error: await err("tropDeTentativesReessayezDansUne") };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ phone: phoneNormalise });

  if (error) {
    return { error: await err("impossibleDeRenvoyerLeCodeReessayez") };
  }

  return { codeSent: true };
}

export async function supprimerCompte(): Promise<AuthState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) return { error: await err("sessionExpiree") };

  const admin = createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.sub);

  if (deleteError) {
    return { error: await err("impossibleDeSupprimerLeCompte") };
  }

  redirect("/");
}

export async function deconnexion() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
