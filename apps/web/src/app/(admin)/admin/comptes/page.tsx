import { createClient } from "@/lib/supabase/server";
import { ComptesForm } from "./comptes-form";
import { DeleteAccountButton } from "./delete-button";
import { ScrollReveal } from "@/components/effects";

export default async function ComptesPage() {
  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();
  const currentUser = claimsData?.claims;

  const { data: currentProfile } = currentUser
    ? await supabase
        .from("users")
        .select("role")
        .eq("id", currentUser.sub)
        .single()
    : { data: null };

  const isProprietaire = currentProfile?.role === "proprietaire";

  const { data: staff } = await supabase
    .from("users")
    .select("id, nom, role, telephone, email, created_at")
    .in("role", ["operateur", "proprietaire", "livreur", "desactive"])
    .order("role")
    .order("nom");

  const roleLabels: Record<string, string> = {
    proprietaire: "Propriétaire",
    operateur: "Opérateur",
    livreur: "Livreur",
    desactive: "Désactivé",
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-phoebe-anthracite">
          Comptes internes
        </h1>
        <p className="mt-1.5 text-sm text-phoebe-anthracite/60">
          Gerez les operateurs et livreurs de la plateforme.
        </p>
      </div>

      {staff && staff.length > 0 && (
        <ScrollReveal>
        <section>
          <h2 className="mb-4 text-xl font-semibold tracking-tight text-phoebe-anthracite">
            Equipe ({staff.length})
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
                    Role
                  </th>
                  <th scope="col" className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/50">
                    Ajoute le
                  </th>
                  {isProprietaire && (
                    <th scope="col" className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/50">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-phoebe-pearl/70">
                {staff.map((member) => (
                  <tr key={member.id} className={`transition-colors hover:bg-phoebe-pearl/40 ${member.role === "desactive" ? "opacity-40" : ""}`}>
                    <td className="px-5 py-3.5 font-semibold text-phoebe-anthracite">
                      {member.nom}
                    </td>
                    <td className="px-5 py-3.5 text-phoebe-anthracite/70">
                      {member.telephone || member.email || "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          member.role === "proprietaire"
                            ? "bg-phoebe-gold/20 text-phoebe-gold"
                            : member.role === "operateur"
                              ? "bg-phoebe-green/10 text-phoebe-green-deep"
                              : member.role === "desactive"
                                ? "bg-error/10 text-error line-through"
                                : "bg-phoebe-pearl text-phoebe-anthracite/60"
                        }`}
                      >
                        {roleLabels[member.role] ?? member.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-phoebe-anthracite/50">
                      {new Date(member.created_at).toLocaleDateString("fr-FR")}
                    </td>
                    {isProprietaire && (
                      <td className="px-5 py-3.5">
                        {member.role !== "proprietaire" && member.role !== "desactive" && (
                          <DeleteAccountButton
                            userId={member.id}
                            nom={member.nom}
                          />
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        </ScrollReveal>
      )}

      {isProprietaire && (
        <ScrollReveal delay={0.15}>
        <section>
          <h2 className="mb-4 text-xl font-semibold tracking-tight text-phoebe-anthracite">
            Creer un compte
          </h2>
          <p className="mb-5 text-sm text-phoebe-anthracite/60">
            Ces comptes ne passent pas par l&apos;inscription publique. Le
            telephone/email et le mot de passe temporaire sont definis par le
            proprietaire.
          </p>
          <ComptesForm />
        </section>
        </ScrollReveal>
      )}
    </div>
  );
}
