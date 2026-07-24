"use client"

import { useRouter } from "next/navigation"

const ACTION_LABELS: Record<string, string> = {
  accepter: "Acceptation",
  refuser: "Refus",
  annuler: "Annulation",
  modifier: "Modification",
  creer: "Création",
  rembourser: "Remboursement",
  verifier: "Vérification",
  auto_accepter: "Auto-acceptation",
  auto_approuver: "Auto-approbation",
}

type Filters = {
  table?: string
  action?: string
  user?: string
  dateFrom?: string
  dateTo?: string
}

function buildQuery(params: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value) searchParams.set(key, value)
  })
  return searchParams.toString()
}

const inputClass =
  "rounded-lg border border-phoebe-pearl px-3 py-1.5 text-sm text-phoebe-anthracite focus:border-phoebe-green focus:outline-none focus:ring-1 focus:ring-phoebe-green"

export function AuditFilters({
  filters,
  allActions,
  allUsers,
}: {
  filters: Filters
  allActions: string[]
  allUsers: { id: string; name: string }[]
}) {
  const router = useRouter()

  const apply = (patch: Partial<Filters>) => {
    router.push(`/admin/audit?${buildQuery({ ...filters, ...patch })}`)
  }

  return (
    <div className="flex flex-wrap gap-4 pt-2 border-t border-phoebe-pearl">
      <div className="flex items-center gap-2">
        <label className="text-xs text-phoebe-anthracite/60">Action :</label>
        <select
          value={filters.action || ""}
          onChange={(e) => apply({ action: e.target.value || undefined })}
          className={inputClass}
        >
          <option value="">Toutes</option>
          {allActions.map((a) => (
            <option key={a} value={a}>
              {ACTION_LABELS[a] ?? a}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs text-phoebe-anthracite/60">Utilisateur :</label>
        <select
          value={filters.user || ""}
          onChange={(e) => apply({ user: e.target.value || undefined })}
          className={inputClass}
        >
          <option value="">Tous</option>
          {allUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs text-phoebe-anthracite/60">Du :</label>
        <input
          type="date"
          value={filters.dateFrom || ""}
          onChange={(e) => apply({ dateFrom: e.target.value || undefined })}
          className={inputClass}
        />
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs text-phoebe-anthracite/60">Au :</label>
        <input
          type="date"
          value={filters.dateTo || ""}
          onChange={(e) => apply({ dateTo: e.target.value || undefined })}
          className={inputClass}
        />
      </div>

      {(filters.table || filters.action || filters.user || filters.dateFrom || filters.dateTo) && (
        <a
          href="/admin/audit"
          className="rounded-full border border-phoebe-pearl px-3 py-1.5 text-xs font-medium text-phoebe-anthracite/60 hover:bg-phoebe-green/10 hover:text-phoebe-green-deep"
        >
          Réinitialiser
        </a>
      )}
    </div>
  )
}
