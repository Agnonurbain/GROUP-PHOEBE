"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={
        className ??
        "w-full rounded-lg bg-phoebe-green px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-phoebe-green-deep disabled:opacity-50"
      }
    >
      {pending ? "Chargement…" : children}
    </button>
  );
}
