"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  PHONE_INPUT_MODE,
  PHONE_PATTERN,
  PHONE_PLACEHOLDER,
  PHONE_AIDE,
} from "@/lib/telephone";
import { connexion, type AuthState } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";
import { PasswordInput } from "@/components/password-input";
import { GoogleButton } from "@/components/google-button";
import { ScrollReveal } from "@/components/effects";
import { Tabs, TabsList, TabsTrigger } from "@/components/shadcn/tabs";

export default function ConnexionForm() {
  const [state, action] = useActionState<AuthState, FormData>(connexion, {});
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "";
  const [loginMode, setLoginMode] = useState<"phone" | "email">("phone");

  return (
    <ScrollReveal variant="scale-in">
      <h1 className="text-2xl font-bold tracking-tight text-phoebe-anthracite sm:text-3xl">Connexion</h1>
      <p className="mt-2 mb-8 text-sm text-phoebe-anthracite/70">
        Accédez à votre espace pour gérer vos réservations et favoris
      </p>

      {state.error && (
        <div className="animate-fade-in mb-6 flex items-start gap-3 rounded-xl border border-error/20 bg-error/5 px-4 py-3.5 text-sm text-error">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 shrink-0 opacity-70">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
          {state.error}
        </div>
      )}

      <GoogleButton label="Se connecter avec Google" />

      <div className="my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-phoebe-gold/30 to-transparent" />
        <span className="text-xs font-medium uppercase tracking-wider text-phoebe-gold-dark">ou</span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-phoebe-gold/30 to-transparent" />
      </div>

      {/* Tabs shadcn : rôles et états ARIA fournis par la primitive, et même
          contrôle que sur l'inscription — l'ancien couple de boutons différait
          d'un écran à l'autre. */}
      <Tabs
        value={loginMode}
        onValueChange={(v) => setLoginMode(v as "phone" | "email")}
        className="mb-6"
      >
        <TabsList className="w-full">
          <TabsTrigger value="phone" className="flex-1">Téléphone</TabsTrigger>
          <TabsTrigger value="email" className="flex-1">Email</TabsTrigger>
        </TabsList>
      </Tabs>

      <form action={action} className="space-y-5">
        {redirectTo && <input type="hidden" name="redirect" value={redirectTo} />}

        {loginMode === "phone" && (
          <div>
            <label htmlFor="telephone" className="mb-1.5 block text-sm font-medium text-phoebe-anthracite">
              Téléphone
            </label>
            <input
              id="telephone"
              name="identifiant"
              type="tel"
              required
              inputMode={PHONE_INPUT_MODE}
              pattern={PHONE_PATTERN}
              className="w-full rounded-xl border border-phoebe-anthracite/15 bg-phoebe-pearl/30 px-4 py-3 text-sm text-phoebe-anthracite placeholder:text-phoebe-anthracite/70 transition-all duration-200 focus:border-phoebe-green focus:bg-phoebe-pearl focus:outline-none focus:ring-2 focus:ring-phoebe-green/20"
              placeholder={PHONE_PLACEHOLDER}
            />
            <p className="mt-1 text-xs text-phoebe-anthracite/70">{PHONE_AIDE}</p>
          </div>
        )}

        {loginMode === "email" && (
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-phoebe-anthracite">
              Email
            </label>
            <input
              id="email"
              name="identifiant"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-xl border border-phoebe-anthracite/15 bg-phoebe-pearl/30 px-4 py-3 text-sm text-phoebe-anthracite placeholder:text-phoebe-anthracite/70 transition-all duration-200 focus:border-phoebe-green focus:bg-phoebe-pearl focus:outline-none focus:ring-2 focus:ring-phoebe-green/20"
              placeholder="vous@exemple.ci"
            />
          </div>
        )}

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-phoebe-anthracite">
            Mot de passe
          </label>
          <PasswordInput id="password" name="password" required placeholder="Votre mot de passe" />
        </div>

        <div className="text-right">
          <Link href="/mot-de-passe-oublie" className="text-sm font-medium text-phoebe-green transition-colors duration-200 hover:text-phoebe-green-deep hover:underline">
            Mot de passe oublié ?
          </Link>
        </div>

        <SubmitButton>Se connecter</SubmitButton>
      </form>

      <div className="mt-8 h-px bg-phoebe-anthracite/10" />

      <p className="mt-6 text-center text-sm text-phoebe-anthracite/70">
        Pas encore de compte ?{" "}
        <Link href={redirectTo ? `/inscription?redirect=${encodeURIComponent(redirectTo)}` : "/inscription"} className="font-semibold text-phoebe-green transition-colors duration-200 hover:text-phoebe-green-deep">
          S&apos;inscrire
        </Link>
      </p>
    </ScrollReveal>
  );
}