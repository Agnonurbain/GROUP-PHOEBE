import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ThemeProvider } from "@/components/theme-provider";
import { DeconnexionTerrain } from "./deconnexion";

/**
 * Espace terrain — livreurs et, plus tard, agents immobiliers.
 *
 * Séparé du back-office parce que ce n'en est pas un : on l'utilise debout, à
 * une main, dehors, avec du réseau capricieux. Le shell admin refuse d'ailleurs
 * le rôle `livreur` (il n'accepte que `operateur`, `proprietaire` et
 * `agent_immobilier`) — un livreur connecté n'avait donc nulle part où aller.
 *
 * Volontairement hors du groupe `(public)` : ni en-tête marchand, ni panier, ni
 * pied de page. L'écran doit tenir dans un pouce.
 */
export default async function TerrainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  if (!user) redirect("/connexion?redirect=/terrain/livreur");

  const { data: profile } = await supabase
    .from("users")
    .select("role, nom")
    .eq("id", user.sub)
    .single();

  if (!profile || !["livreur", "agent_immobilier"].includes(profile.role)) {
    redirect("/");
  }

  return (
    <ThemeProvider>
      <div className="flex min-h-dvh flex-col bg-public-bg text-public-text">
        <header className="sticky top-0 z-10 border-b border-public-border bg-public-bg/95 backdrop-blur">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{profile.nom ?? "Terrain"}</p>
              <p className="text-xs text-public-text-muted">
                {profile.role === "livreur" ? "Livreur" : "Agent immobilier"}
              </p>
            </div>
            <DeconnexionTerrain />
          </div>
        </header>

        <main className="flex-1 px-4 py-4 pb-16">{children}</main>
      </div>
    </ThemeProvider>
  );
}
