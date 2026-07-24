"use client";

import { useEffect, useState } from "react";

export function NegotiationTimer({
  updatedAt,
  delaiMinutes,
}: {
  updatedAt: string;
  delaiMinutes: number;
}) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    function update() {
      const elapsed = (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60);
      const left = Math.max(0, delaiMinutes - elapsed);
      if (left <= 0) {
        setRemaining("Expirée");
        return;
      }
      const m = Math.floor(left);
      const s = Math.floor((left - m) * 60);
      setRemaining(`${m}m ${s}s`);
    }

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [updatedAt, delaiMinutes]);

  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
      remaining === "Expirée"
        ? "bg-error/10 text-error"
        : "bg-phoebe-gold/20 text-phoebe-gold-dark"
    }`}>
      {remaining === "Expirée" ? "Expirée" : `${remaining} restant`}
    </span>
  );
}
