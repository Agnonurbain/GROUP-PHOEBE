"use client";

import { useActionState } from "react";
import { creerCompteInterne, type AdminState } from "@/app/actions/admin";
import { SubmitButton } from "@/components/submit-button";

export default function ComptesPage() {
  const [state, action] = useActionState<AdminState, FormData>(
    creerCompteInterne,
    {}
  );

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-phoebe-anthracite">
        Créer un compte interne
      </h1>
      <p className="text-sm text-phoebe-anthracite/60">
        Ces comptes ne passent pas par l&apos;inscription publique. Le numéro de
        téléphone et le mot de passe temporaire sont définis par le propriétaire.
      </p>

      {state.error && (
        <div className="animate-fade-in rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="animate-fade-in rounded-lg bg-phoebe-green/10 px-4 py-3 text-sm text-phoebe-green-deep">
          Compte créé avec succès.
        </div>
      )}

      <form action={action} className="space-y-4 rounded-xl border border-phoebe-pearl bg-white p-6">
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
          <label htmlFor="role" className="mb-1 block text-sm font-medium text-phoebe-anthracite">
            Rôle
          </label>
          <select
            id="role"
            name="role"
            required
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm transition-colors focus:border-phoebe-green"
          >
            <option value="">Choisir un rôle</option>
            <option value="operateur">Opérateur</option>
            <option value="livreur">Livreur</option>
          </select>
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-phoebe-anthracite">
            Mot de passe temporaire
          </label>
          <input
            id="password"
            name="password"
            type="text"
            required
            minLength={8}
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm transition-colors focus:border-phoebe-green"
            placeholder="8 caractères minimum"
          />
        </div>

        <SubmitButton>Créer le compte</SubmitButton>
      </form>
    </div>
  );
}
