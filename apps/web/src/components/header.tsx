import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { deconnexion } from "@/app/actions/auth";
import { MobileNav } from "./mobile-nav";

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
    ? [
        { href: "/catalogue", label: "Catalogue" },
        ...(isStaff ? [{ href: "/admin/vehicules", label: "Back-office" }] : []),
        { href: "/profil/reservations", label: "Mes réservations" },
        { href: "/profil", label: profile.nom },
      ]
    : [
        { href: "/catalogue", label: "Catalogue" },
      ];

  return (
    <header className="relative border-b border-phoebe-pearl bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold text-phoebe-anthracite">
          GROUP <span className="text-phoebe-green">PHOEBE</span>
        </Link>

        <nav className="hidden items-center gap-4 text-sm md:flex">
          <Link
            href="/catalogue"
            className="text-phoebe-anthracite/70 transition-colors hover:text-phoebe-green"
          >
            Catalogue
          </Link>
          {user && profile ? (
            <>
              {isStaff && (
                <Link
                  href="/admin/vehicules"
                  className="text-phoebe-anthracite/70 transition-colors hover:text-phoebe-green"
                >
                  Back-office
                </Link>
              )}
              <Link
                href="/profil/reservations"
                className="text-phoebe-anthracite/70 transition-colors hover:text-phoebe-green"
              >
                Mes réservations
              </Link>
              <Link
                href="/profil"
                className="text-phoebe-anthracite/70 transition-colors hover:text-phoebe-green"
              >
                {profile.nom}
              </Link>
              <form action={deconnexion}>
                <button
                  type="submit"
                  className="rounded-lg border border-phoebe-anthracite/20 px-3 py-1.5 text-phoebe-anthracite/70 transition-colors hover:border-error hover:text-error"
                >
                  Déconnexion
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/connexion"
                className="text-phoebe-anthracite/70 transition-colors hover:text-phoebe-green"
              >
                Connexion
              </Link>
              <Link
                href="/inscription"
                className="rounded-lg bg-phoebe-green px-4 py-2 text-white transition-colors hover:bg-phoebe-green-deep"
              >
                Inscription
              </Link>
            </>
          )}
        </nav>

        <MobileNav
          links={navLinks}
          authAction={
            user && profile ? (
              <form action={deconnexion}>
                <button
                  type="submit"
                  className="w-full rounded-lg border border-error/30 px-3 py-2.5 text-sm text-error transition-colors hover:bg-error/5"
                >
                  Déconnexion
                </button>
              </form>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href="/connexion"
                  className="block rounded-lg border border-phoebe-anthracite/20 px-3 py-2.5 text-center text-sm text-phoebe-anthracite/70 transition-colors hover:bg-phoebe-pearl"
                >
                  Connexion
                </Link>
                <Link
                  href="/inscription"
                  className="block rounded-lg bg-phoebe-green px-3 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-phoebe-green-deep"
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
