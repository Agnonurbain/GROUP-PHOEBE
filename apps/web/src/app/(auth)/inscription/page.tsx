"use client";

import { useActionState, useMemo } from "react";
import Link from "next/link";
import { inscription, type AuthState } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";
import { PasswordInput } from "@/components/password-input";
import { GoogleButton } from "@/components/google-button";

export default function InscriptionPage() {
  const [state, action] = useActionState<AuthState, FormData>(inscription, {});

  const maxDate = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 21);
    return d.toISOString().split("T")[0];
  }, []);

  return (
    <>
      <h1 className="mb-6 text-center text-xl font-bold text-phoebe-anthracite">
        Créer un compte
      </h1>

      {state.error && (
        <div className="animate-fade-in mb-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
          {state.error}
        </div>
      )}

      <GoogleButton label="S'inscrire avec Google" />

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs text-phoebe-anthracite/40">ou</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <form action={action} className="space-y-4">
        <div>
          <label htmlFor="nom" className="mb-1 block text-sm font-medium text-phoebe-anthracite">
            Nom complet
          </label>
          <input
            id="nom"
            name="nom"
            type="text"
            required
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm transition-colors focus:border-phoebe-green"
            placeholder="Prénom Nom"
          />
        </div>

        <div>
          <label htmlFor="telephone" className="mb-1 block text-sm font-medium text-phoebe-anthracite">
            Téléphone
          </label>
          <input
            id="telephone"
            name="telephone"
            type="tel"
            required
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm transition-colors focus:border-phoebe-green"
            placeholder="+225 XX XX XX XX XX"
          />
        </div>

        <div>
          <label htmlFor="date_naissance" className="mb-1 block text-sm font-medium text-phoebe-anthracite">
            Date de naissance
          </label>
          <input
            id="date_naissance"
            name="date_naissance"
            type="date"
            required
            max={maxDate}
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm transition-colors focus:border-phoebe-green"
          />
          <p className="mt-1 text-xs text-phoebe-anthracite/50">
            Vous devez avoir au moins 21 ans.
          </p>
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-phoebe-anthracite">
            Mot de passe
          </label>
          <PasswordInput id="password" name="password" required minLength={8} placeholder="8 caractères minimum" />
        </div>

        <SubmitButton>S&apos;inscrire</SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-phoebe-anthracite/60">
        Déjà un compte ?{" "}
        <Link href="/connexion" className="font-medium text-phoebe-green hover:text-phoebe-green-deep">
          Se connecter
        </Link>
      </p>
    </>
  );
}
