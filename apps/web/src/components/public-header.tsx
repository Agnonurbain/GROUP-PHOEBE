import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { PublicMobileNav } from "./public-mobile-nav"
import { LogoutButton } from "./logout-button"
import { PhoebeLogo } from "./phoebe-logo"
import { Button } from "@/components/ui"

export async function PublicHeader() {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const user = claimsData?.claims

  let profile: { nom?: string; role?: string } | null = null
  if (user) {
    const { data } = await supabase
      .from("users")
      .select("nom, role")
      .eq("id", user.sub)
      .single()
    profile = data
  }

  const isStaff = profile?.role === "operateur" || profile?.role === "proprietaire"

  const desktopLinks = user && profile
    ? isStaff
      ? [{ href: "/admin", label: "Back-office" }]
      : [
          { href: "/transport/catalogue", label: "Catalogue" },
          { href: "/compte/reservations", label: "Mes réservations" },
          { href: "/compte/profil", label: profile.nom ?? "Profil", isName: true },
        ]
    : [
        { href: "/transport/catalogue", label: "Transport" },
        { href: "/immobilier", label: "Immobilier" },
        { href: "/assistance", label: "Assistance" },
      ]

  const mobileLinks = user && profile
    ? isStaff
      ? [{ href: "/admin", label: "Back-office" }]
      : [
          { href: "/transport/catalogue", label: "Catalogue" },
          { href: "/compte/reservations", label: "Mes réservations" },
          { href: "/compte/profil", label: "Mon profil" },
        ]
    : [
        { href: "/transport/catalogue", label: "Transport" },
        { href: "/immobilier", label: "Immobilier" },
        { href: "/assistance", label: "Assistance" },
        { href: "/connexion", label: "Connexion", isButton: true },
      ]

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-public-bg/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/">
          <PhoebeLogo className="h-8 w-auto" />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {desktopLinks.map((link) =>
            "isName" in link && link.isName ? (
              <span key={link.href} className="text-sm font-medium text-accent-gold">
                {link.label}
              </span>
            ) : (
              <Link key={link.href} href={link.href} className="text-sm text-public-text-muted transition-colors hover:text-public-text">
                {link.label}
              </Link>
            ),
          )}
          {user ? (
            <LogoutButton className="rounded-lg border border-public-border px-4 py-2 text-xs font-semibold text-public-text-muted transition-colors hover:border-[#EF4444]/30 hover:text-[#EF4444]" />
          ) : (
            <Link href="/connexion">
              <Button variant="default" className="text-xs">Connexion</Button>
            </Link>
          )}
        </nav>

        <PublicMobileNav
          links={mobileLinks}
          authAction={user ? <LogoutButton className="block w-full rounded-lg bg-accent-gold px-4 py-3 text-center text-sm font-semibold text-[#0A0A0A] transition-colors hover:bg-accent-gold-hover" label="Se déconnecter" /> : undefined}
        />
      </div>
    </header>
  )
}
