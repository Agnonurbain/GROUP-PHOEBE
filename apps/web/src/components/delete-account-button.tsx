"use client";

import { useActionState, useRef, useState } from "react";
import { supprimerCompte, type AuthState } from "@/app/actions/auth";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useT } from "@/lib/langue-context"

export function DeleteAccountButton() {
  const t = useT()
  const [state, action, isPending] = useActionState<AuthState>(supprimerCompte, {});
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl border-2 border-error/30 px-5 py-2.5 text-sm font-semibold text-error transition-all hover:bg-error hover:text-white hover:shadow-md"
      >
        Supprimer mon compte
      </button>

      <form ref={formRef} action={action} className="hidden" />

      <ConfirmDialog
        open={open}
        title={t.divers.supprimerCompteConfirmation}
        message="Cette action est irréversible. Toutes vos données personnelles seront définitivement effacées, conformément au RGPD."
        confirmLabel="Supprimer définitivement"
        cancelLabel="Annuler"
        danger
        busy={isPending}
        onCancel={() => setOpen(false)}
        onConfirm={() => formRef.current?.requestSubmit()}
      />

      {state.error && (
        <p className="mt-2 text-xs text-error">{state.error}</p>
      )}
    </>
  );
}
