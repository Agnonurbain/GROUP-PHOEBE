"use client";

import { useState, type ReactNode } from "react";

const TABS = [
  { key: "coefficients", label: "Coefficients & Caution" },
  { key: "cartographie", label: "Cartographie" },
  { key: "prix", label: "Prix & Communes" },
] as const;

export type TabKey = (typeof TABS)[number]["key"];

export function TarifsTabs({
  children,
}: {
  children: Record<TabKey, ReactNode>;
}) {
  const [active, setActive] = useState<TabKey>("coefficients");

  return (
    <div className="space-y-6">
      <div className="flex gap-1 rounded-xl bg-phoebe-pearl/60 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              active === tab.key
                ? "bg-white text-phoebe-anthracite shadow-sm"
                : "text-phoebe-anthracite/50 hover:text-phoebe-anthracite/70"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {children[active]}
    </div>
  );
}
