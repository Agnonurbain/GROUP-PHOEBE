import Link from "next/link"
import Image from "next/image"
import { getParametresContact } from "@/lib/public-cache"
import { telHref, reseauxActifs } from "@/lib/contact"

/* Hallmark · chrome partagé — voir design.md (§ Ce que TOUTES les pages partagent).
   Footer éditorial : filets, colonnes alignées à gauche, eyebrow en petites
   capitales espacées. Pas de grille de cartes, pas de centrage. */

const servicesLinks = [
  { href: "/livraison", label: "Livraison" },
  { href: "/transport/catalogue", label: "Transport" },
  { href: "/immobilier", label: "Immobilier" },
  { href: "/assistance", label: "Assistance Voyages" },
]

const legalLinks = [
  { href: "/legal/mentions-legales", label: "Mentions légales" },
  { href: "/legal/cgv", label: "CGV" },
  { href: "/legal/confidentialite", label: "Politique de confidentialité" },
]

export async function Footer() {
  const contact = await getParametresContact()
  const tel = telHref(contact.telephone)
  const reseaux = reseauxActifs(contact)

  // Un champ non renseigné n'affiche rien : mieux vaut une absence qu'une
  // fausse coordonnée sur laquelle un visiteur peut appeler.
  const contactLinks = [
    { href: "/contact", label: "Nous écrire" },
    ...(contact.email ? [{ href: `mailto:${contact.email}`, label: contact.email }] : []),
    ...(tel && contact.telephone ? [{ href: tel, label: contact.telephone }] : []),
  ]

  const columns = [
    { title: "Services", links: servicesLinks },
    { title: "Contact", links: contactLinks },
    { title: "Légal", links: legalLinks },
  ]

  return (
    <footer className="border-t border-public-border bg-public-bg">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:px-10">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr] lg:gap-20">
          <div>
            <Link href="/" className="inline-block">
              <Image
                src="/logos/logo_g-phoebe.png"
                alt="GROUP PHOEBE"
                width={334}
                height={303}
                className="h-16 w-auto"
              />
            </Link>
            <p className="font-display mt-5 text-2xl font-medium leading-snug text-public-text">
              Leader Excellence Brilliant.
            </p>
            <p className="mt-3 max-w-xs text-sm text-public-text-muted">
              Transport, immobilier, assistance voyages et livraison en Côte d&apos;Ivoire.
            </p>
            {contact.adresse && (
              <p className="mt-3 text-sm text-public-text-muted">{contact.adresse}</p>
            )}
            {contact.horaires && (
              <p className="mt-1 text-sm text-public-text-faint">{contact.horaires}</p>
            )}
            {reseaux.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {reseaux.map((r) => (
                  <a
                    key={r.key}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-public-border px-3 py-1.5 text-xs font-medium text-public-text-muted transition-colors hover:border-accent-gold/40 hover:text-public-text"
                  >
                    {r.label}
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-10 sm:grid-cols-3">
            {columns.map((col) => (
              <div key={col.title}>
                <span className="text-xs font-medium uppercase tracking-[0.2em] text-accent-gold">
                  {col.title}
                </span>
                <div className="mt-4 flex flex-col gap-3 border-t border-public-border pt-4">
                  {col.links.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="text-sm text-public-text-muted transition-colors hover:text-public-text"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-14 border-t border-public-border pt-6 text-xs text-public-text-faint">
          &copy; {new Date().getFullYear()} GROUP PHOEBE. Tous droits réservés.
        </p>
      </div>
    </footer>
  )
}
