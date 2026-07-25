import type { Metadata } from "next"
import Link from "next/link"
import { BackLink } from "@/components/public/back-link"
import { Badge, Button, Card } from "@/components/ui"
import {
  ZONES_LIVRAISON,
  MODES_LIVRAISON,
  ZONE_LABELS,
  ZONE_DESCRIPTIONS,
  MODE_LABELS,
  MODE_DESCRIPTIONS,
  TARIFS_LIVRAISON,
} from "@/lib/livraison"

export const metadata: Metadata = {
  title: "Livraison de colis — Transport & Coursier",
  description: "Service de livraison de colis et coursier à Abidjan et partout en Côte d'Ivoire. Envois rapides, livraison porte-à-porte avec GROUP PHOEBE.",
  openGraph: {
    title: "Livraison de colis — Transport & Coursier",
    description: "Service de livraison de colis et coursier à Abidjan et partout en Côte d'Ivoire. Envois rapides, livraison porte-à-porte avec GROUP PHOEBE.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Livraison de colis — Transport & Coursier",
    description: "Service de livraison de colis et coursier à Abidjan et partout en Côte d'Ivoire.",
  },
}

export default async function Livraison({
  searchParams,
}: {
  searchParams: Promise<{ echec?: string }>
}) {
  const { echec } = await searchParams

  return (
    <>
      <section className="px-6 py-16">
        <div className="mb-6">
          <BackLink href="/" label="Retour à l'accueil" />
        </div>
        <Badge variant="orange">Livraison</Badge>
        <h1 className="mt-4 text-4xl font-bold text-public-text md:text-5xl">Livraison de colis & Coursier</h1>
        <p className="mt-3 max-w-2xl text-base text-public-text-muted md:text-lg">
          Envois rapides et sécurisés à Abidjan et partout en Côte d&apos;Ivoire, livrés porte-à-porte.
        </p>
        {echec && (
          <div role="alert" className="mt-6 max-w-2xl rounded-xl border border-error/30 bg-error/5 px-5 py-3 text-sm text-error">
            Le paiement a été annulé. Vous pouvez relancer votre commande à tout moment.
          </div>
        )}
        <div className="mt-8">
          <Link href="/livraison/commander">
            <Button variant="orange" size="lg">Commander une livraison</Button>
          </Link>
        </div>
      </section>

      {/* Tarifs — source unique (grille lib/livraison) */}
      <section className="px-6 pb-20">
        <h2 className="text-3xl font-semibold text-public-text">Nos tarifs</h2>
        <p className="mt-2 text-sm text-public-text-muted">Prix par mode d&apos;envoi et zone de destination.</p>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {MODES_LIVRAISON.map((mode) => (
            <Card key={mode} className="flex flex-col transition-all hover:border-accent-orange/30 hover:bg-public-bg-elevated">
              <h3 className="text-lg font-semibold text-public-text">{MODE_LABELS[mode]}</h3>
              <p className="mt-2 text-sm text-public-text-muted">{MODE_DESCRIPTIONS[mode]}</p>
              <ul className="mt-5 space-y-2 border-t border-public-border pt-4">
                {ZONES_LIVRAISON.map((zone) => (
                  <li key={zone} className="flex items-center justify-between text-sm">
                    <span className="text-public-text-muted">{ZONE_LABELS[zone]}</span>
                    <span className="font-bold text-accent-orange">{TARIFS_LIVRAISON[zone][mode].toLocaleString()} FCFA</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="mx-6 mb-20 rounded-2xl border border-public-border bg-public-bg-card p-8">
        <h2 className="text-3xl font-semibold text-public-text">Comment ça marche</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-4">
          {[
            { step: "1", title: "Commandez", desc: "Choisissez votre mode et remplissez les détails de livraison en ligne." },
            { step: "2", title: "Payez", desc: "Réglez en ligne par carte ou Mobile Money, en toute sécurité." },
            { step: "3", title: "Nous collectons", desc: "Un coursier récupère votre colis à l'adresse de collecte." },
            { step: "4", title: "Livraison", desc: "Votre colis est livré au destinataire, rapidement et en sécurité." },
          ].map((s) => (
            <div key={s.step} className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-orange text-sm font-bold text-white">{s.step}</div>
              <div>
                <h3 className="text-base font-semibold text-public-text">{s.title}</h3>
                <p className="text-sm text-public-text-muted">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Zones de livraison */}
      <section className="mx-6 mb-20 rounded-2xl border border-public-border bg-public-bg-card p-8">
        <h2 className="text-3xl font-semibold text-public-text">Zones de livraison</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {ZONES_LIVRAISON.map((zone) => (
            <Card key={zone} className="transition-all hover:border-accent-orange/30">
              <h3 className="text-base font-semibold text-public-text">{ZONE_LABELS[zone]}</h3>
              <p className="mt-1 text-sm text-public-text-muted">{ZONE_DESCRIPTIONS[zone]}</p>
              <p className="mt-3 text-sm text-public-text-muted">
                À partir de <span className="font-bold text-accent-orange">{TARIFS_LIVRAISON[zone].standard.toLocaleString()} FCFA</span>
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Types de colis */}
      <section className="mx-6 mb-20 rounded-2xl border border-public-border bg-public-bg-card p-8">
        <h2 className="text-3xl font-semibold text-public-text">Types de colis</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {[
            { title: "Petits colis", desc: "Documents, vêtements, accessoires — jusqu'à 5 kg" },
            { title: "Colis moyens", desc: "Équipements électroniques, livres, cadeaux — jusqu'à 15 kg" },
            { title: "Gros colis", desc: "Cartons, meubles, équipements — jusqu'à 50 kg" },
            { title: "Courses & commissions", desc: "Achats en magasin, retrait de documents, courses diverses" },
          ].map((c) => (
            <Card key={c.title} className="transition-all hover:border-accent-orange/30">
              <h3 className="text-base font-semibold text-public-text">{c.title}</h3>
              <p className="mt-1 text-sm text-public-text-muted">{c.desc}</p>
            </Card>
          ))}
        </div>
      </section>
    </>
  )
}
