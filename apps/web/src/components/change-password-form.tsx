"use client";

import { useActionState, useState } from "react";
import { changerMotDePasseProfil, type AuthState } from "@/app/actions/auth";
import { PasswordInput } from "@/components/password-input";
import { SubmitButton } from "@/components/submit-button";

export function ChangePasswordForm() {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<AuthState, FormData>(
    changerMotDePasseProfil,
    {}
  );

  if (!open) {
    return (
      <div className="rounded-2xl border border-phoebe-pearl bg-white p-7 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-phoebe-anthracite">Mot de passe</h2>
            <p className="mt-1 text-sm text-phoebe-anthracite/70">
              Changez le mot de passe de votre compte.
            </p>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="shrink-0 rounded-xl border border-phoebe-anthracite/12 px-4 py-2 text-sm font-medium text-phoebe-anthracite/70 transition-all hover:border-phoebe-green hover:text-phoebe-green hover:shadow-sm"
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
      className="rounded-2xl border border-phoebe-gold/30 bg-white p-7 shadow-sm"
    >
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-bold text-phoebe-anthracite">Changer mon mot de passe</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-xl border border-phoebe-anthracite/12 px-4 py-2 text-sm font-medium text-phoebe-anthracite/70 transition-all hover:border-error/40 hover:text-error hover:shadow-sm"
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
          <label htmlFor="mdp-actuel" className="mb-1.5 block text-sm font-medium text-phoebe-anthracite">
            Mot de passe actuel
          </label>
          <PasswordInput id="mdp-actuel" name="mot_de_passe_actuel" required autoComplete="current-password" placeholder="Votre mot de passe actuel" />
        </div>
        <div>
          <label htmlFor="mdp-nouveau" className="mb-1.5 block text-sm font-medium text-phoebe-anthracite">
            Nouveau mot de passe
          </label>
          <PasswordInput id="mdp-nouveau" name="nouveau_mot_de_passe" required minLength={8} autoComplete="new-password" placeholder="8 caractères minimum" />
        </div>
        <div>
          <label htmlFor="mdp-confirmation" className="mb-1.5 block text-sm font-medium text-phoebe-anthracite">
            Confirmer le nouveau mot de passe
          </label>
          <PasswordInput id="mdp-confirmation" name="confirmation" required minLength={8} autoComplete="new-password" placeholder="Répétez le nouveau mot de passe" />
        </div>
      </div>

      <div className="mt-6">
        <SubmitButton className="rounded-xl bg-phoebe-gold px-7 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-phoebe-gold-dark hover:shadow-md disabled:opacity-50">
          Enregistrer le nouveau mot de passe
        </SubmitButton>
      </div>
    </form>
  );
}
