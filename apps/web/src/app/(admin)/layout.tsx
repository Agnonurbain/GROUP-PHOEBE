import "./admin.css"
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  if (!user) redirect("/connexion");

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.sub)
    .single();

  if (!profile || !["operateur", "proprietaire"].includes(profile.role)) {
    redirect("/compte/profil");
  }

  // Plus de header ici : le shell du back-office (admin/layout.tsx) porte son
  // propre header — fil d'ariane, notifications, thème, menu profil. L'ancien
  // faisait doublon (profil et déconnexion en double) et occupait 5rem au-dessus
  // de la sidebar, qui débordait alors hors de l'écran.
  return (
    <>
      <a href="#contenu" className="skip-link">
        Aller au contenu principal
      </a>
      <main id="contenu" tabIndex={-1}>
        {children}
      </main>
    </>
  );
}
