"use client";

import { useActionState, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  PHONE_INPUT_MODE,
  PHONE_PATTERN,
  PHONE_PLACEHOLDER,
  PHONE_AIDE,
} from "@/lib/telephone";
import { inscription, type AuthState } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";
import { PasswordInput } from "@/components/password-input";
import { GoogleButton } from "@/components/google-button";
import { ScrollReveal } from "@/components/effects";
import { Tabs, TabsList, TabsTrigger } from "@/components/shadcn/tabs";

export default function InscriptionForm() {
  const [state, action] = useActionState<AuthState, FormData>(inscription, {});
  const [mode, setMode] = useState<"phone" | "email">("phone");
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "";

  const maxDate = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().split("T")[0];
  }, []);

  return (
    <ScrollReveal variant="scale-in">
      <h1 className="text-2xl font-bold tracking-tight text-phoebe-anthracite sm:text-3xl">Créer un compte</h1>
      <p className="mt-2 mb-8 text-sm text-phoebe-anthracite/70">Rejoignez GROUP PHOEBE et accédez à nos services premium</p>

      {state.error && (
        <div className="animate-fade-in mb-6 flex items-start gap-3 rounded-xl border border-error/20 bg-error/5 px-4 py-3.5 text-sm text-error">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 shrink-0 opacity-70">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
          {state.error}
        </div>
      )}

      {state.emailSent && (
        <div className="animate-fade-in mb-6 rounded-xl border border-phoebe-green/20 bg-phoebe-green/5 px-4 py-3.5 text-sm text-phoebe-green-deep">
          <p className="font-semibold">Compte créé avec succès !</p>
          <p className="mt-1 text-phoebe-green-deep/80">Un email de confirmation a été envoyé. Vérifiez votre boîte de réception pour activer votre compte.</p>
        </div>
      )}

      <GoogleButton label="S'inscrire avec Google" />

      <div className="my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-phoebe-gold/30 to-transparent" />
        <span className="text-xs font-medium uppercase tracking-wider text-phoebe-gold-dark">ou</span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-phoebe-gold/30 to-transparent" />
      </div>

      {/* L'ancien sélecteur n'exposait aucun rôle ni état : un lecteur d'écran
          ne pouvait pas savoir quel mode était actif. */}
      <Tabs
        value={mode}
        onValueChange={(v) => setMode(v as "phone" | "email")}
        className="mb-6"
      >
        <TabsList className="w-full">
          <TabsTrigger value="phone" className="flex-1">Par téléphone</TabsTrigger>
          <TabsTrigger value="email" className="flex-1">Par email</TabsTrigger>
        </TabsList>
      </Tabs>

      <form action={action} className="space-y-5">
        <input type="hidden" name="mode" value={mode} />
        {redirectTo && <input type="hidden" name="redirect" value={redirectTo} />}

        <div>
          <label htmlFor="nom" className="mb-1.5 block text-sm font-medium text-phoebe-anthracite">
            Nom complet
          </label>
          <input
            id="nom"
            name="nom"
            type="text"
            required
            className="w-full rounded-xl border border-phoebe-anthracite/15 bg-phoebe-pearl/30 px-4 py-3 text-sm text-phoebe-anthracite placeholder:text-phoebe-anthracite/70 transition-all duration-200 focus:border-phoebe-green focus:bg-phoebe-pearl focus:outline-none focus:ring-2 focus:ring-phoebe-green/20"
            placeholder="Prénom Nom"
          />
        </div>

        {mode === "phone" ? (
          <div>
            <label htmlFor="telephone" className="mb-1.5 block text-sm font-medium text-phoebe-anthracite">
              Téléphone
            </label>
            <input
              id="telephone"
              name="telephone"
              type="tel"
              required
              inputMode={PHONE_INPUT_MODE}
              pattern={PHONE_PATTERN}
              className="w-full rounded-xl border border-phoebe-anthracite/15 bg-phoebe-pearl/30 px-4 py-3 text-sm text-phoebe-anthracite placeholder:text-phoebe-anthracite/70 transition-all duration-200 focus:border-phoebe-green focus:bg-phoebe-pearl focus:outline-none focus:ring-2 focus:ring-phoebe-green/20"
              placeholder={PHONE_PLACEHOLDER}
            />
            <p className="mt-1 text-xs text-phoebe-anthracite/70">{PHONE_AIDE}</p>
          </div>
        ) : (
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-phoebe-anthracite">
              Adresse email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-xl border border-phoebe-anthracite/15 bg-phoebe-pearl/30 px-4 py-3 text-sm text-phoebe-anthracite placeholder:text-phoebe-anthracite/70 transition-all duration-200 focus:border-phoebe-green focus:bg-phoebe-pearl focus:outline-none focus:ring-2 focus:ring-phoebe-green/20"
              placeholder="exemple@email.com"
            />
          </div>
        )}

        <div>
          <label htmlFor="date_naissance" className="mb-1.5 block text-sm font-medium text-phoebe-anthracite">
            Date de naissance
          </label>
          <input
            id="date_naissance"
            name="date_naissance"
            type="date"
            required
            max={maxDate}
            className="w-full rounded-xl border border-phoebe-anthracite/15 bg-phoebe-pearl/30 px-4 py-3 text-sm text-phoebe-anthracite transition-all duration-200 focus:border-phoebe-green focus:bg-phoebe-pearl focus:outline-none focus:ring-2 focus:ring-phoebe-green/20"
          />
          <p className="mt-1.5 text-xs text-phoebe-anthracite/70">Vous devez avoir au moins 18 ans. La location de véhicule reste réservée aux 21 ans et plus.</p>
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-phoebe-anthracite">
            Mot de passe
          </label>
          <PasswordInput id="password" name="password" required minLength={8} placeholder="8 caractères minimum" />
        </div>

        <SubmitButton>S&apos;inscrire</SubmitButton>
      </form>

      <div className="mt-8 h-px bg-phoebe-anthracite/10" />

      <p className="mt-6 text-center text-sm text-phoebe-anthracite/70">
        Déjà un compte ?{" "}
        <Link href={redirectTo ? `/connexion?redirect=${encodeURIComponent(redirectTo)}` : "/connexion"} className="font-semibold text-phoebe-green transition-colors duration-200 hover:text-phoebe-green-deep">
          Se connecter
        </Link>
      </p>
    </ScrollReveal>
  );
}