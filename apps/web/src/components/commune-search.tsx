"use client";

import { useState, useRef, useEffect, useCallback } from "react";

type CommuneOption = { id: string; nom: string; zoneNom: string };

export function CommuneSearch({
  id,
  name,
  value,
  onChange,
  communes,
  placeholder = "Rechercher une commune…",
  className = "",
}: {
  id?: string;
  name: string;
  value: string;
  onChange: (val: string) => void;
  communes: CommuneOption[];
  placeholder?: string;
  className?: string;
}) {
  const [localQuery, setLocalQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const displayValue = isSearching ? localQuery : value;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setIsSearching(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const normalized = localQuery.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  const filtered = localQuery.length > 0
    ? communes.filter((c) => {
        const n = c.nom.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
        return n.includes(normalized);
      })
    : communes;

  const grouped = new Map<string, CommuneOption[]>();
  for (const c of filtered) {
    const arr = grouped.get(c.zoneNom) ?? [];
    arr.push(c);
    grouped.set(c.zoneNom, arr);
  }

  const handleSelect = useCallback((nom: string) => {
    setLocalQuery(nom);
    setIsSearching(false);
    onChange(nom);
    setOpen(false);
  }, [onChange]);

  return (
    <div ref={ref} className="relative">
      <input type="hidden" name={name} value={value} />
      <input
        id={id}
        type="text"
        value={displayValue}
        onChange={(e) => {
          setLocalQuery(e.target.value);
          setIsSearching(true);
          setOpen(true);
          if (!e.target.value) onChange("");
        }}
        onFocus={() => {
          setIsSearching(true);
          setOpen(true);
        }}
        placeholder={placeholder}
        autoComplete="off"
        className={className}
      />

      {open && filtered.length > 0 && (
        <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-phoebe-pearl bg-white shadow-lg">
          {[...grouped.entries()].map(([zone, items]) => (
            <div key={zone}>
              <div className="sticky top-0 bg-phoebe-pearl/60 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-phoebe-anthracite/40">
                {zone}
              </div>
              {items.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelect(c.nom)}
                  className="w-full cursor-pointer px-3 py-2 text-left text-sm text-phoebe-anthracite transition-colors hover:bg-phoebe-green/10 hover:text-phoebe-green-deep"
                >
                  {c.nom}
                </button>
              ))}
            </div>
          ))}
          <button
            type="button"
            onClick={() => handleSelect("autre")}
            className="w-full border-t border-phoebe-pearl px-3 py-2 text-left text-sm text-phoebe-anthracite/50 transition-colors hover:bg-phoebe-pearl"
          >
            Autre commune…
          </button>
        </div>
      )}

      {open && filtered.length === 0 && localQuery.length > 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-xl border border-phoebe-pearl bg-white p-3 shadow-lg">
          <p className="text-xs text-phoebe-anthracite/50">Aucune commune trouvée.</p>
          <button
            type="button"
            onClick={() => handleSelect("autre")}
            className="mt-1 text-xs font-medium text-phoebe-green hover:underline"
          >
            Saisir manuellement
          </button>
        </div>
      )}
    </div>
  );
}
