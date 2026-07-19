"use client";

import { useActionState } from "react";
import { creerCompteInterne, type AdminState } from "@/app/actions/admin";
import { SubmitButton } from "@/components/submit-button";

export function ComptesForm() {
  const [state, action] = useActionState<AdminState, FormData>(
    creerCompteInterne,
    {}
  );

  return (
    <div className="max-w-lg space-y-4">
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
            className="w-full rounded-xl border border-phoebe-anthracite/12 bg-phoebe-pearl/20 px-4 py-2.5 text-sm text-phoebe-anthracite transition-all duration-200 focus:border-phoebe-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-phoebe-green/15"
          />
        </div>

        <div>
          <label htmlFor="telephone" className="mb-1 block text-sm font-medium text-phoebe-anthracite">
            Téléphone ou Email
          </label>
          <input
            id="telephone"
            name="telephone"
            type="text"
            required
            className="w-full rounded-xl border border-phoebe-anthracite/12 bg-phoebe-pearl/20 px-4 py-2.5 text-sm text-phoebe-anthracite transition-all duration-200 focus:border-phoebe-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-phoebe-green/15"
            placeholder="+225 XX XX XX XX XX ou email@exemple.ci"
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
            className="w-full rounded-xl border border-phoebe-anthracite/12 bg-phoebe-pearl/20 px-4 py-2.5 text-sm text-phoebe-anthracite transition-all duration-200 focus:border-phoebe-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-phoebe-green/15"
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
            className="w-full rounded-xl border border-phoebe-anthracite/12 bg-phoebe-pearl/20 px-4 py-2.5 text-sm text-phoebe-anthracite transition-all duration-200 focus:border-phoebe-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-phoebe-green/15"
            placeholder="8 caractères minimum"
          />
        </div>

        <SubmitButton>Créer le compte</SubmitButton>
      </form>
    </div>
  );
}
