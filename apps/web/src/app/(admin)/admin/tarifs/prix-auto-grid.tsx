"use client";

type Zone = { id: string; nom: string; coefficient_majoration: number };
type PrixRange = { categorie: string; catLabel: string; min: number; max: number; count: number };

export function PrixAutoGrid({
  zones,
  prixParCategorie,
}: {
  zones: Zone[];
  prixParCategorie: PrixRange[];
}) {
  const baseZone = zones.find((z) => z.coefficient_majoration === 1) ?? zones[0];
  const otherZones = zones.filter((z) => z.id !== baseZone?.id);

  if (prixParCategorie.length === 0) {
    return (
      <div className="rounded-xl bg-phoebe-pearl/30 p-6 text-center">
        <p className="text-sm text-phoebe-anthracite/70">
          Aucun véhicule avec un prix journalier défini.
        </p>
        <p className="mt-1 text-xs text-phoebe-anthracite/70">
          Ajoutez des véhicules avec un prix de base pour voir les tarifs calculés automatiquement.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3">
        <p className="text-xs text-blue-700">
          Les prix par zone sont calculés automatiquement en appliquant les coefficients
          au prix de base des véhicules. Modifiez le prix directement sur la fiche véhicule.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-phoebe-pearl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-phoebe-pearl bg-phoebe-pearl/30">
              <th className="px-4 py-3 text-left font-semibold text-phoebe-anthracite">
                Catégorie
              </th>
              <th className="px-4 py-3 text-center font-semibold text-phoebe-anthracite">
                Nb véhicules
              </th>
              {baseZone && (
                <th className="px-4 py-3 text-right font-semibold text-phoebe-green-deep">
                  {baseZone.nom}
                  <span className="ml-1 text-[10px] font-normal text-phoebe-anthracite/70">
                    (base)
                  </span>
                </th>
              )}
              {otherZones.map((z) => (
                <th key={z.id} className="px-4 py-3 text-right font-medium text-phoebe-anthracite/70">
                  {z.nom}
                  <span className="ml-1 text-[10px] font-normal text-phoebe-anthracite/70">
                    x{z.coefficient_majoration}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {prixParCategorie.map((pc) => (
              <tr key={pc.categorie} className="border-b border-phoebe-pearl/50 last:border-0">
                <td className="px-4 py-3 font-medium text-phoebe-anthracite">
                  {pc.catLabel}
                </td>
                <td className="px-4 py-3 text-center text-phoebe-anthracite/70">
                  {pc.count}
                </td>
                {baseZone && (
                  <td className="px-4 py-3 text-right font-semibold text-phoebe-green-deep tabular-nums">
                    {formatRange(pc.min, pc.max)}
                  </td>
                )}
                {otherZones.map((z) => (
                  <td key={z.id} className="px-4 py-3 text-right text-phoebe-anthracite/70 tabular-nums">
                    {formatRange(
                      Math.round(pc.min * z.coefficient_majoration),
                      Math.round(pc.max * z.coefficient_majoration)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-amber-100 bg-amber-50/50 px-4 py-3">
        <p className="text-xs font-medium text-amber-800">
          Modification des tarifs
        </p>
        <p className="mt-0.5 text-xs text-amber-700">
          Les reservations deja confirmees ne sont pas affectees.
          La nouvelle tarification s&apos;applique aux nouvelles reservations a partir de maintenant.
        </p>
      </div>
    </div>
  );
}

function formatRange(min: number, max: number) {
  const fmtMin = min.toLocaleString("fr-FR");
  const fmtMax = max.toLocaleString("fr-FR");
  if (min === max) return `${fmtMin} FCFA/j`;
  return `${fmtMin} — ${fmtMax} FCFA/j`;
}
