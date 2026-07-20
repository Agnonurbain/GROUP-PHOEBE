"use client";

import { useState } from "react";

export function StickyCta({
  prix,
  label,
  onAction,
}: {
  prix: number | null;
  label: string;
  onAction: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
    onAction();
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-phoebe-pearl bg-white/95 shadow-2xl backdrop-blur-md md:hidden">
      <div className="flex items-center gap-4 px-4 py-3">
        {prix && (
          <div className="shrink-0">
            <p className="text-xs text-phoebe-anthracite/50">{label}</p>
            <p className="text-lg font-bold text-phoebe-green-deep">
              {prix.toLocaleString("fr-FR")} FCFA
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={handleClick}
          disabled={loading}
          className="flex-1 rounded-xl bg-phoebe-green py-3.5 text-center text-sm font-bold text-white shadow-lg shadow-phoebe-green/25 transition-all hover:bg-phoebe-green-deep active:scale-[0.98] disabled:opacity-70"
        >
          {loading ? "⏳ Chargement..." : "Je réserve ce véhicule"}
        </button>
      </div>
    </div>
  );
}
