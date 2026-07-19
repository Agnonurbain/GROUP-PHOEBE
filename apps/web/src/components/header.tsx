import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { MobileNav } from "./mobile-nav";
import { LogoutButton } from "./logout-button";
import { CartBadge } from "./cart-badge";

export async function Header() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  let profile: { nom: string; role: string } | null = null;
  if (user) {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.sub)
      .single();
    profile = data;
  }

  const isStaff =
    profile?.role === "operateur" || profile?.role === "proprietaire";

  const navLinks = user && profile
    ? isStaff
      ? [
          { href: "/admin", label: "Back-office" },
          { href: "/profil", label: profile.nom },
        ]
      : [
          { href: "/catalogue", label: "Catalogue" },
          { href: "/profil/reservations", label: "Mes reservations" },
          { href: "/profil", label: profile.nom },
        ]
    : [
        { href: "/catalogue", label: "Catalogue" },
      ];

  return (
    <header className="sticky top-0 z-40 border-b border-phoebe-pearl/80 bg-white/98 backdrop-blur-md shadow-sm shadow-phoebe-green/3">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-1">
          <Image
            src="/logo.png"
            alt="Group PHOEBE"
            width={140}
            height={56}
            className="h-11 w-auto object-contain"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-1 text-sm md:flex">
          {user && profile ? (
            <>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-3 py-2 text-phoebe-anthracite/70 transition-colors hover:bg-phoebe-pearl hover:text-phoebe-green"
                >
                  {link.label}
                </Link>
              ))}
              {!isStaff && <CartBadge />}
              <div className="ml-2 h-5 w-px bg-phoebe-anthracite/10" />
              <LogoutButton className="ml-2 rounded-lg px-3 py-1.5 text-phoebe-anthracite/50 transition-colors hover:bg-error/5 hover:text-error" />
            </>
          ) : (
            <>
              <Link
                href="/catalogue"
                className="rounded-lg px-3 py-2 text-phoebe-anthracite/70 transition-colors hover:bg-phoebe-pearl hover:text-phoebe-green"
              >
                Catalogue
              </Link>
              <Link
                href="/connexion"
                className="rounded-lg px-3 py-2 text-phoebe-anthracite/70 transition-colors hover:bg-phoebe-pearl hover:text-phoebe-green"
              >
                Connexion
              </Link>
              <Link
                href="/inscription"
                className="ml-1 rounded-lg bg-phoebe-green px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-phoebe-green-deep hover:shadow-md"
              >
                Inscription
              </Link>
            </>
          )}
        </nav>

        <MobileNav
          links={navLinks}
          showCart={!isStaff}
          authAction={
            user && profile ? (
              <LogoutButton className="w-full rounded-lg border border-error/20 px-3 py-2.5 text-sm text-error transition-colors hover:bg-error/5" />
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href="/connexion"
                  className="block rounded-lg border border-phoebe-anthracite/15 px-3 py-2.5 text-center text-sm text-phoebe-anthracite/70 transition-colors hover:bg-phoebe-pearl"
                >
                  Connexion
                </Link>
                <Link
                  href="/inscription"
                  className="block rounded-lg bg-phoebe-green px-3 py-2.5 text-center text-sm font-medium text-white shadow-sm transition-all hover:bg-phoebe-green-deep"
                >
                  Inscription
                </Link>
              </div>
            )
          }
        />
      </div>
    </header>
  );
}
