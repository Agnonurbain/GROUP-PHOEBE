import { createClient } from "@/lib/supabase/server";
import { VerificationBadge } from "@/components/verification-badge";
import { VerificationActions } from "./actions-client";
import type { StatutVerification } from "@/lib/auth";

export default async function VerificationsPage() {
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("users")
    .select("*")
    .eq("role", "client")
    .in("statut_verification", ["documents_soumis", "verifie", "rejete"])
    .order("created_at", { ascending: false });

  const pending = users?.filter(
    (u) => u.statut_verification === "documents_soumis"
  );
  const others = users?.filter(
    (u) => u.statut_verification !== "documents_soumis"
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-phoebe-anthracite">
        Vérifications d&apos;identité
      </h1>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-phoebe-gold">
          En attente ({pending?.length ?? 0})
        </h2>
        {pending && pending.length > 0 ? (
          <div className="space-y-3">
            {pending.map((user) => (
              <div
                key={user.id}
                className="flex items-start justify-between rounded-xl border border-phoebe-gold/30 bg-phoebe-gold/5 p-4"
              >
                <div className="space-y-1">
                  <p className="font-medium text-phoebe-anthracite">
                    {user.nom}
                  </p>
                  <p className="text-sm text-phoebe-anthracite/60">
                    {user.telephone}
                    {user.date_naissance &&
                      ` · Né(e) le ${new Date(user.date_naissance).toLocaleDateString("fr-FR")}`}
                  </p>
                  <div className="flex gap-3 pt-1 text-xs">
                    {user.piece_identite_url && (
                      <a
                        href={user.piece_identite_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-phoebe-green underline hover:text-phoebe-green-deep"
                      >
                        Pièce d&apos;identité
                      </a>
                    )}
                    {user.permis_conduire_url && (
                      <a
                        href={user.permis_conduire_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-phoebe-green underline hover:text-phoebe-green-deep"
                      >
                        Permis de conduire
                      </a>
                    )}
                  </div>
                </div>
                <VerificationActions userId={user.id} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-phoebe-anthracite/50">
            Aucune vérification en attente.
          </p>
        )}
      </section>

      {others && others.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-phoebe-anthracite">
            Historique
          </h2>
          <div className="overflow-x-auto rounded-xl border border-phoebe-pearl">
            <table className="w-full min-w-[400px] text-sm">
              <thead className="bg-phoebe-pearl/50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left font-medium text-phoebe-anthracite/60">
                    Nom
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-medium text-phoebe-anthracite/60">
                    Téléphone
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-medium text-phoebe-anthracite/60">
                    Statut
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-medium text-phoebe-anthracite/60">
                    Motif
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-phoebe-pearl">
                {others.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-3 text-phoebe-anthracite">
                      {user.nom}
                    </td>
                    <td className="px-4 py-3 text-phoebe-anthracite/70">
                      {user.telephone}
                    </td>
                    <td className="px-4 py-3">
                      <VerificationBadge
                        statut={
                          user.statut_verification as StatutVerification
                        }
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-phoebe-anthracite/70">
                      {user.motif_rejet ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
