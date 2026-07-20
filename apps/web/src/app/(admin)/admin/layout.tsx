import { notFound } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { NavLink } from "./nav-link";
import { AdminMobileNav } from "./admin-mobile-nav";
import { NotificationsDropdown } from "@/components/notifications-dropdown";
import { getNotificationsAdmin } from "@/app/actions/notifications-admin";

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

  const role = profile?.role;
  if (!role || (role !== "operateur" && role !== "proprietaire")) {
    notFound();
  }

  const isProprietaire = role === "proprietaire";

  const [
    { count: nbRemboursements },
    { count: nbDemandesEnAttente },
    { count: nbPropositions },
    notifsData,
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
    getNotificationsAdmin(),
  ]);

  return (
    <div className="flex min-h-[calc(100vh-5rem)]">
      <AdminMobileNav
          isProprietaire={isProprietaire}
          nbDemandesEnAttente={nbDemandesEnAttente ?? null}
          nbRemboursements={nbRemboursements ?? null}
          nbPropositions={nbPropositions ?? null}
        />
      <aside className="hidden md:flex w-60 shrink-0 flex-col overflow-y-auto border-r border-phoebe-pearl bg-gradient-to-b from-white to-phoebe-pearl/40">
        {/* Admin branding */}
        <div className="border-b border-phoebe-pearl px-4 py-4">
          <Image
            src="/logo.png"
            alt="Group PHOEBE"
            width={200}
            height={80}
            className="h-14 w-auto object-contain"
            quality={95}
          />
          <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-phoebe-gold">
            Back-office · {isProprietaire ? "Propriétaire" : "Opérateur"}
          </p>
        </div>

        <div className="flex-1 space-y-6 p-4">
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
                <NavLink href="/admin/audit">Journal d&apos;audit</NavLink>
              </nav>
            </div>
          )}
        </div>

        {/* Bottom branding */}
        <div className="border-t border-phoebe-pearl px-5 py-3">
          <p className="text-[9px] font-medium tracking-[0.12em] text-phoebe-anthracite/30">
            GROUP PHOEBE &copy; {new Date().getFullYear()}
          </p>
        </div>
      </aside>
      <div className="flex-1 overflow-y-auto bg-phoebe-pearl/15">
        <div className="flex items-center justify-end border-b border-phoebe-pearl bg-white px-4 py-2 md:px-8">
          <NotificationsDropdown
            initialNonLues={notifsData.nonLues}
            initialRecentes={notifsData.recentes}
          />
        </div>
        <div className="px-4 pb-4 pt-6 md:p-8">{children}</div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-phoebe-anthracite/35">
      {children}
    </h2>
  );
}
