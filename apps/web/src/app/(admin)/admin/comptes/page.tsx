import { createClient } from "@/lib/supabase/server";
import { ComptesForm } from "./comptes-form";

export default async function ComptesPage() {
  const supabase = await createClient();

  const { data: staff } = await supabase
    .from("users")
    .select("id, nom, role, telephone, email, created_at")
    .in("role", ["operateur", "proprietaire", "livreur"])
    .order("role")
    .order("nom");

  const roleLabels: Record<string, string> = {
    proprietaire: "Propriétaire",
    operateur: "Opérateur",
    livreur: "Livreur",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-phoebe-anthracite">
          Comptes internes
        </h1>
        <p className="mt-1 text-sm text-phoebe-anthracite/60">
          Gérez les opérateurs et livreurs de la plateforme.
        </p>
      </div>

      {staff && staff.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-phoebe-anthracite">
            Équipe ({staff.length})
          </h2>
          <div className="overflow-x-auto rounded-xl border border-phoebe-pearl">
            <table className="w-full min-w-[500px] text-sm">
              <thead className="bg-phoebe-pearl/50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left font-medium text-phoebe-anthracite/60">
                    Nom
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-medium text-phoebe-anthracite/60">
                    Contact
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-medium text-phoebe-anthracite/60">
                    Rôle
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-medium text-phoebe-anthracite/60">
                    Ajouté le
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-phoebe-pearl">
                {staff.map((member) => (
                  <tr key={member.id}>
                    <td className="px-4 py-3 font-medium text-phoebe-anthracite">
                      {member.nom}
                    </td>
                    <td className="px-4 py-3 text-phoebe-anthracite/70">
                      {member.telephone || member.email || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          member.role === "proprietaire"
                            ? "bg-phoebe-gold/20 text-phoebe-gold"
                            : member.role === "operateur"
                              ? "bg-phoebe-green/10 text-phoebe-green-deep"
                              : "bg-phoebe-pearl text-phoebe-anthracite/60"
                        }`}
                      >
                        {roleLabels[member.role] ?? member.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-phoebe-anthracite/50">
                      {new Date(member.created_at).toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold text-phoebe-anthracite">
          Créer un compte
        </h2>
        <p className="mb-4 text-sm text-phoebe-anthracite/60">
          Ces comptes ne passent pas par l&apos;inscription publique. Le
          téléphone/email et le mot de passe temporaire sont définis par le
          propriétaire.
        </p>
        <ComptesForm />
      </section>
    </div>
  );
}
