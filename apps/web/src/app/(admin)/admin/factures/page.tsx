import type { Metadata } from "next"
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ScrollReveal } from "@/components/effects";
import { ParametresFacturationForm } from "./form";

export const metadata: Metadata = {
  title: "Facturation — Administration",
  description: "Paramètres de facturation et registre des factures émises.",
}

const MODULE_LABELS: Record<string, string> = {
  demandes_transport: "Transport",
  demandes_immobilier: "Immobilier",
  demandes_billet: "Billet d'avion",
  expeditions: "Livraison",
  dossiers_voyage: "Assistance",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatMontant(n: number) {
  return `${Math.round(n).toLocaleString("fr-FR")} FCFA`;
}

type FactureRow = {
  id: string;
  numero: string;
  reference_table: string;
  montant_ht: number;
  taux_tva: number;
  montant_ttc: number;
  pdf_chemin: string | null;
  created_at: string;
  annulee: boolean;
  users: { nom: string | null } | null;
};

export default async function FacturesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: rawPage } = await searchParams;
  const page = Math.max(1, Number(rawPage) || 1);
  const pageSize = 30;
  const from = (page - 1) * pageSize;

  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) redirect("/connexion");

  // La numérotation et la TVA engagent l'entreprise : propriétaire seul, comme
  // tout paramètre qui porte un montant.
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.sub)
    .single();
  if (profile?.role !== "proprietaire") redirect("/admin");

  const [{ data: params }, { data: factures, count }] = await Promise.all([
    supabase
      .from("parametres_facturation")
      .select("taux_tva, prefixe_facture, numero_suivant, email_cc")
      .eq("id", true)
      .single(),
    supabase
      .from("factures")
      .select("*, users:client_id(nom)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1) as unknown as Promise<{
        data: FactureRow[] | null;
        count: number | null;
      }>,
  ]);

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / pageSize));

  // Le bucket est privé : chaque ligne a besoin d'un lien signé. Une seule
  // signature pour toute la page plutôt qu'un appel par facture. La validité
  // couvre la consultation de la page, pas plus — un lien recopié ailleurs
  // donnerait accès aux coordonnées et aux montants d'un client.
  const chemins = (factures ?? [])
    .map((f) => f.pdf_chemin)
    .filter((c): c is string => Boolean(c));

  const liensSignes = new Map<string, string>();
  if (chemins.length) {
    const { data: signes } = await supabase.storage
      .from("factures")
      .createSignedUrls(chemins, 300);
    signes?.forEach((s) => {
      if (s.path && s.signedUrl) liensSignes.set(s.path, s.signedUrl);
    });
  }

  return (
    <div className="space-y-8">
      <ScrollReveal variant="fade-up">
        <h1 className="text-3xl font-bold tracking-tight text-phoebe-anthracite">
          Facturation
        </h1>
        <p className="mt-1 text-sm text-phoebe-anthracite/70">
          Une facture est émise automatiquement à chaque paiement encaissé, tous
          modules confondus.
        </p>
      </ScrollReveal>

      <ScrollReveal variant="fade-up" delay={0.1}>
        <ParametresFacturationForm
          initial={{
            taux_tva: params?.taux_tva ?? 18,
            prefixe_facture: params?.prefixe_facture ?? "FAC",
            numero_suivant: params?.numero_suivant ?? 1,
            email_cc: params?.email_cc ?? "",
          }}
        />
      </ScrollReveal>

      <ScrollReveal variant="fade-up" delay={0.15}>
        <div className="rounded-xl border border-phoebe-pearl bg-white">
          <div className="flex items-center justify-between border-b border-phoebe-pearl px-6 py-4">
            <h2 className="text-sm font-semibold text-phoebe-anthracite">
              Factures émises
            </h2>
            <span className="text-xs text-phoebe-anthracite/60">
              {count ?? 0} facture{(count ?? 0) > 1 ? "s" : ""}
            </span>
          </div>

          {!factures?.length ? (
            <p className="px-6 py-10 text-center text-sm text-phoebe-anthracite/60">
              Aucune facture émise pour l&apos;instant.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-phoebe-pearl text-left text-xs uppercase tracking-wide text-phoebe-anthracite/60">
                    <th className="px-6 py-3 font-medium">Numéro</th>
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 font-medium">Client</th>
                    <th className="px-6 py-3 font-medium">Module</th>
                    <th className="px-6 py-3 text-right font-medium">HT</th>
                    <th className="px-6 py-3 text-right font-medium">TVA</th>
                    <th className="px-6 py-3 text-right font-medium">TTC</th>
                    <th className="px-6 py-3 font-medium">PDF</th>
                  </tr>
                </thead>
                <tbody>
                  {factures.map((f) => (
                    <tr
                      key={f.id}
                      className="border-b border-phoebe-pearl/60 last:border-0"
                    >
                      <td className="px-6 py-3 font-medium text-phoebe-anthracite">
                        {f.numero}
                        {f.annulee && (
                          <span className="ml-2 rounded bg-error/10 px-1.5 py-0.5 text-[10px] text-error">
                            annulée
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-phoebe-anthracite/70">
                        {formatDate(f.created_at)}
                      </td>
                      <td className="px-6 py-3 text-phoebe-anthracite/70">
                        {f.users?.nom ?? "—"}
                      </td>
                      <td className="px-6 py-3 text-phoebe-anthracite/70">
                        {MODULE_LABELS[f.reference_table] ?? f.reference_table}
                      </td>
                      <td className="px-6 py-3 text-right tabular-nums text-phoebe-anthracite/70">
                        {formatMontant(f.montant_ht)}
                      </td>
                      <td className="px-6 py-3 text-right tabular-nums text-phoebe-anthracite/70">
                        {f.taux_tva}&nbsp;%
                      </td>
                      <td className="px-6 py-3 text-right tabular-nums font-medium text-phoebe-anthracite">
                        {formatMontant(f.montant_ttc)}
                      </td>
                      <td className="px-6 py-3">
                        {f.pdf_chemin && liensSignes.get(f.pdf_chemin) ? (
                          <a
                            href={liensSignes.get(f.pdf_chemin)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-phoebe-green hover:underline"
                          >
                            Ouvrir
                          </a>
                        ) : (
                          <span className="text-phoebe-anthracite/40">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-phoebe-pearl px-6 py-3 text-sm">
              <span className="text-phoebe-anthracite/60">
                Page {page} sur {totalPages}
              </span>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link
                    href={`/admin/factures?page=${page - 1}`}
                    className="rounded-lg border border-phoebe-pearl px-3 py-1.5 text-phoebe-anthracite hover:bg-phoebe-pearl/40"
                  >
                    Précédent
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={`/admin/factures?page=${page + 1}`}
                    className="rounded-lg border border-phoebe-pearl px-3 py-1.5 text-phoebe-anthracite hover:bg-phoebe-pearl/40"
                  >
                    Suivant
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </ScrollReveal>
    </div>
  );
}
