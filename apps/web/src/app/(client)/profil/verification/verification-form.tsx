"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  soumettreDocuments,
  type VerificationState,
} from "@/app/actions/verification";
import { SubmitButton } from "@/components/submit-button";
import { BackLink } from "@/components/back-link";

export function VerificationForm() {
  const [state, action] = useActionState<VerificationState, FormData>(
    soumettreDocuments,
    {}
  );

  if (state.success) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-phoebe-anthracite">
          Documents soumis
        </h1>
        <div className="rounded-xl border border-phoebe-green/30 bg-phoebe-green/10 p-6">
          <p className="text-sm text-phoebe-green-deep">
            Vos documents ont été envoyés avec succès. Notre équipe les
            vérifiera dans les plus brefs délais.
          </p>
        </div>
        <Link
          href="/profil"
          className="inline-block rounded-lg bg-phoebe-green px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-phoebe-green-deep"
        >
          Retour au profil
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <BackLink href="/profil" label="Mon profil" />
        <h1 className="mt-2 text-2xl font-bold text-phoebe-anthracite">
          Vérification d&apos;identité
        </h1>
        <p className="mt-1 text-sm text-phoebe-anthracite/60">
          Envoyez une photo de votre pièce d&apos;identité et de votre permis de
          conduire. Formats acceptés : JPG, PNG, PDF (5 Mo max par fichier).
        </p>
      </div>

      {state.error && (
        <div className="animate-fade-in rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
          {state.error}
        </div>
      )}

      <form action={action} className="space-y-6">
        <div className="rounded-xl border border-phoebe-pearl bg-white p-6">
          <label htmlFor="v-piece" className="mb-2 block text-sm font-medium text-phoebe-anthracite">
            Pièce d&apos;identité (CNI, passeport)
          </label>
          <input
            id="v-piece"
            name="piece_identite"
            type="file"
            required
            accept="image/*,.pdf"
            className="w-full text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-phoebe-pearl file:px-4 file:py-2 file:text-sm file:font-medium file:text-phoebe-anthracite hover:file:bg-phoebe-green/10"
          />
        </div>

        <div className="rounded-xl border border-phoebe-pearl bg-white p-6">
          <label htmlFor="v-permis" className="mb-2 block text-sm font-medium text-phoebe-anthracite">
            Permis de conduire
          </label>
          <input
            id="v-permis"
            name="permis_conduire"
            type="file"
            required
            accept="image/*,.pdf"
            className="w-full text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-phoebe-pearl file:px-4 file:py-2 file:text-sm file:font-medium file:text-phoebe-anthracite hover:file:bg-phoebe-green/10"
          />
        </div>

        <div className="flex gap-4">
          <SubmitButton>Envoyer mes documents</SubmitButton>
          <Link
            href="/profil"
            className="flex items-center rounded-lg border border-gray-200 px-4 py-2 text-sm text-phoebe-anthracite/70 transition-colors hover:bg-phoebe-pearl"
          >
            Annuler
          </Link>
        </div>
      </form>
    </div>
  );
}
