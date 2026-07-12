"use client";

import { useActionState } from "react";
import Link from "next/link";
import { connexion, type AuthState } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";

export default function ConnexionPage() {
  const [state, action] = useActionState<AuthState, FormData>(connexion, {});

  return (
    <>
      <h1 className="mb-6 text-center text-xl font-bold text-phoebe-anthracite">
        Connexion
      </h1>

      {state.error && (
        <div className="mb-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
          {state.error}
        </div>
      )}

      <form action={action} className="space-y-4">
        <div>
          <label htmlFor="telephone" className="mb-1 block text-sm font-medium text-phoebe-anthracite">
            Téléphone
          </label>
          <input
            id="telephone"
            name="telephone"
            type="tel"
            required
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-phoebe-green"
            placeholder="+225 XX XX XX XX XX"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-phoebe-anthracite">
            Mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-phoebe-green"
            placeholder="Mot de passe"
          />
        </div>

        <SubmitButton>Se connecter</SubmitButton>
      </form>

      <p className="mt-4 text-center text-sm">
        <Link
          href="/mot-de-passe-oublie"
          className="text-phoebe-anthracite/60 hover:text-phoebe-green"
        >
          Mot de passe oublié&nbsp;?
        </Link>
      </p>

      <p className="mt-4 text-center text-sm text-phoebe-anthracite/60">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="font-medium text-phoebe-green hover:text-phoebe-green-deep">
          S&apos;inscrire
        </Link>
      </p>
    </>
  );
}
