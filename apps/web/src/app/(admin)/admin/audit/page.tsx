import { createClient } from "@/lib/supabase/server";
import { ScrollReveal } from "@/components/effects";

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  accepter: { label: "Acceptation", color: "bg-phoebe-green/10 text-phoebe-green-deep" },
  refuser: { label: "Refus", color: "bg-error/10 text-error" },
  annuler: { label: "Annulation", color: "bg-phoebe-anthracite/10 text-phoebe-anthracite" },
  modifier: { label: "Modification", color: "bg-blue-50 text-blue-700" },
  creer: { label: "Création", color: "bg-phoebe-gold/10 text-phoebe-gold" },
  rembourser: { label: "Remboursement", color: "bg-purple-50 text-purple-700" },
  verifier: { label: "Vérification", color: "bg-phoebe-green/10 text-phoebe-green-deep" },
  auto_accepter: { label: "Auto-acceptation", color: "bg-phoebe-green/10 text-phoebe-green-deep" },
  auto_approuver: { label: "Auto-approbation", color: "bg-phoebe-gold/10 text-phoebe-gold" },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; table?: string }>;
}) {
  const { page: rawPage, table: filterTable } = await searchParams;
  const page = Math.max(1, Number(rawPage) || 1);
  const pageSize = 30;
  const from = (page - 1) * pageSize;

  const supabase = await createClient();

  let query = supabase
    .from("audit_logs" as never)
    .select("*, users:user_id(nom, role)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (filterTable) {
    query = query.eq("table_name", filterTable);
  }

  const { data: logs, count } = await query as { data: AuditRow[] | null; count: number | null };

  const totalPages = Math.ceil((count ?? 0) / pageSize);

  const tables = [
    "demandes_transport",
    "vehicules",
    "paiements",
    "propositions_prix",
    "users",
    "lignes_demande",
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-phoebe-anthracite">
        Journal d&apos;audit
      </h1>

      <div className="flex flex-wrap gap-2">
        <FilterChip href="/admin/audit" active={!filterTable} label="Tout" />
        {tables.map((t) => (
          <FilterChip
            key={t}
            href={`/admin/audit?table=${t}`}
            active={filterTable === t}
            label={t.replace(/_/g, " ")}
          />
        ))}
      </div>

      {!logs || logs.length === 0 ? (
        <p className="text-sm text-phoebe-anthracite/50">
          Aucune entrée d&apos;audit.
        </p>
      ) : (
        <div className="space-y-3">
          {logs.map((log, idx) => {
            const a = ACTION_LABELS[log.action] ?? {
              label: log.action,
              color: "bg-phoebe-pearl text-phoebe-anthracite",
            };
            const user = log.users as { nom: string; role: string } | null;
            return (
              <ScrollReveal key={log.id} variant="fade-up" delay={Math.min(idx * 0.03, 0.3)}>
                <div className="rounded-xl border border-phoebe-pearl bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${a.color}`}>
                      {a.label}
                    </span>
                    <span className="rounded-full bg-phoebe-pearl px-2.5 py-0.5 text-[11px] font-medium text-phoebe-anthracite/60">
                      {log.table_name}
                    </span>
                    <span className="ml-auto text-[11px] text-phoebe-anthracite/40">
                      {formatDate(log.created_at)}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-baseline gap-x-3 text-xs text-phoebe-anthracite/60">
                    {user && (
                      <span>
                        par <span className="font-medium text-phoebe-anthracite">{user.nom}</span>
                        <span className="ml-1 text-[10px] text-phoebe-anthracite/40">({user.role})</span>
                      </span>
                    )}
                    {log.record_id && (
                      <span className="font-mono text-[10px] text-phoebe-anthracite/30">
                        {log.record_id.slice(0, 8)}…
                      </span>
                    )}
                  </div>

                  {(log.old_values || log.new_values) && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-[11px] font-medium text-phoebe-green hover:underline">
                        Détails
                      </summary>
                      <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
                        {log.old_values && (
                          <div className="overflow-x-auto rounded-lg bg-error/5 p-2">
                            <p className="mb-1 text-[10px] font-semibold text-error">Avant</p>
                            <pre className="text-[10px] text-phoebe-anthracite/60 whitespace-pre-wrap">
                              {JSON.stringify(log.old_values, null, 2)}
                            </pre>
                          </div>
                        )}
                        {log.new_values && (
                          <div className="overflow-x-auto rounded-lg bg-phoebe-green/5 p-2">
                            <p className="mb-1 text-[10px] font-semibold text-phoebe-green-deep">Après</p>
                            <pre className="text-[10px] text-phoebe-anthracite/60 whitespace-pre-wrap">
                              {JSON.stringify(log.new_values, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </details>
                  )}
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          {page > 1 && (
            <PaginationLink
              href={`/admin/audit?page=${page - 1}${filterTable ? `&table=${filterTable}` : ""}`}
              label="&larr; Précédent"
            />
          )}
          <span className="text-xs text-phoebe-anthracite/50">
            Page {page} / {totalPages}
          </span>
          {page < totalPages && (
            <PaginationLink
              href={`/admin/audit?page=${page + 1}${filterTable ? `&table=${filterTable}` : ""}`}
              label="Suivant &rarr;"
            />
          )}
        </div>
      )}
    </div>
  );
}

type AuditRow = {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  created_at: string;
  users: { nom: string; role: string } | null;
};

function FilterChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <a
      href={href}
      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "bg-phoebe-green text-white"
          : "bg-phoebe-pearl text-phoebe-anthracite/60 hover:bg-phoebe-green/10 hover:text-phoebe-green-deep"
      }`}
    >
      {label}
    </a>
  );
}

function PaginationLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="rounded-lg border border-phoebe-pearl bg-white px-3 py-1.5 text-xs font-medium text-phoebe-anthracite transition-colors hover:bg-phoebe-green/10"
      dangerouslySetInnerHTML={{ __html: label }}
    />
  );
}
