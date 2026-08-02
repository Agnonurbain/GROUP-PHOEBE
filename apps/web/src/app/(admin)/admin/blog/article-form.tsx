"use client";

import { useActionState } from "react";
import type { Tables } from "@group-phoebe/database/types";
import type { BlogState } from "@/app/actions/blog";
import { SubmitButton } from "@/components/submit-button";
import { Obligatoire } from "@/components/ui/obligatoire"

type Props = {
  article?: Tables<"articles">;
  categories: Tables<"categories_article">[];
  action: (prev: BlogState, formData: FormData) => Promise<BlogState>;
};

const inputClass =
  "w-full rounded-xl border border-phoebe-anthracite/12 bg-phoebe-pearl/20 px-4 py-2.5 text-sm text-phoebe-anthracite transition-all duration-200 focus:border-phoebe-green focus:bg-phoebe-pearl focus:outline-none focus:ring-2 focus:ring-phoebe-green/15";
const labelClass = "mb-1.5 block text-sm font-medium text-phoebe-anthracite";

export default function ArticleForm({ article, categories, action }: Props) {
  const [state, formAction] = useActionState<BlogState, FormData>(action, {});

  return (
    <>
      {state.error && (
        <div role="alert" className="mb-5 animate-fade-in rounded-xl border border-error/20 bg-error/5 px-5 py-3.5 text-sm text-error">
          {state.error}
        </div>
      )}
      {state.success && (
        <div role="status" className="mb-5 animate-fade-in rounded-xl border border-phoebe-green/20 bg-phoebe-green/5 px-5 py-3.5 text-sm font-medium text-phoebe-green-deep">
          Article enregistré.
        </div>
      )}

      <form action={formAction} className="space-y-8">
        {article && <input type="hidden" name="id" value={article.id} />}

        <fieldset className="space-y-4 rounded-2xl border border-phoebe-pearl bg-white p-6 shadow-sm">
          <legend className="text-lg font-bold tracking-tight text-phoebe-anthracite">
            Contenu
          </legend>

          <div>
            <label htmlFor="titre" className={labelClass}>Titre<Obligatoire /></label>
            <input
              id="titre"
              name="titre"
              required
              defaultValue={article?.titre ?? ""}
              placeholder="Titre de l'article"
              className={inputClass}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="slug" className={labelClass}>Slug</label>
              <input
                id="slug"
                name="slug"
                defaultValue={article?.slug ?? ""}
                placeholder="Laissez vide pour auto-génération"
                className={inputClass}
              />
              <p className="mt-1 text-xs text-phoebe-anthracite/60">
                Généré automatiquement depuis le titre si laissé vide.
              </p>
            </div>
            <div>
              <label htmlFor="categorie_id" className={labelClass}>Catégorie</label>
              <select id="categorie_id" name="categorie_id" defaultValue={article?.categorie_id ?? ""} className={inputClass}>
                <option value="">— Sans catégorie —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.nom}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="resume" className={labelClass}>Résumé</label>
            <textarea
              id="resume"
              name="resume"
              rows={3}
              defaultValue={article?.resume ?? ""}
              placeholder="Court résumé ou extrait accrocheur"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="contenu" className={labelClass}>Contenu<Obligatoire /></label>
            <textarea
              id="contenu"
              name="contenu"
              rows={16}
              required
              defaultValue={article?.contenu ?? ""}
              placeholder="Corps de l'article (Markdown ou HTML)"
              className={`${inputClass} font-mono`}
            />
          </div>
        </fieldset>

        <fieldset className="space-y-4 rounded-2xl border border-phoebe-pearl bg-white p-6 shadow-sm">
          <legend className="text-lg font-bold tracking-tight text-phoebe-anthracite">
            Média & SEO
          </legend>

          <div>
            <label htmlFor="image_couverture" className={labelClass}>Image de couverture</label>
            <input
              id="image_couverture"
              name="image_couverture"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className={inputClass}
            />
            {/* Conserve la couverture existante quand on modifie l'article sans
                redéposer d'image. */}
            <input
              type="hidden"
              name="image_couverture_actuelle"
              value={article?.image_couverture ?? ""}
            />
            <p className="mt-1.5 text-xs text-phoebe-anthracite/60">
              JPEG, PNG ou WebP. Elle est hébergée avec le site — une URL externe
              pouvait casser la page si son domaine n&apos;était pas autorisé.
              {article?.image_couverture && " Laissez vide pour garder l'actuelle."}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="auteur" className={labelClass}>Auteur</label>
              <input
                id="auteur"
                name="auteur"
                defaultValue={article?.auteur ?? ""}
                placeholder="Nom de l'auteur"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="meta_title" className={labelClass}>Meta title</label>
              <input
                id="meta_title"
                name="meta_title"
                defaultValue={article?.meta_title ?? ""}
                placeholder="Titre SEO (si différent du titre)"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="meta_description" className={labelClass}>Meta description</label>
            <textarea
              id="meta_description"
              name="meta_description"
              rows={2}
              defaultValue={article?.meta_description ?? ""}
              placeholder="Description pour les moteurs de recherche"
              className={inputClass}
            />
          </div>
        </fieldset>

        <fieldset className="space-y-4 rounded-2xl border border-phoebe-pearl bg-white p-6 shadow-sm">
          <legend className="text-lg font-bold tracking-tight text-phoebe-anthracite">
            Publication
          </legend>

          <label className="inline-flex items-center gap-3">
            <input
              type="checkbox"
              name="publie"
              defaultChecked={article?.publie ?? false}
              className="h-5 w-5 rounded-md border-phoebe-anthracite/20 text-phoebe-green focus:ring-phoebe-green/30"
            />
            <span className="text-sm text-phoebe-anthracite">
              Publier immédiatement
            </span>
          </label>
        </fieldset>

        <SubmitButton>
          {article ? "Enregistrer les modifications" : "Créer l'article"}
        </SubmitButton>
      </form>
    </>
  );
}
