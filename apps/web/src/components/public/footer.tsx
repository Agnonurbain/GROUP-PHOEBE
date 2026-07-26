import Link from "next/link"
import Image from "next/image"

/* Hallmark · chrome partagé — voir design.md (§ Ce que TOUTES les pages partagent).
   Footer éditorial : filets, colonnes alignées à gauche, eyebrow en petites
   capitales espacées. Pas de grille de cartes, pas de centrage. */

const columns = [
  {
    title: "Services",
    links: [
      { href: "/livraison", label: "Livraison" },
      { href: "/transport/catalogue", label: "Transport" },
      { href: "/immobilier", label: "Immobilier" },
      { href: "/assistance", label: "Assistance Voyages" },
    ],
  },
  {
    title: "Contact",
    links: [
      { href: "/contact", label: "Nous écrire" },
      { href: "mailto:info@groupphoebe.com", label: "info@groupphoebe.com" },
      { href: "tel:+2250102030405", label: "+225 01 02 03 04 05" },
    ],
  },
  {
    title: "Légal",
    links: [
      { href: "#", label: "Mentions légales" },
      { href: "#", label: "CGV" },
      { href: "#", label: "Politique de confidentialité" },
    ],
  },
]

export function Footer() {
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
