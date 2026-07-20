"use client";

import { useFormStatus } from "react-dom";

const VARIANTS = {
  default:
    "relative w-full overflow-hidden rounded-xl bg-phoebe-green px-4 py-3.5 text-sm font-semibold text-white shadow-md shadow-phoebe-green/25 transition-all duration-200 hover:bg-phoebe-green-deep hover:shadow-lg hover:shadow-phoebe-green/30 active:scale-[0.98] disabled:opacity-50 disabled:hover:shadow-md before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:transition-transform before:duration-500 hover:before:translate-x-full",
  danger:
    "rounded-xl border border-error/30 px-4 py-2.5 text-sm font-medium text-error transition-all duration-200 hover:bg-error hover:text-white hover:shadow-md active:scale-[0.98] disabled:opacity-50",
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
  disabled,
}: {
  children: React.ReactNode;
  className?: string;
  variant?: keyof typeof VARIANTS;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
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
