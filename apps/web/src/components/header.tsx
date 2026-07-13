import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { deconnexion } from "@/app/actions/auth";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { nom: string; role: string } | null = null;
  if (user) {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  const isStaff =
    profile?.role === "operateur" || profile?.role === "proprietaire";

  return (
    <header className="border-b border-phoebe-pearl bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold text-phoebe-anthracite">
          GROUP <span className="text-phoebe-green">PHOEBE</span>
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <Link
            href="/catalogue"
            className="text-phoebe-anthracite/70 hover:text-phoebe-green"
          >
            Catalogue
          </Link>
          {user && profile ? (
            <>
              {isStaff && (
                <Link
                  href="/admin/vehicules"
                  className="text-phoebe-anthracite/70 hover:text-phoebe-green"
                >
                  Back-office
                </Link>
              )}
              <Link
                href="/profil"
                className="text-phoebe-anthracite/70 hover:text-phoebe-green"
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
                className="text-phoebe-anthracite/70 hover:text-phoebe-green"
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
      </div>
    </header>
  );
}
