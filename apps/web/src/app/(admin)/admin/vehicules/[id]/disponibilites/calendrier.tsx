"use client";

import { useState, useMemo, useCallback } from "react";

export type EvenementCalendrier = {
  id: string;
  debut: string;
  fin: string;
  type: "reservation" | "maintenance" | "bloque";
  titre: string;
};

type Props = {
  evenements: EvenementCalendrier[];
};

const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const TYPE_BORDER: Record<string, string> = {
  reservation: "border-l-blue-500 bg-blue-50/80",
  maintenance: "border-l-amber-500 bg-amber-50/80",
  bloque: "border-l-gray-400 bg-gray-50/80",
};

export function CalendrierMensuel({ evenements }: Props) {
  const today = new Date();
  const [annee, setAnnee] = useState(today.getFullYear());
  const [mois, setMois] = useState(today.getMonth());

  const joursGrid = useMemo(() => {
    const firstDay = new Date(annee, mois, 1);
    const lastDay = new Date(annee, mois + 1, 0);
    const startPad = (firstDay.getDay() + 6) % 7;

    const days: (number | null)[] = [];
    for (let i = 0; i < startPad; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);
    return days;
  }, [annee, mois]);

  const eventsByDay = useMemo(() => {
    const map = new Map<number, EvenementCalendrier[]>();
    for (const evt of evenements) {
      const debut = new Date(evt.debut);
      const fin = new Date(evt.fin);
      const monthStart = new Date(annee, mois, 1);
      const monthEnd = new Date(annee, mois + 1, 0, 23, 59, 59);

      const evStart = debut < monthStart ? monthStart : debut;
      const evEnd = fin > monthEnd ? monthEnd : fin;

      for (let d = new Date(evStart); d <= evEnd; d.setDate(d.getDate() + 1)) {
        const day = d.getDate();
        if (!map.has(day)) map.set(day, []);
        const arr = map.get(day)!;
        if (!arr.find((e) => e.id === evt.id)) arr.push(evt);
      }
    }
    return map;
  }, [evenements, annee, mois]);

  const prevMonth = useCallback(() => {
    if (mois === 0) { setAnnee((a) => a - 1); setMois(11); }
    else setMois((m) => m - 1);
  }, [mois]);

  const nextMonth = useCallback(() => {
    if (mois === 11) { setAnnee((a) => a + 1); setMois(0); }
    else setMois((m) => m + 1);
  }, [mois]);

  const todayStr = today.toDateString();

  return (
    <div className="rounded-xl border border-phoebe-pearl bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="rounded-lg px-3 py-1.5 text-sm text-phoebe-anthracite/60 transition-colors hover:bg-phoebe-pearl hover:text-phoebe-anthracite"
        >
          ←
        </button>
        <h3 className="text-base font-semibold text-phoebe-anthracite">
          {MOIS[mois]} {annee}
        </h3>
        <button
          onClick={nextMonth}
          className="rounded-lg px-3 py-1.5 text-sm text-phoebe-anthracite/60 transition-colors hover:bg-phoebe-pearl hover:text-phoebe-anthracite"
        >
          →
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 text-center text-xs font-medium text-phoebe-anthracite/40">
        {JOURS.map((j) => (
          <div key={j} className="py-1">{j}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 text-sm">
        {joursGrid.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} />;

          const dateStr = new Date(annee, mois, day).toDateString();
          const isToday = dateStr === todayStr;
          const dayEvents = eventsByDay.get(day) ?? [];

          return (
            <div
              key={day}
              className="min-h-[80px] border-b border-r border-phoebe-pearl/50 p-1 last:border-r-0"
            >
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                  isToday
                    ? "bg-phoebe-green text-white font-semibold"
                    : "text-phoebe-anthracite"
                }`}
              >
                {day}
              </span>
              <div className="mt-0.5 space-y-0.5">
                {dayEvents.slice(0, 3).map((evt) => (
                  <div
                    key={evt.id}
                    title={`${evt.titre} (${new Date(evt.debut).toLocaleDateString("fr-FR")} → ${new Date(evt.fin).toLocaleDateString("fr-FR")})`}
                    className={`truncate rounded border-l-2 px-1 text-[10px] leading-5 ${TYPE_BORDER[evt.type] ?? TYPE_BORDER.bloque} text-phoebe-anthracite`}
                  >
                    {evt.titre}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-[10px] text-phoebe-anthracite/40">
                    +{dayEvents.length - 3}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
