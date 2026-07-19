import { createClient } from "@/lib/supabase/server";
import { ScrollReveal } from "@/components/effects";
import { ReservationPourClientForm } from "./reservation-pour-client-form";

export const metadata = { title: "Réserver pour un client — Admin" };

export default async function ReserverPourClientPage() {
  const supabase = await createClient();

  const [
    { data: clients },
    { data: vehicules },
    { data: zones },
    { data: communes },
  ] = await Promise.all([
    supabase
      .from("users")
      .select("id, nom, telephone, email")
      .eq("role", "client")
      .order("nom"),
    supabase
      .from("vehicules")
      .select(
        "id, marque, modele, categorie, prix_journalier, taux_caution, chauffeur_disponible, statut"
      )
      .eq("statut", "disponible")
      .order("marque"),
    supabase
      .from("zones_tarifaires")
      .select("id, nom")
      .order("ordre", { ascending: true }),
    supabase.from("communes").select("id, nom, zone_id").order("nom"),
  ]);

  return (
    <div className="space-y-8">
      <ScrollReveal variant="fade-up">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-phoebe-anthracite">
            Réserver pour un client
          </h1>
          <p className="mt-2 text-sm text-phoebe-anthracite/55">
            Créez une réservation au nom d&apos;un client (ex : appel
            téléphonique). Le client recevra une notification et pourra voir sa
            réservation.
          </p>
        </div>
      </ScrollReveal>

      <ScrollReveal variant="fade-up" delay={0.1}>
        <ReservationPourClientForm
          clients={clients ?? []}
          vehicules={vehicules ?? []}
          zones={zones ?? []}
          communes={communes ?? []}
        />
      </ScrollReveal>
    </div>
  );
}
