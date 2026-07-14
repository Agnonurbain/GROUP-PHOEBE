"use client";

import { useActionState } from "react";
import {
  ajouterBlocageVehicule,
  ajouterBlocageChauffeur,
  type DispoState,
} from "@/app/actions/disponibilites";
import { SubmitButton } from "@/components/submit-button";

export function BlocageVehiculeForm({
  vehiculeId,
}: {
  vehiculeId: string;
}) {
  const [state, action] = useActionState<DispoState, FormData>(
    ajouterBlocageVehicule,
    {}
  );

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="vehicule_id" value={vehiculeId} />

      {state.error && (
        <div className="animate-fade-in rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="animate-fade-in rounded-lg bg-phoebe-green/10 px-4 py-3 text-sm text-phoebe-green-deep">
          Période bloquée ajoutée.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="bloc-v-debut" className="mb-1 block text-sm text-phoebe-anthracite/60">
            Début
          </label>
          <input
            id="bloc-v-debut"
            type="date"
            name="debut"
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-phoebe-green"
          />
        </div>
        <div>
          <label htmlFor="bloc-v-fin" className="mb-1 block text-sm text-phoebe-anthracite/60">
            Fin
          </label>
          <input
            id="bloc-v-fin"
            type="date"
            name="fin"
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-phoebe-green"
          />
        </div>
        <div>
          <label htmlFor="bloc-v-type" className="mb-1 block text-sm text-phoebe-anthracite/60">
            Type
          </label>
          <select
            id="bloc-v-type"
            name="type"
            defaultValue="maintenance"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-phoebe-green"
          >
            <option value="maintenance">Maintenance</option>
            <option value="bloque">Bloqué</option>
          </select>
        </div>
      </div>

      <SubmitButton>Bloquer cette période</SubmitButton>
    </form>
  );
}

export function BlocageChauffeurForm({
  chauffeurId,
  vehiculeId,
}: {
  chauffeurId: string;
  vehiculeId: string;
}) {
  const [state, action] = useActionState<DispoState, FormData>(
    ajouterBlocageChauffeur,
    {}
  );

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="chauffeur_id" value={chauffeurId} />
      <input type="hidden" name="vehicule_id" value={vehiculeId} />

      {state.error && (
        <div className="animate-fade-in rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="animate-fade-in rounded-lg bg-phoebe-green/10 px-4 py-3 text-sm text-phoebe-green-deep">
          Période bloquée ajoutée pour le chauffeur.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="bloc-c-debut" className="mb-1 block text-sm text-phoebe-anthracite/60">
            Début
          </label>
          <input
            id="bloc-c-debut"
            type="date"
            name="debut"
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-phoebe-green"
          />
        </div>
        <div>
          <label htmlFor="bloc-c-fin" className="mb-1 block text-sm text-phoebe-anthracite/60">
            Fin
          </label>
          <input
            id="bloc-c-fin"
            type="date"
            name="fin"
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-phoebe-green"
          />
        </div>
      </div>

      <SubmitButton>Bloquer cette période</SubmitButton>
    </form>
  );
}
