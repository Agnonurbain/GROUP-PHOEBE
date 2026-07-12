"use client";

import { useActionState } from "react";
import Link from "next/link";
import { inscription, type AuthState } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";

export default function InscriptionPage() {
  const [state, action] = useActionState<AuthState, FormData>(inscription, {});

  return (
    <>
      <h1 className="mb-6 text-center text-xl font-bold text-phoebe-anthracite">
        Créer un compte
      </h1>

      {state.error && (
        <div className="mb-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
          {state.error}
        </div>
      )}

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
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-phoebe-green"
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
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-phoebe-green"
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
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-phoebe-green"
          />
          <p className="mt-1 text-xs text-phoebe-anthracite/50">
            Vous devez avoir au moins 21 ans.
          </p>
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
            minLength={8}
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-phoebe-green"
            placeholder="8 caractères minimum"
          />
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
