import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server";
import { ScrollReveal } from "@/components/effects";
import { AuditFilters } from "./audit-filters";

export const metadata: Metadata = {
  title: "Audit — Administration",
  description: "Consultez l'historique des actions et modifications sur la plateforme GROUP PHOEBE.",
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  accepter: { label: "Acceptation", color: "bg-phoebe-green/10 text-phoebe-green-deep" },
  refuser: { label: "Refus", color: "bg-error/10 text-error" },
  annuler: { label: "Annulation", color: "bg-phoebe-anthracite/10 text-phoebe-anthracite" },
  modifier: { label: "Modification", color: "bg-blue-50 text-blue-700" },
  creer: { label: "Création", color: "bg-phoebe-gold/10 text-phoebe-gold-dark" },
  rembourser: { label: "Remboursement", color: "bg-purple-50 text-purple-700" },
  verifier: { label: "Vérification", color: "bg-phoebe-green/10 text-phoebe-green-deep" },
  auto_accepter: { label: "Auto-acceptation", color: "bg-phoebe-green/10 text-phoebe-green-deep" },
  auto_approuver: { label: "Auto-approbation", color: "bg-phoebe-gold/10 text-phoebe-gold-dark" },
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
  searchParams: Promise<{ page?: string; table?: string; action?: string; user?: string; dateFrom?: string; dateTo?: string }>;
}) {
  const { page: rawPage, table: filterTable, action: filterAction, user: filterUser, dateFrom, dateTo } = await searchParams;
  const page = Math.max(1, Number(rawPage) || 1);
  const pageSize = 30;
  const from = (page - 1) * pageSize;

  const supabase = await createClient();

  let query = supabase
    .from("audit_log" as never)
    .select("*, users:user_id(nom, role)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (filterTable) {
    query = query.eq("cible_table", filterTable);
  }
  if (filterAction) {
    query = query.eq("action", filterAction);
  }
  if (filterUser) {
    query = query.eq("user_id", filterUser);
  }
  if (dateFrom) {
    query = query.gte("created_at", dateFrom);
  }
  if (dateTo) {
    query = query.lte("created_at", dateTo);
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

  // Get unique actions from logs for action filter dropdown
  const allActions = [...new Set(logs?.map(l => l.action).filter(Boolean) ?? [])];

  // Get unique users for user filter dropdown
  const userMap = new Map<string, string>();
  logs?.forEach((l) => {
    if (l.user_id && l.users?.nom) {
      userMap.set(l.user_id, l.users.nom);
    }
  });
  const allUsers = Array.from(userMap.entries()).map(([id, name]) => ({ id, name }));

  const buildQuery = (params: Record<string, string | undefined>) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.set(key, value);
    });
    return searchParams.toString();
  };

  const currentQuery = { table: filterTable, action: filterAction, user: filterUser, dateFrom, dateTo };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-phoebe-anthracite">
        Journal d&apos;audit
      </h1>

      <div className="rounded-xl border border-phoebe-pearl bg-white p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-wrap gap-2">
            <FilterChip href="/admin/audit" active={!filterTable && !filterAction && !filterUser && !dateFrom && !dateTo} label="Tout" />
            {tables.map((t) => (
              <FilterChip
                key={t}
                href={`/admin/audit?${buildQuery({ ...currentQuery, table: t })}`}
                active={filterTable === t}
                label={t.replace(/_/g, " ")}
              />
            ))}
          </div>
        </div>

        <AuditFilters filters={currentQuery} allActions={allActions} allUsers={allUsers} />
      </div>

      {!logs || logs.length === 0 ? (
        <p className="text-sm text-phoebe-anthracite/70">
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
                    <span className="rounded-full bg-phoebe-pearl px-2.5 py-0.5 text-[11px] font-medium text-phoebe-anthracite/70">
                      {log.cible_table}
                    </span>
                    <span className="ml-auto text-[11px] text-phoebe-anthracite/70">
                      {formatDate(log.created_at)}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-baseline gap-x-3 text-xs text-phoebe-anthracite/70">
                    {user && (
                      <span>
                        par <span className="font-medium text-phoebe-anthracite">{user.nom}</span>
                        <span className="ml-1 text-[10px] text-phoebe-anthracite/70">({user.role})</span>
                      </span>
                    )}
                    {log.cible_id && (
                      <span className="font-mono text-[10px] text-phoebe-anthracite/70">
                        {log.cible_id.slice(0, 8)}…
                      </span>
                    )}
                  </div>

                  {(log.details || log.old_values || log.new_values) && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-[11px] font-medium text-phoebe-green hover:underline">
                        Détails
                      </summary>
                      <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
                        {log.details?.old && (
                          <div className="overflow-x-auto rounded-lg bg-error/5 p-2">
                            <p className="mb-1 text-[10px] font-semibold text-error">Avant</p>
                            <pre className="text-[10px] text-phoebe-anthracite/70 whitespace-pre-wrap">
                              {JSON.stringify(log.details.old as Record<string, unknown>, null, 2)}
                            </pre>
                          </div>
                        )}
                        {log.details?.new && (
                          <div className="overflow-x-auto rounded-lg bg-phoebe-green/5 p-2">
                            <p className="mb-1 text-[10px] font-semibold text-phoebe-green-deep">Après</p>
                            <pre className="text-[10px] text-phoebe-anthracite/70 whitespace-pre-wrap">
                              {JSON.stringify(log.details.new as Record<string, unknown>, null, 2)}
                            </pre>
                          </div>
                        )}
                        {log.old_values && (
                          <div className="overflow-x-auto rounded-lg bg-error/5 p-2">
                            <p className="mb-1 text-[10px] font-semibold text-error">Avant (legacy)</p>
                            <pre className="text-[10px] text-phoebe-anthracite/70 whitespace-pre-wrap">
                              {JSON.stringify(log.old_values, null, 2)}
                            </pre>
                          </div>
                        )}
                        {log.new_values && (
                          <div className="overflow-x-auto rounded-lg bg-phoebe-green/5 p-2">
                            <p className="mb-1 text-[10px] font-semibold text-phoebe-green-deep">Après (legacy)</p>
                            <pre className="text-[10px] text-phoebe-anthracite/70 whitespace-pre-wrap">
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
              href={`/admin/audit?${buildQuery({ ...currentQuery, page: String(page - 1) })}`}
              label="← Précédent"
            />
          )}
          <span className="text-xs text-phoebe-anthracite/70">
            Page {page} / {totalPages}
          </span>
          {page < totalPages && (
            <PaginationLink
              href={`/admin/audit?${buildQuery({ ...currentQuery, page: String(page + 1) })}`}
              label="Suivant →"
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
  cible_table: string | null;
  cible_id: string | null;
  details: { old?: Record<string, unknown>; new?: Record<string, unknown>; ip?: string } | null;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
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
          : "bg-phoebe-pearl text-phoebe-anthracite/70 hover:bg-phoebe-green/10 hover:text-phoebe-green-deep"
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
    >
      {label}
    </a>
  );
}
