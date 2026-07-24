"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui"

type Vertical = "transport" | "immobilier" | "assistance" | "default"

interface SmartHeaderProps {
  vertical?: Vertical
  session?: { nom?: string; role?: string } | null
}

// Fichiers sources 612x408 (ratio 3:2)
const logos: Record<Vertical, { src: string; alt: string; w: number; h: number }> = {
  default: { src: "/logos/logo_g-phoebe.png", alt: "GROUP PHOEBE", w: 90, h: 60 },
  transport: { src: "/logos/logo-trans-livr.png", alt: "Transport & Livraison", w: 90, h: 60 },
  immobilier: { src: "/logos/logo-imm.png", alt: "Immobilier", w: 90, h: 60 },
  assistance: { src: "/logos/logo-assi-etud.png", alt: "Assistance Voyages & Études", w: 90, h: 60 },
}

const verticales = [
  { id: "transport" as const, label: "Transport", href: "/transport/catalogue" },
  { id: "immobilier" as const, label: "Immobilier", href: "/immobilier" },
  { id: "assistance" as const, label: "Assistance", href: "/assistance" },
]

function detectVertical(pathname: string): Vertical {
  if (pathname.startsWith("/transport")) return "transport"
  if (pathname.startsWith("/immobilier")) return "immobilier"
  if (pathname.startsWith("/assistance")) return "assistance"
  return "default"
}

export function SmartHeader({ vertical: forcedVertical, session }: SmartHeaderProps) {
  const pathname = usePathname()
  const vertical = forcedVertical ?? detectVertical(pathname)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Ferme le menu mobile à chaque navigation (ajustement d'état pendant le rendu,
  // cf. https://react.dev/learn/you-might-not-need-an-effect)
  const [prevPathname, setPrevPathname] = useState(pathname)
  if (pathname !== prevPathname) {
    setPrevPathname(pathname)
    setMenuOpen(false)
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const logo = logos[vertical]
  const isStaff = session?.role === "operateur" || session?.role === "proprietaire"

  const showVerticalNav = !session
  const navLinks = session
    ? isStaff
      ? [{ href: "/admin", label: "Back-office" }]
      : [
          { href: "/transport/catalogue", label: "Catalogue" },
          { href: "/compte/reservations", label: "Mes réservations" },
          { href: "/compte/profil", label: session.nom ?? "Profil", isName: true },
        ]
    : verticales

  return (
    <header
      className={`sticky top-0 z-40 border-b border-white/10 transition-all duration-200 ${
        scrolled
          ? "bg-public-bg/95 backdrop-blur-md shadow-sm shadow-black/5"
          : "bg-public-bg/90 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="shrink-0">
          <Image src={logo.src} alt={logo.alt} width={logo.w} height={logo.h} className="h-10 w-auto" priority />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) =>
            "isName" in link && link.isName ? (
              <span key={link.href} className="text-sm font-medium text-accent-gold">
                {link.label}
              </span>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm transition-colors ${
                  showVerticalNav && "id" in link && link.id === vertical
                    ? "text-public-text font-medium"
                    : "text-public-text-muted hover:text-public-text"
                }`}
              >
                {link.label}
              </Link>
            ),
          )}
          {session ? (
            <span className="flex items-center gap-2">
              <Link
                href="/compte/profil"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-gold/20 text-sm font-semibold text-accent-gold"
              >
                {(session.nom ?? "U")[0].toUpperCase()}
              </Link>
            </span>
          ) : (
            <Link href="/connexion">
              <Button variant="default" className="text-xs">
                Connexion
              </Button>
            </Link>
          )}
        </nav>

        <button
          className="flex h-10 w-10 items-center justify-center rounded-lg text-public-text-muted hover:bg-white/5 md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {menuOpen ? (
              <>
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="6" y1="18" x2="18" y2="6" />
              </>
            ) : (
              <>
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="animate-fade-in border-t border-white/10 bg-public-bg/98 backdrop-blur-md md:hidden">
          <nav className="space-y-1 px-6 py-4">
            {navLinks.map((link) =>
              "isName" in link && link.isName ? (
                <span key={link.href} className="block px-3 py-2.5 text-sm font-medium text-accent-gold">
                  {link.label}
                </span>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block rounded-lg px-3 py-2.5 text-sm text-public-text-muted transition-colors hover:bg-white/5 hover:text-public-text"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ),
            )}
            <hr className="border-white/10" />
            <Link
              href={session ? "/compte/profil" : "/connexion"}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-accent-gold transition-colors hover:bg-accent-gold/5"
              onClick={() => setMenuOpen(false)}
            >
              {session ? "Mon compte" : "Connexion"}
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
