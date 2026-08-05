import { metadonnees } from "@/lib/i18n/metadonnees"
import { BackLink } from "@/components/public/back-link"
import { Badge, Card } from "@/components/ui"
import { MailIcon, PhoneIcon } from "@/components/icons"
import { ContactForm } from "@/components/public/contact-form"
import { getParametresContact } from "@/lib/public-cache"
import { telHref, reseauxActifs } from "@/lib/contact"
import { getT } from "@/lib/i18n/server"

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

export const generateMetadata = () =>
  metadonnees((t) => ({
    titre: t.meta.contactTitre,
    description: t.meta.contactDescription,
  }))

export default async function Contact({
  searchParams,
}: {
  searchParams: Promise<{ sujet?: string }>
}) {
  const t = await getT()
  const { sujet } = await searchParams
  const { category, message } = mapSujet(sujet ?? "")

  // Coordonnées pilotées depuis /admin/tarifs : seuls les champs renseignés
  // s'affichent (pas de fausse coordonnée publique).
  const contact = await getParametresContact()
  const tel = telHref(contact.telephone)
  const reseaux = reseauxActifs(contact)
  const coordonnees = [
    contact.email
      ? { icon: MailIcon, label: "Email", value: contact.email, href: `mailto:${contact.email}` }
      : null,
    tel && contact.telephone
      ? { icon: PhoneIcon, label: t.auth.telephone, value: contact.telephone, href: tel }
      : null,
    contact.adresse
      ? { icon: null, label: t.divers.adresse, value: contact.adresse, href: "#" }
      : null,
  ].filter((c): c is { icon: typeof MailIcon | null; label: string; value: string; href: string } => c !== null)

  return (
    <>
      <section className="px-6 py-16">
        <div className="mb-6">
          <BackLink href="/" label={t.commun.retourAccueil} />
        </div>
        <Badge variant="gold">Contact</Badge>
        <h1 className="mt-4 text-4xl font-bold text-public-text md:text-5xl">{t.divers.parlonsProjet}</h1>
        <p className="mt-3 text-base text-public-text-muted md:text-lg">{t.divers.parlonsProjetLede}</p>
      </section>

      <div className="grid gap-12 px-6 pb-20 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ContactForm defaultCategory={category} defaultMessage={message} />
        </div>

        <div className="lg:col-span-2 space-y-8">
          <Card>
            <h2 className="font-display text-2xl font-medium text-public-text">{t.divers.nosCoordonnees}</h2>
            <div className="mt-6 space-y-5">
              {coordonnees.map((c) => (
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

          {contact.horaires && (
            <Card>
              <h2 className="font-display text-2xl font-medium text-public-text">Horaires</h2>
              <p className="mt-3 whitespace-pre-line text-sm text-public-text-muted">
                {contact.horaires}
              </p>
            </Card>
          )}

          {reseaux.length > 0 && (
            <Card>
              <h2 className="font-display text-2xl font-medium text-public-text">{t.divers.suivezNous}</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {reseaux.map((r) => (
                  <a
                    key={r.key}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-public-border px-3 py-2 text-sm font-medium text-public-text-muted transition-colors hover:border-accent-gold/40 hover:text-public-text"
                  >
                    {r.label}
                  </a>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}
