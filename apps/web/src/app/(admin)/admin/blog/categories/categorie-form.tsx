"use client";

import { useActionState } from "react";
import type { BlogState } from "@/app/actions/blog";
import { creerCategorie } from "@/app/actions/blog";
import { SubmitButton } from "@/components/submit-button";

const inputClass =
  "w-full rounded-xl border border-phoebe-anthracite/12 bg-phoebe-pearl/20 px-4 py-2.5 text-sm text-phoebe-anthracite transition-all duration-200 focus:border-phoebe-green focus:bg-phoebe-pearl focus:outline-none focus:ring-2 focus:ring-phoebe-green/15";
const labelClass = "mb-1.5 block text-sm font-medium text-phoebe-anthracite";

export function CategorieForm() {
  const [state, formAction] = useActionState<BlogState, FormData>(creerCategorie, {});

  return (
    <>
      {state.error && (
        <div role="alert" className="mb-4 animate-fade-in rounded-xl border border-error/20 bg-error/5 px-5 py-3 text-sm text-error">
          {state.error}
        </div>
      )}
      {state.success && (
        <div role="status" className="mb-4 animate-fade-in rounded-xl border border-phoebe-green/20 bg-phoebe-green/5 px-5 py-3 text-sm font-medium text-phoebe-green-deep">
          Catégorie enregistrée.
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="nom" className={labelClass}>Nom *</label>
            <input id="nom" name="nom" required placeholder="Ex. Guides voyage" className={inputClass} />
          </div>
          <div>
            <label htmlFor="slug" className={labelClass}>Slug</label>
            <input id="slug" name="slug" placeholder="Laissez vide pour auto-génération" className={inputClass} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="description" className={labelClass}>Description</label>
            <input id="description" name="description" placeholder="Courte description" className={inputClass} />
          </div>
          <div>
            <label htmlFor="ordre" className={labelClass}>Ordre</label>
            <input id="ordre" name="ordre" type="number" min="0" defaultValue="0" className={inputClass} />
          </div>
        </div>
        <SubmitButton>Ajouter la catégorie</SubmitButton>
      </form>
    </>
  );
}
