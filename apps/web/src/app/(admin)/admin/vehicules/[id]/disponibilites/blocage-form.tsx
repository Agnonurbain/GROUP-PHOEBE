"use client";

import { useActionState } from "react";
import {
  ajouterBlocageVehicule,
  ajouterBlocageChauffeur,
  type DispoState,
} from "@/app/actions/disponibilites";
import { SubmitButton } from "@/components/submit-button";

const inputClass =
  "w-full rounded-xl border border-phoebe-anthracite/12 bg-phoebe-pearl/20 px-4 py-2.5 text-sm text-phoebe-anthracite transition-all duration-200 focus:border-phoebe-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-phoebe-green/15";

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
          Période(s) bloquée(s) ajoutée(s).
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="bloc-v-debut" className="mb-1 block text-sm text-phoebe-anthracite/70">
            Début
          </label>
          <input
            id="bloc-v-debut"
            type="date"
            name="debut"
            required
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="bloc-v-fin" className="mb-1 block text-sm text-phoebe-anthracite/70">
            Fin
          </label>
          <input
            id="bloc-v-fin"
            type="date"
            name="fin"
            required
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="bloc-v-type" className="mb-1 block text-sm text-phoebe-anthracite/70">
            Type
          </label>
          <select
            id="bloc-v-type"
            name="type"
            defaultValue="maintenance"
            className={inputClass}
          >
            <option value="maintenance">Maintenance</option>
            <option value="bloque">Bloqué</option>
          </select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="bloc-v-recurrence" className="mb-1 block text-sm text-phoebe-anthracite/70">
            Récurrence
          </label>
          <select
            id="bloc-v-recurrence"
            name="recurrence"
            defaultValue="aucune"
            className={inputClass}
          >
            <option value="aucune">Aucune (une fois)</option>
            <option value="quotidienne">Quotidienne</option>
            <option value="hebdomadaire">Hebdomadaire</option>
            <option value="mensuelle">Mensuelle</option>
          </select>
        </div>
        <div>
          <label htmlFor="bloc-v-recurrence-fin" className="mb-1 block text-sm text-phoebe-anthracite/70">
            Jusqu&apos;au (récurrence)
          </label>
          <input
            id="bloc-v-recurrence-fin"
            type="date"
            name="recurrence_fin"
            className={inputClass}
          />
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
          Période(s) bloquée(s) ajoutée(s) pour le chauffeur.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="bloc-c-debut" className="mb-1 block text-sm text-phoebe-anthracite/70">
            Début
          </label>
          <input
            id="bloc-c-debut"
            type="date"
            name="debut"
            required
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="bloc-c-fin" className="mb-1 block text-sm text-phoebe-anthracite/70">
            Fin
          </label>
          <input
            id="bloc-c-fin"
            type="date"
            name="fin"
            required
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="bloc-c-recurrence" className="mb-1 block text-sm text-phoebe-anthracite/70">
            Récurrence
          </label>
          <select
            id="bloc-c-recurrence"
            name="recurrence"
            defaultValue="aucune"
            className={inputClass}
          >
            <option value="aucune">Aucune (une fois)</option>
            <option value="quotidienne">Quotidienne</option>
            <option value="hebdomadaire">Hebdomadaire</option>
            <option value="mensuelle">Mensuelle</option>
          </select>
        </div>
        <div>
          <label htmlFor="bloc-c-recurrence-fin" className="mb-1 block text-sm text-phoebe-anthracite/70">
            Jusqu&apos;au (récurrence)
          </label>
          <input
            id="bloc-c-recurrence-fin"
            type="date"
            name="recurrence_fin"
            className={inputClass}
          />
        </div>
      </div>

      <SubmitButton>Bloquer cette période</SubmitButton>
    </form>
  );
}
