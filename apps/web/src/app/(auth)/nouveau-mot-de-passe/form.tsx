"use client";

import { useActionState } from "react";
import { changerMotDePasse, type AuthState } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";

export default function NouveauMotDePasseForm() {
  const [state, action] = useActionState<AuthState, FormData>(
    changerMotDePasse,
    {}
  );

  return (
    <>
      <h1 className="mb-2 text-center text-xl font-bold text-phoebe-anthracite">
        Nouveau mot de passe
      </h1>
      <p className="mb-6 text-center text-sm text-phoebe-anthracite/60">
        Choisissez votre nouveau mot de passe.
      </p>

      {state.error && (
        <div className="mb-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
          {state.error}
        </div>
      )}

      <form action={action} className="space-y-4">
        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-sm font-medium text-phoebe-anthracite"
          >
            Nouveau mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoFocus
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-phoebe-green"
            placeholder="8 caractères minimum"
          />
        </div>

        <div>
          <label
            htmlFor="confirmation"
            className="mb-1 block text-sm font-medium text-phoebe-anthracite"
          >
            Confirmer le mot de passe
          </label>
          <input
            id="confirmation"
            name="confirmation"
            type="password"
            required
            minLength={8}
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-phoebe-green"
            placeholder="Confirmez le mot de passe"
          />
        </div>

        <SubmitButton>Enregistrer</SubmitButton>
      </form>
    </>
  );
}
