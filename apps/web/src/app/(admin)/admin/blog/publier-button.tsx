"use client";

import { useTransition } from "react";
import { publierArticle } from "@/app/actions/blog";

export function PublierButton({
  articleId,
  publie,
}: {
  articleId: string;
  publie: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await publierArticle(articleId, !publie);
        });
      }}
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all disabled:opacity-50 ${
        publie
          ? "bg-phoebe-green/10 text-phoebe-green-deep hover:bg-phoebe-green/20"
          : "bg-phoebe-anthracite/10 text-phoebe-anthracite/70 hover:bg-phoebe-anthracite/20"
      }`}
    >
      {pending ? "…" : publie ? "Publié" : "Brouillon"}
    </button>
  );
}
