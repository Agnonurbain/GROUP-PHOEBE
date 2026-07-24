import type { Metadata } from "next"
import { BackLink } from "@/components/public/back-link"
import { Badge, Button, Card, Input } from "@/components/ui"
import { MailIcon, PhoneIcon } from "@/components/icons"

export const metadata: Metadata = {
  title: "Contact",
  description: "Contactez GROUP PHOEBE pour un devis transport, immobilier ou assistance voyage à Abidjan et partout en Côte d'Ivoire.",
  openGraph: {
    title: "Contact",
    description: "Contactez GROUP PHOEBE pour un devis transport, immobilier ou assistance voyage à Abidjan et partout en Côte d'Ivoire.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact",
    description: "Contactez GROUP PHOEBE pour un devis transport, immobilier ou assistance voyage à Abidjan et partout en Côte d'Ivoire.",
  },
}

export default function Contact() {
  return (
    <>
      <section className="px-6 py-16">
        <div className="mb-6">
          <BackLink href="/" label="Retour à l'accueil" />
        </div>
        <Badge variant="gold">Contact</Badge>
        <h1 className="mt-4 text-4xl font-bold text-public-text md:text-5xl">Parlons de votre projet</h1>
        <p className="mt-3 text-base text-public-text-muted md:text-lg">Une question, un devis, une collaboration ? Nous sommes à votre écoute.</p>
      </section>

      <div className="grid gap-12 px-6 pb-20 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-public-text-muted">Prénom</label>
              <Input type="text" variant="default" className="mt-1" placeholder="Jean" />
            </div>
            <div>
              <label className="text-sm font-medium text-public-text-muted">Nom</label>
              <Input type="text" variant="default" className="mt-1" placeholder="Kouamé" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-public-text-muted">Email</label>
            <Input type="email" variant="default" className="mt-1" placeholder="vous@exemple.com" />
          </div>
          <div>
            <label className="text-sm font-medium text-public-text-muted">Téléphone</label>
            <Input type="tel" inputMode="tel" variant="default" className="mt-1" placeholder="+225 01 02 03 04" />
          </div>
          <div>
            <label className="text-sm font-medium text-public-text-muted">Sujet</label>
            <select className="mt-1 w-full rounded-lg border border-public-border bg-public-bg px-4 py-2.5 text-sm text-public-text">
              <option>Transport & Livraison</option>
              <option>Immobilier</option>
              <option>Assistance Voyages</option>
              <option>Partenariat</option>
              <option>Autre</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-public-text-muted">Message</label>
            <textarea rows={5} className="mt-1 w-full rounded-lg border border-public-border bg-public-bg px-4 py-2.5 text-sm text-public-text placeholder-public-text-faint" placeholder="Décrivez votre demande..." />
          </div>
          <Button variant="default" className="w-full">Envoyer le message</Button>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <Card>
            <h2 className="text-3xl font-semibold text-public-text">Nos coordonnées</h2>
            <div className="mt-6 space-y-5">
              {[
                { icon: MailIcon, label: "Email", value: "info@groupphoebe.com", href: "mailto:info@groupphoebe.com" },
                { icon: PhoneIcon, label: "Téléphone", value: "+225 01 02 03 04 05", href: "tel:+2250102030405" },
                { icon: null, label: "Adresse", value: "Abidjan, Côte d'Ivoire", href: "#" },
              ].map((c) => (
                <a key={c.label} href={c.href} className="flex items-start gap-3 group">
                  {c.icon ? (
                    <c.icon size={20} className="mt-0.5 shrink-0 text-accent-gold" />
                  ) : (
                    <svg className="mt-0.5 h-5 w-5 shrink-0 text-accent-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                  <div>
                    <p className="text-sm text-[#6B7280]">{c.label}</p>
                    <p className="text-sm text-public-text group-hover:text-accent-gold transition-colors">{c.value}</p>
                  </div>
                </a>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-3xl font-semibold text-public-text">Horaires</h2>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-public-text-muted">Lun – Ven</span>
                <span className="text-public-text">08:00 – 18:00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-public-text-muted">Sam</span>
                <span className="text-public-text">09:00 – 13:00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-public-text-muted">Dim</span>
                <span className="text-[#6B7280]">Fermé</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
