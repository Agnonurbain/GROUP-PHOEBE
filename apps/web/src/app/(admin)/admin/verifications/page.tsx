import { createClient } from "@/lib/supabase/server";
import { VerificationBadge } from "@/components/verification-badge";
import { VerificationActions } from "./actions-client";
import { getSignedDocUrl } from "@/lib/storage";
import type { StatutVerification } from "@/lib/auth";

export default async function VerificationsPage() {
  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();
  const currentUserId = claimsData?.claims?.sub as string;

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

  const staffIds = [
    ...new Set(
      (others ?? []).map((u) => u.verifie_par).filter(Boolean) as string[]
    ),
  ];
  const staffNames: Record<string, string> = {};
  if (staffIds.length > 0) {
    const { data: staffList } = await supabase
      .from("users")
      .select("id, nom, role")
      .in("id", staffIds);
    for (const s of staffList ?? []) {
      const roleLabel = s.role === "proprietaire" ? "Propriétaire" : "Opérateur";
      staffNames[s.id] = s.id === currentUserId ? "Moi" : `${s.nom} (${roleLabel})`;
    }
  }

  const signedUrls: Record<string, { piece: string | null; permis: string | null }> = {};
  for (const u of pending ?? []) {
    const [piece, permis] = await Promise.all([
      getSignedDocUrl(supabase, u.piece_identite_url),
      getSignedDocUrl(supabase, u.permis_conduire_url),
    ]);
    signedUrls[u.id] = { piece, permis };
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-phoebe-anthracite">
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
                className="group/card relative flex items-start justify-between overflow-hidden rounded-2xl border border-phoebe-gold/30 bg-phoebe-gold/5 p-5 transition-all hover:shadow-md"
              >
                <span className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-gradient-to-r from-phoebe-gold-light via-phoebe-gold to-phoebe-gold-dark transition-transform duration-300 group-hover/card:scale-x-100" />
                <div className="space-y-1">
                  <p className="font-medium text-phoebe-anthracite">
                    {user.nom}
                  </p>
                  <p className="text-sm text-phoebe-anthracite/60">
                    {user.telephone || user.email}
                    {user.date_naissance &&
                      ` · Né(e) le ${new Date(user.date_naissance).toLocaleDateString("fr-FR")}`}
                  </p>
                  <div className="flex gap-3 pt-1 text-xs">
                    {signedUrls[user.id]?.piece && (
                      <a
                        href={signedUrls[user.id].piece!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-phoebe-green underline hover:text-phoebe-green-deep"
                      >
                        Pièce d&apos;identité
                      </a>
                    )}
                    {signedUrls[user.id]?.permis && (
                      <a
                        href={signedUrls[user.id].permis!}
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
          <div className="overflow-x-auto rounded-2xl border border-phoebe-pearl bg-white shadow-sm">
            <table className="w-full min-w-[500px] text-sm">
              <thead className="border-b border-phoebe-pearl bg-phoebe-pearl/30">
                <tr>
                  <th scope="col" className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/50">
                    Nom
                  </th>
                  <th scope="col" className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/50">
                    Contact
                  </th>
                  <th scope="col" className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/50">
                    Statut
                  </th>
                  <th scope="col" className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/50">
                    Traité par
                  </th>
                  <th scope="col" className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/50">
                    Motif
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-phoebe-pearl/70">
                {others.map((user) => (
                  <tr key={user.id} className="transition-colors hover:bg-phoebe-pearl/40">
                    <td className="px-4 py-3 text-phoebe-anthracite">
                      {user.nom}
                    </td>
                    <td className="px-4 py-3 text-phoebe-anthracite/70">
                      {user.telephone || user.email || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <VerificationBadge
                        statut={
                          user.statut_verification as StatutVerification
                        }
                      />
                    </td>
                    <td className="px-4 py-3 text-phoebe-anthracite/70">
                      {user.verifie_par ? staffNames[user.verifie_par] ?? "—" : "—"}
                    </td>
                    <td className="px-4 py-3 text-phoebe-anthracite/70">
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
