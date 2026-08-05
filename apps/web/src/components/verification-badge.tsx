"use client";

import type { StatutVerification } from "@/lib/auth";
import { useT } from "@/lib/langue-context"


export function VerificationBadge({
  statut,
}: {
  statut: StatutVerification;
}) {
  const t = useT();

  // Dans le composant : une table de constantes au niveau du module fige les
  // libellés dans la langue du chargement.
  const config: Record<StatutVerification, { label: string; className: string }> = {
    non_verifie: {
      label: t.divers.nonVerifie,
      className: "bg-phoebe-anthracite/10 text-phoebe-anthracite/70",
    },
    documents_soumis: {
      label: t.divers.enAttenteVerification,
      className: "bg-phoebe-gold/20 text-phoebe-gold-dark",
    },
    verifie: {
      label: t.divers.verifie,
      className: "bg-phoebe-green/20 text-phoebe-green-deep",
    },
    rejete: {
      label: t.divers.rejete,
      className: "bg-error/20 text-error",
    },
  };

  const { label, className } = config[statut];
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${className}`}
    >
      {label}
    </span>
  );
}
