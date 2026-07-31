"use client";

import { useActionState, useState } from "react";
import { creerCompteInterne, type AdminState } from "@/app/actions/admin";
import { SubmitButton } from "@/components/submit-button";

export function ComptesForm() {
  const [state, action] = useActionState<AdminState, FormData>(
    creerCompteInterne,
    {}
  );
  const [role, setRole] = useState("");

  return (
    <div className="max-w-lg space-y-4" role="alert">
      {state.error && (
        <div role="alert" className="animate-fade-in rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
          {state.error}
        </div>
      )}
      {state.success && (
        <div role="status" className="animate-fade-in rounded-lg border border-phoebe-green/20 bg-phoebe-green/10 px-4 py-3 text-sm">
          <p className="font-semibold text-phoebe-green-deep">Compte créé avec succès.</p>
          <p className="mt-1 text-phoebe-anthracite/70">
            Identifiant : <strong>{state.createdLogin}</strong>
          </p>
          <p className="text-phoebe-anthracite/70">
            Mot de passe temporaire : <strong>{state.createdPassword}</strong>
          </p>
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
            className="w-full rounded-xl border border-phoebe-anthracite/12 bg-phoebe-pearl/20 px-4 py-2.5 text-sm text-phoebe-anthracite transition-all duration-200 focus:border-phoebe-green focus:bg-phoebe-pearl focus:outline-none focus:ring-2 focus:ring-phoebe-green/15"
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
            className="w-full rounded-xl border border-phoebe-anthracite/12 bg-phoebe-pearl/20 px-4 py-2.5 text-sm text-phoebe-anthracite transition-all duration-200 focus:border-phoebe-green focus:bg-phoebe-pearl focus:outline-none focus:ring-2 focus:ring-phoebe-green/15"
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
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-xl border border-phoebe-anthracite/12 bg-phoebe-pearl/20 px-4 py-2.5 text-sm text-phoebe-anthracite transition-all duration-200 focus:border-phoebe-green focus:bg-phoebe-pearl focus:outline-none focus:ring-2 focus:ring-phoebe-green/15"
          >
            <option value="">Choisir un rôle</option>
            <option value="operateur">Opérateur</option>
            <option value="livreur">Livreur</option>
            <option value="agent_immobilier">Agent immobilier</option>
          </select>
        </div>

        {role === "livreur" && (
          <>
            <div>
              <label htmlFor="zone_couverture_livreur" className="mb-1 block text-sm font-medium text-phoebe-anthracite">
                Communes desservies
              </label>
              <input
                id="zone_couverture_livreur"
                name="zone_couverture"
                type="text"
                placeholder="Ex. Cocody, Marcory"
                className="w-full rounded-xl border border-phoebe-anthracite/12 bg-phoebe-pearl/20 px-4 py-2.5 text-sm text-phoebe-anthracite transition-all duration-200 focus:border-phoebe-green focus:bg-phoebe-pearl focus:outline-none focus:ring-2 focus:ring-phoebe-green/15"
              />
              <p className="mt-1.5 text-xs text-phoebe-anthracite/60">
                Séparées par des virgules. Laissez vide pour desservir tout Abidjan —
                c&apos;est le bon défaut tant que les couvertures ne sont pas réparties.
                À ne pas confondre avec la zone d&apos;un agent immobilier.
              </p>
            </div>

            <div>
              <label htmlFor="capacite_max_par_jour" className="mb-1 block text-sm font-medium text-phoebe-anthracite">
                Capacité par jour
              </label>
              <input
                id="capacite_max_par_jour"
                name="capacite_max_par_jour"
                type="number"
                min={1}
                step={1}
                placeholder="Par défaut : 10"
                className="w-full rounded-xl border border-phoebe-anthracite/12 bg-phoebe-pearl/20 px-4 py-2.5 text-sm text-phoebe-anthracite transition-all duration-200 focus:border-phoebe-green focus:bg-phoebe-pearl focus:outline-none focus:ring-2 focus:ring-phoebe-green/15"
              />
              <p className="mt-1.5 text-xs text-phoebe-anthracite/60">
                Nombre de colis en cours au-delà duquel l&apos;affectation
                automatique le passe. Modifiable ensuite depuis Livreurs.
              </p>
            </div>
          </>
        )}

        {role === "agent_immobilier" && (
          <div>
            <label htmlFor="zone_couverture" className="mb-1 block text-sm font-medium text-phoebe-anthracite">
              Zone de couverture
            </label>
            <input
              id="zone_couverture"
              name="zone_couverture"
              type="text"
              required
              placeholder="Ex. Cocody"
              className="w-full rounded-xl border border-phoebe-anthracite/12 bg-phoebe-pearl/20 px-4 py-2.5 text-sm text-phoebe-anthracite transition-all duration-200 focus:border-phoebe-green focus:bg-phoebe-pearl focus:outline-none focus:ring-2 focus:ring-phoebe-green/15"
            />
            <p className="mt-1.5 text-xs text-phoebe-anthracite/60">
              Un bien créé dont la localisation contient cette zone lui est affecté
              automatiquement. Évitez les zones qui se recouvrent entre agents :
              c&apos;est le premier agent correspondant qui est retenu.
            </p>
          </div>
        )}

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
            className="w-full rounded-xl border border-phoebe-anthracite/12 bg-phoebe-pearl/20 px-4 py-2.5 text-sm text-phoebe-anthracite transition-all duration-200 focus:border-phoebe-green focus:bg-phoebe-pearl focus:outline-none focus:ring-2 focus:ring-phoebe-green/15"
            placeholder="8 caractères minimum"
          />
        </div>

        <SubmitButton>Créer le compte</SubmitButton>
      </form>
    </div>
  );
}
