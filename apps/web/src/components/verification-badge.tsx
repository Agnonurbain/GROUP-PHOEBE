import type { StatutVerification } from "@/lib/auth";

const config: Record<
  StatutVerification,
  { label: string; className: string }
> = {
  non_verifie: {
    label: "Non vérifié",
    className: "bg-gray-100 text-gray-700",
  },
  documents_soumis: {
    label: "En attente de vérification",
    className: "bg-phoebe-gold/20 text-phoebe-gold",
  },
  verifie: {
    label: "Vérifié",
    className: "bg-phoebe-green/20 text-phoebe-green-deep",
  },
  rejete: {
    label: "Rejeté",
    className: "bg-error/20 text-error",
  },
};

export function VerificationBadge({
  statut,
}: {
  statut: StatutVerification;
}) {
  const { label, className } = config[statut];
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${className}`}
    >
      {label}
    </span>
  );
}
