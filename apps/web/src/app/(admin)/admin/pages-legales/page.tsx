import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import type { Database } from "@group-phoebe/database/types"
import {
  SLUGS_LEGAUX,
  LIBELLES_LEGAUX,
  pageIncomplete,
  type PageLegale,
  type SlugLegal,
} from "@/lib/legal"
import { PageLegaleForm, IndemnisationForm } from "./forms"

export const metadata: Metadata = {
  title: "Pages légales — Administration",
  description: "Mentions légales, CGV, confidentialité et régime d'indemnisation.",
}

function getAdmin() {
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export default async function PagesLegalesAdminPage() {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const user = claimsData?.claims
  if (!user) redirect("/connexion")

  const { data: profil } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.sub)
    .single()
  // Ces textes engagent l'entreprise, et le barème d'indemnisation est un
  // montant : propriétaire seul.
  if (profil?.role !== "proprietaire") redirect("/admin")

  const db = getAdmin()
  const [{ data: pagesRaw }, { data: params }] = await Promise.all([
    db.from("pages_legales").select("*"),
    db.from("parametres_livraison").select("*").eq("id", true).maybeSingle(),
  ])

  const pages = new Map((pagesRaw ?? []).map((p) => [p.slug, p as unknown as PageLegale]))
  const brouillons = (pagesRaw ?? []).filter((p) => !p.publie)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-phoebe-anthracite">Pages légales</h1>
        <p className="mt-1 text-sm text-phoebe-anthracite/70">
          Ces textes engagent GROUP PHOEBE. Tant qu&apos;une page n&apos;est pas
          publiée, elle affiche un bandeau « document provisoire » et reste hors
          des moteurs de recherche.
        </p>
      </div>

      {brouillons.length > 0 && (
        <div className="rounded-2xl border border-accent-gold/40 bg-phoebe-gold/5 p-4">
          <p className="text-sm font-semibold text-phoebe-gold-dark">
            {brouillons.length} page{brouillons.length > 1 ? "s" : ""} en brouillon
          </p>
          <p className="mt-1 text-xs text-phoebe-anthracite/70">
            Les passages <span className="font-mono">[À COMPLÉTER]</span> nomment ce
            qui manque — immatriculation, siège, hébergeur, durées de conservation.
            Une page ne peut pas être publiée tant qu&apos;il en reste : mieux vaut
            un brouillon annoncé qu&apos;un engagement troué.
          </p>
        </div>
      )}

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-phoebe-anthracite/70">
          Indemnisation des colis
        </h2>
        <p className="text-xs text-phoebe-anthracite/60">
          La valeur déclarée était demandée au client sans rien promettre. Ce
          réglage décide de ce qu&apos;on lui annonce sous le champ, de ce que
          disent les CGV, et du montant calculé si un envoi est clôturé en perte.
        </p>
        <IndemnisationForm
          initial={{
            indemnisation_active: params?.indemnisation_active ?? false,
            indemnisation_taux: Number(params?.indemnisation_taux ?? 0),
            indemnisation_plafond: Number(params?.indemnisation_plafond ?? 0),
            indemnisation_conditions: params?.indemnisation_conditions ?? "",
          }}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-phoebe-anthracite/70">
          Contenu des pages
        </h2>
        {SLUGS_LEGAUX.map((slug) => {
          const page = pages.get(slug)
          return (
            <details
              key={slug}
              className="rounded-2xl border border-phoebe-pearl bg-white p-5 shadow-sm"
            >
              <summary className="flex cursor-pointer flex-wrap items-center gap-2">
                <span className="font-semibold text-phoebe-anthracite">
                  {LIBELLES_LEGAUX[slug as SlugLegal]}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    page?.publie
                      ? "bg-phoebe-green/10 text-phoebe-green-deep"
                      : "bg-phoebe-gold/10 text-phoebe-gold-dark"
                  }`}
                >
                  {page?.publie ? "Publiée" : "Brouillon"}
                </span>
                {page && pageIncomplete(page) && (
                  <span className="rounded-full bg-error/10 px-2.5 py-0.5 text-[11px] font-semibold text-error">
                    Contient des [À COMPLÉTER]
                  </span>
                )}
                <Link
                  href={`/legal/${slug}`}
                  target="_blank"
                  className="ml-auto text-xs text-phoebe-green hover:underline"
                >
                  Voir la page
                </Link>
              </summary>

              <div className="mt-4 border-t border-phoebe-pearl pt-4">
                {page ? (
                  <PageLegaleForm page={page} />
                ) : (
                  <p className="text-sm text-phoebe-anthracite/70">
                    Page absente en base — la migration 00071 la crée.
                  </p>
                )}
              </div>
            </details>
          )
        })}
      </section>
    </div>
  )
}
