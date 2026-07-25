import type { Metadata } from "next"
import { BackLink } from "@/components/public/back-link"
import { Badge, Card } from "@/components/ui"
import { MailIcon, PhoneIcon } from "@/components/icons"
import { ContactForm } from "@/components/public/contact-form"

function mapSujet(raw: string): { category: string; message: string } {
  if (/estimation|bien|immobil/i.test(raw)) {
    return {
      category: "Immobilier",
      message: /estimation/i.test(raw) ? "Je souhaite une estimation de mon bien." : "",
    }
  }
  if (/transport|livraison/i.test(raw)) return { category: "Transport & Livraison", message: "" }
  if (/visa|voyage|assistance|etud/i.test(raw)) return { category: "Assistance Voyages", message: "" }
  if (/partenariat/i.test(raw)) return { category: "Partenariat", message: "" }
  return { category: "Transport & Livraison", message: raw ? `Objet : ${raw}` : "" }
}

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

export default async function Contact({
  searchParams,
}: {
  searchParams: Promise<{ sujet?: string }>
}) {
  const { sujet } = await searchParams
  const { category, message } = mapSujet(sujet ?? "")

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
        <div className="lg:col-span-3">
          <ContactForm defaultCategory={category} defaultMessage={message} />
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
                    <p className="text-sm text-public-text-muted">{c.label}</p>
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
                <span className="text-public-text-muted">Fermé</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
