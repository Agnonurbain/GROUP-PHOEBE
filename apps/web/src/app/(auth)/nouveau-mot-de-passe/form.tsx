"use client";

import { useActionState } from "react";
import { changerMotDePasse, type AuthState } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";
import { PasswordInput } from "@/components/password-input";

export default function NouveauMotDePasseForm() {
  const [state, action] = useActionState<AuthState, FormData>(
    changerMotDePasse,
    {}
  );

  return (
    <>
      <div className="mb-8 flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-phoebe-green/10">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-phoebe-green">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-phoebe-anthracite sm:text-3xl text-center">
        Nouveau mot de passe
      </h1>
      <p className="mt-2 mb-8 text-center text-sm text-phoebe-anthracite/60">
        Choisissez votre nouveau mot de passe.
      </p>

      {state.error && (
        <div className="animate-fade-in mb-6 flex items-start gap-3 rounded-xl border border-error/20 bg-error/5 px-4 py-3.5 text-sm text-error">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 shrink-0 opacity-70">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd"/>
          </svg>
          {state.error}
        </div>
      )}

      <form action={action} className="space-y-5">
        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium text-phoebe-anthracite"
          >
            Nouveau mot de passe
          </label>
          <PasswordInput
            id="password"
            name="password"
            required
            minLength={8}
            autoFocus
            placeholder="8 caracteres minimum"
          />
        </div>

        <div>
          <label
            htmlFor="confirmation"
            className="mb-1.5 block text-sm font-medium text-phoebe-anthracite"
          >
            Confirmer le mot de passe
          </label>
          <PasswordInput
            id="confirmation"
            name="confirmation"
            required
            minLength={8}
            placeholder="Confirmez le mot de passe"
          />
        </div>

        <SubmitButton>Enregistrer</SubmitButton>
      </form>
    </>
  );
}
