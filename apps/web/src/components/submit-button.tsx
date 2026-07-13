"use client";

import { useFormStatus } from "react-dom";

const VARIANTS = {
  default:
    "w-full rounded-lg bg-phoebe-green px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-phoebe-green-deep disabled:opacity-50",
  danger:
    "rounded-lg border border-error px-4 py-2 text-sm text-error transition-colors hover:bg-error hover:text-white disabled:opacity-50",
};

export function SubmitButton({
  children,
  className,
  variant = "default",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: keyof typeof VARIANTS;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={className ?? VARIANTS[variant]}
    >
      {pending ? "Chargement…" : children}
    </button>
  );
}
