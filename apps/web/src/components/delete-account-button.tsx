"use client";

import { useActionState } from "react";
import { supprimerCompte, type AuthState } from "@/app/actions/auth";

export function DeleteAccountButton() {
  const [state, action] = useActionState<AuthState>(supprimerCompte, {});

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!window.confirm("Voulez-vous vraiment supprimer votre compte ? Cette action est irreversible.")) {
      e.preventDefault();
    }
  };

  return (
    <>
      <form action={action} onSubmit={handleSubmit}>
        <button
          type="submit"
          className="rounded-xl border-2 border-error/30 px-5 py-2.5 text-sm font-semibold text-error transition-all hover:bg-error hover:text-white hover:shadow-md"
        >
          Supprimer mon compte
        </button>
      </form>
      {state.error && (
        <p className="mt-2 text-xs text-error">{state.error}</p>
      )}
    </>
  );
}
