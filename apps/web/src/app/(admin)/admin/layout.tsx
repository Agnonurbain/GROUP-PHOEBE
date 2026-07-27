import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NotificationsDropdown } from "@/components/notifications-dropdown";
import { getNotificationsAdmin } from "@/app/actions/notifications-admin";
import { SidebarInset, SidebarProvider } from "@/components/shadcn/sidebar";
import { AdminSidebar } from "./_components/admin-sidebar";
import { AdminHeader } from "./_components/admin-header";
import { ThemeProvider } from "@/components/theme-provider";

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
    <ThemeProvider>
      {/* `data-admin` délimite le sous-arbre du back-office : les jetons clairs
          hérités (phoebe-anthracite, phoebe-pearl…) y sont inversés en thème
          sombre, sans toucher au reste du site. Voir admin.css. */}
      <SidebarProvider data-admin>
        <AdminSidebar
          isProprietaire={isProprietaire}
          counts={{
            demandes: nbDemandesEnAttente ?? null,
            remboursements: nbRemboursements ?? null,
            propositions: nbPropositions ?? null,
          }}
        />
        <SidebarInset>
          <AdminHeader
            nom={profile?.nom ?? "Utilisateur"}
            email={profile?.email ?? null}
            role={role}
            notifications={
              <NotificationsDropdown
                initialNonLues={notifsData.nonLues}
                initialRecentes={notifsData.recentes}
              />
            }
          />
          <div className="flex-1 bg-muted/30 px-4 pb-8 pt-6 md:px-8">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  );
}
