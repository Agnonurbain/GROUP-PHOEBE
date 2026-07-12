"use client";

import { useActionState } from "react";
import Link from "next/link";
import { envoyerCodeReset, type AuthState } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";

export default function MotDePasseOubliePage() {
  const [state, action] = useActionState<AuthState, FormData>(
    envoyerCodeReset,
    {}
  );

  return (
    <>
      <h1 className="mb-2 text-center text-xl font-bold text-phoebe-anthracite">
        Mot de passe oublié
      </h1>
      <p className="mb-6 text-center text-sm text-phoebe-anthracite/60">
        Saisissez votre numéro de téléphone pour recevoir un code de
        réinitialisation par SMS.
      </p>

      {state.error && (
        <div className="mb-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
          {state.error}
        </div>
      )}

      <form action={action} className="space-y-4">
        <div>
          <label
            htmlFor="telephone"
            className="mb-1 block text-sm font-medium text-phoebe-anthracite"
          >
            Téléphone
          </label>
          <input
            id="telephone"
            name="telephone"
            type="tel"
            required
            autoFocus
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-phoebe-green"
            placeholder="+225 XX XX XX XX XX"
          />
        </div>

        <SubmitButton>Envoyer le code</SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-phoebe-anthracite/60">
        <Link
          href="/connexion"
          className="font-medium text-phoebe-green hover:text-phoebe-green-deep"
        >
          Retour à la connexion
        </Link>
      </p>
    </>
  );
}
