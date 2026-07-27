"use client";

import { useActionState } from "react";
import { modifierParametresContact, type TarifState } from "@/app/actions/tarifs";
import {
  CHAMPS_CONTACT,
  CHAMPS_RESEAUX,
  type ParametresContact,
} from "@/lib/contact";

const inputClass =
  "w-full rounded-lg border border-phoebe-anthracite/15 bg-white px-3 py-2 text-sm text-phoebe-anthracite focus:border-phoebe-green focus:outline-none focus:ring-2 focus:ring-phoebe-green/20";
const labelClass = "mb-1 block text-[11px] font-medium text-phoebe-anthracite/70";

export function ContactParamsForm({ contact }: { contact: ParametresContact }) {
  const [state, action, pending] = useActionState<TarifState, FormData>(
    modifierParametresContact,
    {}
  );

  return (
    <form action={action} className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-phoebe-anthracite">Coordonnées & réseaux</h2>
        <p className="mt-1 text-sm text-phoebe-anthracite/70">
          Affichées dans le pied de page et sur la page Contact.{" "}
          <strong>Un champ vide n&apos;affiche rien</strong> — mieux vaut une absence qu&apos;une
          coordonnée erronée sur laquelle un visiteur peut appeler.
        </p>
      </div>

      {state.error && (
        <p role="alert" className="rounded-lg border border-error/20 bg-error/5 px-3 py-2 text-sm text-error">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="rounded-lg border border-phoebe-green/20 bg-phoebe-green/5 px-3 py-2 text-sm text-phoebe-green-deep">
          Coordonnées enregistrées.
        </p>
      )}

      <section className="rounded-2xl border border-phoebe-pearl bg-white p-5">
        <h3 className="text-base font-semibold text-phoebe-anthracite">Contact</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {CHAMPS_CONTACT.map((c) => (
            <div key={c.key} className={c.key === "horaires" ? "sm:col-span-2" : undefined}>
              <label htmlFor={c.key} className={labelClass}>{c.label}</label>
              <input
                id={c.key}
                name={c.key}
                type={c.type}
                defaultValue={contact[c.key] ?? ""}
                placeholder={c.placeholder}
                className={inputClass}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-phoebe-pearl bg-white p-5">
        <h3 className="text-base font-semibold text-phoebe-anthracite">Réseaux sociaux</h3>
        <p className="mt-1 text-xs text-phoebe-anthracite/60">
          Sans numéro WhatsApp, le bouton flottant et le lien de négociation ne s&apos;affichent pas.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {CHAMPS_RESEAUX.map((c) => (
            <div key={c.key}>
              <label htmlFor={c.key} className={labelClass}>{c.label}</label>
              <input
                id={c.key}
                name={c.key}
                type={c.type}
                defaultValue={contact[c.key] ?? ""}
                placeholder={c.placeholder}
                className={inputClass}
              />
            </div>
          ))}
        </div>
      </section>

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-phoebe-green px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-phoebe-green-deep disabled:opacity-50"
      >
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
