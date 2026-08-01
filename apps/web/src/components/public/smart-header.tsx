"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui"
import { LogoutButton } from "@/components/logout-button"
import { ThemeToggle } from "@/components/theme-toggle"
import { LocaleSwitcher } from "@/components/public/locale-switcher"
import type { Langue } from "@/lib/langues"
import { useT } from "@/lib/langue-context"

type Vertical = "transport" | "livraison" | "immobilier" | "assistance" | "default"

interface SmartHeaderProps {
  vertical?: Vertical
  session?: { nom?: string; role?: string } | null
  langues?: Langue[]
  langue?: string
}

// Dimensions intrinsèques des PNG (marges transparentes rognées)
const logos: Record<Vertical, { src: string; alt: string; w: number; h: number }> = {
  default: { src: "/logos/phoebe.png", alt: "GROUP PHOEBE", w: 334, h: 303 },
  transport: { src: "/logos/transport.png", alt: "Transport", w: 500, h: 500 },
  livraison: { src: "/logos/livraison.png", alt: "Livraison", w: 500, h: 500 },
  immobilier: { src: "/logos/immobilier.png", alt: "Immobilier", w: 308, h: 278 },
  assistance: { src: "/logos/assistance.png", alt: "Assistance Voyages & Études", w: 429, h: 346 },
}

const verticales = [
  { id: "transport" as const, cle: "transport" as const, href: "/transport/catalogue" },
  { id: "livraison" as const, cle: "livraison" as const, href: "/livraison" },
  { id: "immobilier" as const, cle: "immobilier" as const, href: "/immobilier" },
  { id: "assistance" as const, cle: "assistance" as const, href: "/assistance" },
]

function detectVertical(pathname: string): Vertical {
  if (pathname.startsWith("/transport")) return "transport"
  if (pathname.startsWith("/livraison")) return "livraison"
  if (pathname.startsWith("/immobilier")) return "immobilier"
  if (pathname.startsWith("/assistance")) return "assistance"
  return "default"
}

export function SmartHeader({ vertical: forcedVertical, session, langues, langue }: SmartHeaderProps) {
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
  const t = useT()
  const isStaff = session?.role === "operateur" || session?.role === "proprietaire"

  const showVerticalNav = !session
  // Les libellés de verticale viennent du dictionnaire : ils étaient figés en
  // français dans le tableau, donc intraduisibles.
  const navLinks = session
    ? isStaff
      ? [{ href: "/admin", label: t.nav.administration }]
      : [
          { href: "/compte/reservations", label: t.nav.mesReservations },
          { href: "/compte/profil", label: session.nom ?? t.nav.monCompte, isName: true },
        ]
    : verticales.map((v) => ({ href: v.href, label: t.nav[v.cle] }))

  // Client connecté : bouton bien visible pour choisir son service, sauf s'il
  // est déjà sur l'accueil (où les services sont affichés).
  const isClient = !!session && !isStaff
  const showServiceCta = isClient && pathname !== "/"

  return (
    <header
      className={`sticky top-0 z-40 border-b border-public-border transition-all duration-200 ${
        scrolled
          ? "bg-public-bg/95 backdrop-blur-md shadow-sm shadow-black/5"
          : "bg-public-bg/90 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="shrink-0">
          <Image src={logo.src} alt={logo.alt} width={logo.w} height={logo.h} className="h-14 w-auto" priority />
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
                className={`relative text-sm transition-colors ${
                  showVerticalNav && "id" in link && link.id === vertical
                    ? "font-medium text-public-text after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-full after:bg-[var(--color-vertical,#C9A84C)]"
                    : "text-public-text-muted hover:text-public-text"
                }`}
              >
                {link.label}
              </Link>
            ),
          )}
          <ThemeToggle className="text-public-text-muted hover:text-public-text" />
          {langues && langue && (
            <LocaleSwitcher langues={langues} current={langue} />
          )}
          {session ? (
            <span className="flex items-center gap-3">
              {showServiceCta && (
                <Link
                  href="/#services"
                  className="rounded-lg bg-accent-gold px-4 py-2 text-sm font-semibold text-[#0A0A0A] shadow-sm transition-colors hover:bg-accent-gold-hover"
                >
                  Choisir un service
                </Link>
              )}
              <Link
                href="/compte/profil"
                aria-label="Mon profil"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-gold/20 text-sm font-semibold text-accent-gold"
              >
                {(session.nom ?? "U")[0].toUpperCase()}
              </Link>
              <LogoutButton
                label="Déconnexion"
                className="rounded-lg border border-error/30 px-3 py-1.5 text-sm font-medium text-error transition-all hover:bg-error hover:text-white"
              />
            </span>
          ) : (
            <span className="flex items-center gap-3">
              <Link href="/connexion">
                <Button variant="ghost" className="text-xs">
                  Connexion
                </Button>
              </Link>
              <Link href="/inscription">
                <Button variant="default" className="text-xs">
                  S&apos;inscrire
                </Button>
              </Link>
            </span>
          )}
        </nav>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle className="text-public-text-muted hover:text-public-text" />
          {langues && langue && (
            <LocaleSwitcher langues={langues} current={langue} />
          )}
          <button
          className="flex h-11 w-11 items-center justify-center rounded-lg text-public-text-muted transition-colors hover:bg-white/5 hover:text-public-text"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={menuOpen}
          aria-controls="menu-mobile"
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
      </div>

      {menuOpen && (
        <div id="menu-mobile" className="animate-fade-in border-t border-public-border bg-public-bg/98 backdrop-blur-md md:hidden">
          <nav className="space-y-1 px-6 py-4">
            {showServiceCta && (
              <Link
                href="/#services"
                onClick={() => setMenuOpen(false)}
                className="flex min-h-11 items-center justify-center rounded-lg bg-accent-gold px-3 py-2.5 text-center text-sm font-semibold text-[#0A0A0A] transition-colors hover:bg-accent-gold-hover"
              >
                Choisir un service
              </Link>
            )}
            {navLinks.map((link) =>
              "isName" in link && link.isName ? (
                <span key={link.href} className="block px-3 py-2.5 text-sm font-medium text-accent-gold">
                  {link.label}
                </span>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex min-h-11 items-center rounded-lg px-3 py-2.5 text-sm text-public-text-muted transition-colors hover:bg-white/5 hover:text-public-text"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ),
            )}
            <hr className="border-public-border" />
            <Link
              href={session ? "/compte/profil" : "/connexion"}
              className="flex min-h-11 items-center rounded-lg px-3 py-2.5 text-sm font-medium text-accent-gold transition-colors hover:bg-accent-gold/5"
              onClick={() => setMenuOpen(false)}
            >
              {session ? "Mon compte" : "Connexion"}
            </Link>
            {session && (
              <LogoutButton
                label="Déconnexion"
                className="flex min-h-11 w-full items-center rounded-lg border border-error/30 px-3 py-2.5 text-left text-sm font-medium text-error transition-all hover:bg-error hover:text-white"
              />
            )}
            {!session && (
              <Link
                href="/inscription"
                className="flex min-h-11 items-center justify-center rounded-lg bg-accent-gold px-3 py-2.5 text-center text-sm font-semibold text-[#0A0A0A] transition-colors hover:bg-accent-gold-hover"
                onClick={() => setMenuOpen(false)}
              >
                S&apos;inscrire
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
