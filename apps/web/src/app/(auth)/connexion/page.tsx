"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { connexion, type AuthState } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";
import { PasswordInput } from "@/components/password-input";
import { GoogleButton } from "@/components/google-button";
import { ScrollReveal } from "@/components/effects";

export default function ConnexionPage() {
  const [state, action] = useActionState<AuthState, FormData>(connexion, {});
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "";

  return (
    <ScrollReveal variant="scale-in">
      <h1 className="text-2xl font-bold tracking-tight text-phoebe-anthracite sm:text-3xl">
        Connexion
      </h1>
      <p className="mt-2 mb-8 text-sm text-phoebe-anthracite/60">
        Accedez a votre espace GROUP PHOEBE
      </p>

      {state.error && (
        <div className="animate-fade-in mb-6 flex items-start gap-3 rounded-xl border border-error/20 bg-error/5 px-4 py-3.5 text-sm text-error">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 shrink-0 opacity-70">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd"/>
          </svg>
          {state.error}
        </div>
      )}

      <GoogleButton label="Se connecter avec Google" />

      <div className="my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-phoebe-gold/30 to-transparent" />
        <span className="text-xs font-medium uppercase tracking-wider text-phoebe-gold/70">ou</span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-phoebe-gold/30 to-transparent" />
      </div>

      <form action={action} className="space-y-5">
        {redirectTo && <input type="hidden" name="redirect" value={redirectTo} />}
        <div>
          <label htmlFor="identifiant" className="mb-1.5 block text-sm font-medium text-phoebe-anthracite">
            Telephone ou email
          </label>
          <input
            id="identifiant"
            name="identifiant"
            type="text"
            required
            className="w-full rounded-xl border border-phoebe-anthracite/15 bg-phoebe-pearl/30 px-4 py-3 text-sm text-phoebe-anthracite placeholder:text-phoebe-anthracite/35 transition-all duration-200 focus:border-phoebe-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-phoebe-green/20"
            placeholder="+225 XX XX XX XX XX ou email"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-phoebe-anthracite">
            Mot de passe
          </label>
          <PasswordInput id="password" name="password" required placeholder="Mot de passe" />
        </div>

        <SubmitButton>Se connecter</SubmitButton>
      </form>

      <p className="mt-5 text-center text-sm">
        <Link
          href="/mot-de-passe-oublie"
          className="text-phoebe-anthracite/50 transition-colors duration-200 hover:text-phoebe-green"
        >
          Mot de passe oublie&nbsp;?
        </Link>
      </p>

      <div className="mt-8 flex items-center gap-3">
        <div className="h-px flex-1 bg-phoebe-anthracite/10" />
        <div className="h-px flex-1 bg-phoebe-anthracite/10" />
      </div>

      <p className="mt-6 text-center text-sm text-phoebe-anthracite/60">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="font-semibold text-phoebe-green transition-colors duration-200 hover:text-phoebe-green-deep">
          S&apos;inscrire
        </Link>
      </p>
    </ScrollReveal>
  );
}
