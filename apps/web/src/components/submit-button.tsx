"use client";

import { useFormStatus } from "react-dom";

const VARIANTS = {
  default:
    "w-full rounded-lg bg-phoebe-green px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-phoebe-green-deep disabled:opacity-50",
  danger:
    "rounded-lg border border-error px-4 py-2 text-sm text-error transition-colors hover:bg-error hover:text-white disabled:opacity-50",
};

function Spinner() {
  return (
    <svg
      className="inline-block h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.25"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

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
      {pending ? (
        <span className="inline-flex items-center gap-2">
          <Spinner />
          Chargement…
        </span>
      ) : (
        children
      )}
    </button>
  );
}
