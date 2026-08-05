"use client";

import { useActionState, useState } from "react";
import { changerMotDePasseProfil, type AuthState } from "@/app/actions/auth";
import { PasswordInput } from "@/components/password-input";
import { SubmitButton } from "@/components/submit-button";
import { Obligatoire } from "@/components/ui/obligatoire"
import { useT } from "@/lib/langue-context"

export function ChangePasswordForm() {
  const t = useT()
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<AuthState, FormData>(
    changerMotDePasseProfil,
    {}
  );

  if (!open) {
    return (
      <div className="rounded-2xl border border-public-border bg-public-bg-card p-7 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-public-text">{t.divers.motDePasse}</h2>
            <p className="mt-1 text-sm text-public-text-muted">
              {t.divers.changerMotDePasseIntro}
            </p>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="shrink-0 rounded-xl border border-public-border px-4 py-2 text-sm font-medium text-public-text-muted transition-all hover:border-accent-gold hover:text-accent-gold hover:shadow-sm"
          >
            Changer
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      action={action}
      className="rounded-2xl border border-accent-gold/30 bg-public-bg-card p-7 shadow-sm"
    >
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-bold text-public-text">{t.divers.changerMonMotDePasse}</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-xl border border-public-border px-4 py-2 text-sm font-medium text-public-text-muted transition-all hover:border-error/40 hover:text-error hover:shadow-sm"
        >
          Annuler
        </button>
      </div>

      {state.error && (
        <p role="alert" className="mb-5 animate-fade-in rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
          {state.error}
        </p>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="mdp-actuel" className="mb-1.5 block text-sm font-medium text-public-text">
            {t.divers.motDePasseActuel}<Obligatoire />
          </label>
          <PasswordInput id="mdp-actuel" name="mot_de_passe_actuel" required autoComplete="current-password" placeholder={t.divers.exempleMotDePasseActuel} variant="dark" />
        </div>
        <div>
          <label htmlFor="mdp-nouveau" className="mb-1.5 block text-sm font-medium text-public-text">
            {t.divers.nouveauMotDePasse}<Obligatoire />
          </label>
          <PasswordInput id="mdp-nouveau" name="nouveau_mot_de_passe" required minLength={8} autoComplete="new-password" placeholder={t.divers.exempleHuitCaracteres} variant="dark" />
        </div>
        <div>
          <label htmlFor="mdp-confirmation" className="mb-1.5 block text-sm font-medium text-public-text">
            {t.divers.confirmerNouveauMotDePasse}<Obligatoire />
          </label>
          <PasswordInput id="mdp-confirmation" name="confirmation" required minLength={8} autoComplete="new-password" placeholder={t.divers.exempleRepetez} variant="dark" />
        </div>
      </div>

      <div className="mt-6">
        <SubmitButton className="rounded-xl bg-accent-gold px-7 py-3 text-sm font-semibold text-[#0A0A0A] shadow-sm transition-all hover:bg-accent-gold-hover hover:shadow-md disabled:opacity-50">
          {t.divers.enregistrerNouveauMotDePasse}
        </SubmitButton>
      </div>
    </form>
  );
}
