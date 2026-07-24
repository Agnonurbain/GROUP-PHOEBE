import Link from "next/link";

function parsePeriode(raw: string | null): { debut: string; fin: string } {
  if (!raw) return { debut: "—", fin: "—" };
  const cleaned = raw.replace(/[\[\]()]/g, "");
  const [debut, fin] = cleaned.split(",");
  return {
    debut: new Date(debut.trim()).toLocaleDateString("fr-FR"),
    fin: new Date(fin.trim()).toLocaleDateString("fr-FR"),
  };
}

export function MaintenanceSection({
  vehiculeId,
  maintenances,
}: {
  vehiculeId: string;
  maintenances: { id: string; periode: string | null }[];
}) {
  return (
    <section className="rounded-2xl border border-phoebe-pearl bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold tracking-tight text-phoebe-anthracite">
          Historique des maintenances
        </h2>
        <Link
          href={`/admin/vehicules/${vehiculeId}/disponibilites`}
          className="rounded-lg bg-phoebe-gold/10 px-3 py-1.5 text-xs font-semibold text-phoebe-gold-dark hover:bg-phoebe-gold/20 transition-colors"
        >
          Planifier une maintenance
        </Link>
      </div>

      {maintenances.length === 0 ? (
        <p className="text-sm text-phoebe-anthracite/70">
          Aucune maintenance enregistrée.
        </p>
      ) : (
        <div className="space-y-2">
          {maintenances.map((m) => {
            const { debut, fin } = parsePeriode(m.periode);
            return (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-lg border border-phoebe-pearl px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-phoebe-gold/10 px-2.5 py-0.5 text-xs font-medium text-phoebe-gold-dark">
                    Maintenance
                  </span>
                  <span className="text-sm text-phoebe-anthracite">
                    {debut} → {fin}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
