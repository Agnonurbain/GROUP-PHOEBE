import { createClient } from "@/lib/supabase/server";
import { NavLink } from "./nav-link";

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

  const [
    { count: nbRemboursements },
    { count: nbDemandesEnAttente },
    { count: nbPropositions },
  ] = await Promise.all([
    supabase
      .from("paiements")
      .select("id", { count: "exact", head: true })
      .eq("statut", "remboursement_requis"),
    supabase
      .from("demandes_transport")
      .select("id", { count: "exact", head: true })
      .eq("statut", "en_attente_validation"),
    supabase
      .from("propositions_prix")
      .select("id", { count: "exact", head: true })
      .eq("statut", "en_attente"),
  ]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <aside className="w-56 shrink-0 overflow-y-auto border-r border-phoebe-pearl bg-white p-4 space-y-6">
        {isProprietaire && (
          <div>
            <NavLink href="/admin">Tableau de bord</NavLink>
          </div>
        )}

        <div>
          <SectionTitle>Transport</SectionTitle>
          <nav className="space-y-0.5">
            <NavLink href="/admin/demandes" badge={nbDemandesEnAttente}>
              Demandes
            </NavLink>
            <NavLink href="/admin/vehicules">Véhicules</NavLink>
            <NavLink href="/admin/verifications">Vérifications</NavLink>
            {isProprietaire && (
              <NavLink href="/admin/remboursements" badge={nbRemboursements} badgeColor="bg-error">
                Remboursements
              </NavLink>
            )}
            {isProprietaire && (
              <NavLink href="/admin/propositions" badge={nbPropositions}>
                Propositions de prix
              </NavLink>
            )}
          </nav>
        </div>

        {isProprietaire && (
          <div>
            <SectionTitle>Administration</SectionTitle>
            <nav className="space-y-0.5">
              <NavLink href="/admin/comptes">Comptes internes</NavLink>
            </nav>
          </div>
        )}
      </aside>
      <div className="flex-1 p-6">{children}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-phoebe-anthracite/40">
      {children}
    </h2>
  );
}
