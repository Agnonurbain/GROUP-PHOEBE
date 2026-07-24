import Link from "next/link"
import Image from "next/image"

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
    <footer className="border-t border-white/10 bg-public-bg">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex flex-wrap gap-16">
          <div className="flex w-64 flex-col gap-4">
            <Link href="/">
              <Image src="/logos/logo_g-phoebe.png" alt="GROUP PHOEBE" width={334} height={303} className="h-20 w-auto" />
            </Link>
            <p className="text-sm text-public-text-muted">Leader Excellence Brilliant.</p>
            <p className="text-xs text-public-text-faint">
              &copy; {new Date().getFullYear()} GROUP PHOEBE. Tous droits réservés.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title} className="flex flex-col gap-3">
              <span className="text-sm font-semibold text-public-text">{col.title}</span>
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
          ))}
        </div>
      </div>
    </footer>
  )
}
