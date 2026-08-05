"use client";

import { useActionState, useState } from "react";
import { updateProfile, type AuthState } from "@/app/actions/auth";
import { SubmitButton } from "./submit-button";
import { Obligatoire } from "@/components/ui/obligatoire"
import { useT } from "@/lib/langue-context"

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
  const t = useT()
  const [editing, setEditing] = useState(false);
  const [state, action] = useActionState(updateProfile, {} as AuthState);

  if (!editing) {
    return (
      <div className="rounded-2xl border border-public-border bg-public-bg-card p-7 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-public-text">
            Informations personnelles
          </h2>
          <button
            onClick={() => setEditing(true)}
            className="rounded-xl border border-public-border px-4 py-2 text-sm font-medium text-public-text-muted transition-all hover:border-accent-gold hover:text-accent-gold hover:shadow-sm"
          >
            Modifier
          </button>
        </div>
        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-public-text-muted">Nom</dt>
            <dd className="mt-1 font-medium text-public-text">{nom}</dd>
          </div>
          {email && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-public-text-muted">Email</dt>
              <dd className="mt-1 font-medium text-public-text">{email}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-public-text-muted">{t.auth.telephone}</dt>
            <dd className="mt-1 font-medium text-public-text">
              {telephone || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-public-text-muted">
              {t.auth.dateNaissance}
            </dt>
            <dd className="mt-1 font-medium text-public-text">
              {dateNaissance
                ? new Date(dateNaissance).toLocaleDateString("fr-FR")
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-public-text-muted">{t.divers.role}</dt>
            <dd className="font-medium capitalize text-public-text">
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
      className="rounded-2xl border border-accent-gold/30 bg-public-bg-card p-7 shadow-sm"
    >
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-bold text-public-text">
          Modifier mes informations
        </h2>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-xl border border-public-border px-4 py-2 text-sm font-medium text-public-text-muted transition-all hover:border-error/40 hover:text-error hover:shadow-sm"
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
            className="mb-1.5 block text-sm font-medium text-public-text"
          >
            Nom<Obligatoire />
          </label>
          <input
            id="nom"
            name="nom"
            type="text"
            required
            defaultValue={nom}
            className="w-full rounded-xl border border-public-border bg-public-bg px-4 py-2.5 text-sm text-public-text transition-all duration-200 focus:border-accent-gold focus:outline-none focus:ring-2 focus:ring-accent-gold/20"
          />
        </div>
        {email && (
          <div>
            <span className="mb-1.5 block text-sm font-medium text-public-text">
              Email
            </span>
            <p className="rounded-xl border border-public-border bg-public-bg px-4 py-2.5 text-sm text-public-text-muted">
              {email}
            </p>
          </div>
        )}
        <div>
          <label
            htmlFor="telephone"
            className="mb-1.5 block text-sm font-medium text-public-text"
          >
            {t.auth.telephone}
          </label>
          <input
            id="telephone"
            name="telephone"
            type="tel"
            inputMode="numeric"
            pattern="[+][0-9]{7,15}"
            defaultValue={telephone ?? ""}
            placeholder="+225 07 00 00 00 00"
            className="w-full rounded-xl border border-public-border bg-public-bg px-4 py-2.5 text-sm text-public-text placeholder:text-public-text-faint transition-all duration-200 focus:border-accent-gold focus:outline-none focus:ring-2 focus:ring-accent-gold/20"
          />
        </div>
        <div>
          <label
            htmlFor="date_naissance"
            className="mb-1.5 block text-sm font-medium text-public-text"
          >
            {t.auth.dateNaissance}
          </label>
          <input
            id="date_naissance"
            name="date_naissance"
            type="date"
            defaultValue={dateNaissance ?? ""}
            className="w-full rounded-xl border border-public-border bg-public-bg px-4 py-2.5 text-sm text-public-text transition-all duration-200 [color-scheme:dark] focus:border-accent-gold focus:outline-none focus:ring-2 focus:ring-accent-gold/20"
          />
        </div>
      </div>

      <div className="mt-6">
        <SubmitButton className="rounded-xl bg-accent-gold px-7 py-3 text-sm font-semibold text-[#0A0A0A] shadow-sm transition-all hover:bg-accent-gold-hover hover:shadow-md disabled:opacity-50">
          Enregistrer
        </SubmitButton>
      </div>
    </form>
  );
}
