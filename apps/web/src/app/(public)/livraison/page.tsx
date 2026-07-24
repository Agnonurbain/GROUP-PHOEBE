import type { Metadata } from "next"
import { BackLink } from "@/components/public/back-link"
import { Badge, Card } from "@/components/ui"

export const metadata: Metadata = {
  title: "Livraison de colis — Transport & Coursier",
  description: "Service de livraison de colis et coursier à Abidjan et partout en Côte d'Ivoire. Envois rapides, suivi en temps réel, livraison porte-à-porte avec GROUP PHOEBE.",
  openGraph: {
    title: "Livraison de colis — Transport & Coursier",
    description: "Service de livraison de colis et coursier à Abidjan et partout en Côte d'Ivoire. Envois rapides, suivi en temps réel, livraison porte-à-porte avec GROUP PHOEBE.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Livraison de colis — Transport & Coursier",
    description: "Service de livraison de colis et coursier à Abidjan et partout en Côte d'Ivoire. Envois rapides, suivi en temps réel, livraison porte-à-porte avec GROUP PHOEBE.",
  },
}

export default function Livraison() {
  return (
    <>
      <section className="px-6 py-16">
        <div className="mb-6">
          <BackLink href="/" label="Retour à l'accueil" />
        </div>
        <Badge variant="orange">Livraison</Badge>
        <h1 className="mt-4 text-4xl font-bold text-public-text md:text-5xl">Livraison de colis & Coursier</h1>
        <p className="mt-3 text-base text-public-text-muted md:text-lg">Envois rapides et sécurisés à Abidjan et partout en Côte d&apos;Ivoire.</p>
      </section>

      <section className="px-6 pb-20">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { title: "Livraison express", desc: "Livraison en 24h à Abidjan et dans les grandes villes.", price: "À partir de 3 000 FCFA" },
            { title: "Livraison standard", desc: "Livraison sous 48-72h partout en Côte d'Ivoire.", price: "À partir de 1 500 FCFA" },
            { title: "Coursier dédié", desc: "Un coursier pour vos courses et documents urgents.", price: "À partir de 5 000 FCFA" },
          ].map((s) => (
            <Card key={s.title} className="transition-all hover:border-accent-orange/30 hover:bg-public-bg-elevated">
              <h3 className="text-lg font-semibold text-public-text">{s.title}</h3>
              <p className="mt-2 text-sm text-public-text-muted">{s.desc}</p>
              <p className="mt-4 text-3xl font-bold text-accent-orange">{s.price}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-6 mb-20 rounded-2xl border border-public-border bg-public-bg-card p-8">
        <h2 className="text-3xl font-semibold text-public-text">Comment ça marche</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-4">
          {[
            { step: "1", title: "Commandez", desc: "Choisissez votre service et remplissez les détails de livraison." },
            { step: "2", title: "Nous collectons", desc: "Un coursier récupère votre colis à l'adresse indiquée." },
            { step: "3", title: "Suivez", desc: "Suivez votre colis en temps réel depuis votre compte." },
            { step: "4", title: "Recevez", desc: "Votre colis livré rapidement et en toute sécurité." },
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

      <section className="mx-6 mb-20 rounded-2xl border border-public-border bg-public-bg-card p-8">
        <h2 className="text-3xl font-semibold text-public-text">Zones de livraison</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            { zone: "Abidjan", desc: "Livraison express 24h dans toutes les communes", price: "À partir de 1 500 FCFA" },
            { zone: "Villes principales", desc: "Bouaké, Yamoussoukro, San-Pédro, Korhogo", price: "À partir de 3 000 FCFA" },
            { zone: "Toute la Côte d'Ivoire", desc: "Livraison partout sur le territoire national", price: "À partir de 5 000 FCFA" },
          ].map((z) => (
            <Card key={z.zone} className="transition-all hover:border-accent-orange/30">
              <h3 className="text-base font-semibold text-public-text">{z.zone}</h3>
              <p className="mt-1 text-sm text-public-text-muted">{z.desc}</p>
              <p className="mt-3 text-3xl font-bold text-accent-orange">{z.price}</p>
            </Card>
          ))}
        </div>
      </section>

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
