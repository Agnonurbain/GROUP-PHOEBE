"use client";

import { useActionState, useState } from "react";
import { updateProfile, type AuthState } from "@/app/actions/auth";
import { SubmitButton } from "./submit-button";

export function ProfileEditForm({
  nom,
  telephone,
  dateNaissance,
  email,
  role,
}: {
  nom: string;
  telephone: string | null;
  dateNaissance: string | null;
  email: string | null;
  role: string;
}) {
  const [editing, setEditing] = useState(false);
  const [state, action] = useActionState(updateProfile, {} as AuthState);

  if (!editing) {
    return (
      <div className="rounded-2xl border border-phoebe-pearl bg-white p-7 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-phoebe-anthracite">
            Informations personnelles
          </h2>
          <button
            onClick={() => setEditing(true)}
            className="rounded-xl border border-phoebe-anthracite/12 px-4 py-2 text-sm font-medium text-phoebe-anthracite/60 transition-all hover:border-phoebe-green hover:text-phoebe-green hover:shadow-sm"
          >
            Modifier
          </button>
        </div>
        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-phoebe-anthracite/40">Nom</dt>
            <dd className="mt-1 font-medium text-phoebe-anthracite">{nom}</dd>
          </div>
          {email && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-phoebe-anthracite/40">Email</dt>
              <dd className="mt-1 font-medium text-phoebe-anthracite">{email}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-phoebe-anthracite/40">Telephone</dt>
            <dd className="mt-1 font-medium text-phoebe-anthracite">
              {telephone || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-phoebe-anthracite/40">
              Date de naissance
            </dt>
            <dd className="mt-1 font-medium text-phoebe-anthracite">
              {dateNaissance
                ? new Date(dateNaissance).toLocaleDateString("fr-FR")
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-phoebe-anthracite/40">Role</dt>
            <dd className="font-medium capitalize text-phoebe-anthracite">
              {role}
            </dd>
          </div>
        </dl>
      </div>
    );
  }

  return (
    <form
      action={action}
      className="rounded-2xl border border-phoebe-gold/30 bg-white p-7 shadow-sm"
    >
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-bold text-phoebe-anthracite">
          Modifier mes informations
        </h2>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-xl border border-phoebe-anthracite/12 px-4 py-2 text-sm font-medium text-phoebe-anthracite/60 transition-all hover:border-error/40 hover:text-error hover:shadow-sm"
        >
          Annuler
        </button>
      </div>

      {state.error && (
        <p className="mb-5 animate-fade-in rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
          {state.error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="nom"
            className="mb-1.5 block text-sm font-medium text-phoebe-anthracite"
          >
            Nom *
          </label>
          <input
            id="nom"
            name="nom"
            type="text"
            required
            defaultValue={nom}
            className="w-full rounded-xl border border-phoebe-anthracite/12 bg-phoebe-pearl/20 px-4 py-2.5 text-sm text-phoebe-anthracite transition-all duration-200 focus:border-phoebe-gold focus:bg-white focus:outline-none focus:ring-2 focus:ring-phoebe-gold/20"
          />
        </div>
        {email && (
          <div>
            <span className="mb-1.5 block text-sm font-medium text-phoebe-anthracite">
              Email
            </span>
            <p className="rounded-xl border border-phoebe-pearl bg-phoebe-pearl/40 px-4 py-2.5 text-sm text-phoebe-anthracite/60">
              {email}
            </p>
          </div>
        )}
        <div>
          <label
            htmlFor="telephone"
            className="mb-1.5 block text-sm font-medium text-phoebe-anthracite"
          >
            Telephone
          </label>
          <input
            id="telephone"
            name="telephone"
            type="tel"
            inputMode="numeric"
            pattern="[+][0-9]{7,15}"
            defaultValue={telephone ?? ""}
            placeholder="+225 07 00 00 00 00"
            className="w-full rounded-xl border border-phoebe-anthracite/12 bg-phoebe-pearl/20 px-4 py-2.5 text-sm text-phoebe-anthracite transition-all duration-200 focus:border-phoebe-gold focus:bg-white focus:outline-none focus:ring-2 focus:ring-phoebe-gold/20"
          />
        </div>
        <div>
          <label
            htmlFor="date_naissance"
            className="mb-1.5 block text-sm font-medium text-phoebe-anthracite"
          >
            Date de naissance
          </label>
          <input
            id="date_naissance"
            name="date_naissance"
            type="date"
            defaultValue={dateNaissance ?? ""}
            className="w-full rounded-xl border border-phoebe-anthracite/12 bg-phoebe-pearl/20 px-4 py-2.5 text-sm text-phoebe-anthracite transition-all duration-200 focus:border-phoebe-gold focus:bg-white focus:outline-none focus:ring-2 focus:ring-phoebe-gold/20"
          />
        </div>
      </div>

      <div className="mt-6">
        <SubmitButton className="rounded-xl bg-phoebe-gold px-7 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-phoebe-gold-dark hover:shadow-md disabled:opacity-50">
          Enregistrer
        </SubmitButton>
      </div>
    </form>
  );
}
