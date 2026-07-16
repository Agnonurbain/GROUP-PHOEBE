"use client";

import { useActionState, useState } from "react";
import { updateProfile, type AuthState } from "@/app/actions/auth";
import { SubmitButton } from "./submit-button";

export function ProfileEditForm({
  nom,
  telephone,
  dateNaissance,
  email,
}: {
  nom: string;
  telephone: string | null;
  dateNaissance: string | null;
  email: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [state, action] = useActionState(updateProfile, {} as AuthState);

  if (!editing) {
    return (
      <div className="rounded-xl border border-phoebe-pearl bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-phoebe-anthracite">
            Informations personnelles
          </h2>
          <button
            onClick={() => setEditing(true)}
            className="rounded-lg border border-phoebe-anthracite/20 px-3 py-1.5 text-sm text-phoebe-anthracite/70 transition-colors hover:border-phoebe-green hover:text-phoebe-green"
          >
            Modifier
          </button>
        </div>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-phoebe-anthracite/50">Nom</dt>
            <dd className="font-medium text-phoebe-anthracite">{nom}</dd>
          </div>
          {email && (
            <div>
              <dt className="text-sm text-phoebe-anthracite/50">Email</dt>
              <dd className="font-medium text-phoebe-anthracite">{email}</dd>
            </div>
          )}
          <div>
            <dt className="text-sm text-phoebe-anthracite/50">Telephone</dt>
            <dd className="font-medium text-phoebe-anthracite">
              {telephone || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-phoebe-anthracite/50">
              Date de naissance
            </dt>
            <dd className="font-medium text-phoebe-anthracite">
              {dateNaissance
                ? new Date(dateNaissance).toLocaleDateString("fr-FR")
                : "—"}
            </dd>
          </div>
        </dl>
      </div>
    );
  }

  return (
    <form
      action={action}
      className="rounded-xl border border-phoebe-green/30 bg-white p-6"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-phoebe-anthracite">
          Modifier mes informations
        </h2>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-lg border border-phoebe-anthracite/20 px-3 py-1.5 text-sm text-phoebe-anthracite/70 transition-colors hover:border-error hover:text-error"
        >
          Annuler
        </button>
      </div>

      {state.error && (
        <p className="mb-4 rounded-lg bg-error/10 px-3 py-2 text-sm text-error">
          {state.error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="nom"
            className="mb-1 block text-sm text-phoebe-anthracite/50"
          >
            Nom *
          </label>
          <input
            id="nom"
            name="nom"
            type="text"
            required
            defaultValue={nom}
            className="w-full rounded-lg border border-phoebe-pearl px-3 py-2 text-sm text-phoebe-anthracite outline-none focus:border-phoebe-green"
          />
        </div>
        <div>
          <label
            htmlFor="telephone"
            className="mb-1 block text-sm text-phoebe-anthracite/50"
          >
            Telephone
          </label>
          <input
            id="telephone"
            name="telephone"
            type="tel"
            defaultValue={telephone ?? ""}
            placeholder="+225 07 00 00 00 00"
            className="w-full rounded-lg border border-phoebe-pearl px-3 py-2 text-sm text-phoebe-anthracite outline-none focus:border-phoebe-green"
          />
        </div>
        <div>
          <label
            htmlFor="date_naissance"
            className="mb-1 block text-sm text-phoebe-anthracite/50"
          >
            Date de naissance
          </label>
          <input
            id="date_naissance"
            name="date_naissance"
            type="date"
            defaultValue={dateNaissance ?? ""}
            className="w-full rounded-lg border border-phoebe-pearl px-3 py-2 text-sm text-phoebe-anthracite outline-none focus:border-phoebe-green"
          />
        </div>
      </div>

      <div className="mt-4">
        <SubmitButton className="rounded-lg bg-phoebe-green px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-phoebe-green-deep disabled:opacity-50">
          Enregistrer
        </SubmitButton>
      </div>
    </form>
  );
}
