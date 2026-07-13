import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user!.id)
    .single();

  const isProprietaire = profile?.role === "proprietaire";

  const { count: nbRemboursements } = await supabase
    .from("paiements")
    .select("id", { count: "exact", head: true })
    .eq("statut", "remboursement_requis");

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <aside className="w-56 border-r border-phoebe-pearl bg-white p-4">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-phoebe-anthracite/40">
          Back-office
        </h2>
        <nav className="space-y-1">
          <Link
            href="/admin/vehicules"
            className="block rounded-lg px-3 py-2 text-sm text-phoebe-anthracite/70 transition-colors hover:bg-phoebe-pearl hover:text-phoebe-green"
          >
            Véhicules
          </Link>
          <Link
            href="/admin/verifications"
            className="block rounded-lg px-3 py-2 text-sm text-phoebe-anthracite/70 transition-colors hover:bg-phoebe-pearl hover:text-phoebe-green"
          >
            Vérifications
          </Link>
          <Link
            href="/admin/remboursements"
            className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-phoebe-anthracite/70 transition-colors hover:bg-phoebe-pearl hover:text-phoebe-green"
          >
            Remboursements
            {!!nbRemboursements && nbRemboursements > 0 && (
              <span className="rounded-full bg-error px-2 py-0.5 text-xs font-bold text-white">
                {nbRemboursements}
              </span>
            )}
          </Link>
          {isProprietaire && (
            <Link
              href="/admin/comptes"
              className="block rounded-lg px-3 py-2 text-sm text-phoebe-anthracite/70 transition-colors hover:bg-phoebe-pearl hover:text-phoebe-green"
            >
              Comptes internes
            </Link>
          )}
        </nav>
      </aside>
      <div className="flex-1 p-6">{children}</div>
    </div>
  );
}
