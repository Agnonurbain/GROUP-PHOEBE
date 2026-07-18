import { createClient } from "@/lib/supabase/server";
import { NavLink } from "./nav-link";
import { AdminMobileNav } from "./admin-mobile-nav";

export default async function AdminShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  const { data: profile } = user
    ? await supabase
        .from("users")
        .select("*")
        .eq("id", user.sub)
        .single()
    : { data: null };

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
      <AdminMobileNav
          isProprietaire={isProprietaire}
          nbDemandesEnAttente={nbDemandesEnAttente ?? null}
          nbRemboursements={nbRemboursements ?? null}
          nbPropositions={nbPropositions ?? null}
        />
      <aside className="hidden md:block w-56 shrink-0 overflow-y-auto border-r border-phoebe-pearl bg-phoebe-pearl/30 p-4 space-y-6">
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
            <NavLink href="/admin/reserver-pour-client">Réserver pour client</NavLink>
            <NavLink href="/admin/verifications" exact>Vérifications</NavLink>
            <NavLink href="/admin/verifications/historique">Historique vérif.</NavLink>
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
            {isProprietaire && (
              <NavLink href="/admin/tarifs">Zones &amp; Tarifs</NavLink>
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
      <div className="flex-1 overflow-y-auto p-4 md:p-6">{children}</div>
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
