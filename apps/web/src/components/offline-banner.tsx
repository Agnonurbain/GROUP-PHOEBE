"use client";

import { useState, useEffect } from "react";

export function OfflineBanner() {
  // Toujours false au rendu serveur : sur Node 24, `navigator` est defini
  // globalement mais `navigator.onLine` vaut undefined, donc `!navigator.onLine`
  // etait `true` et la banniere s'affichait cote serveur (barre parasite en haut
  // de page jusqu'a l'hydratation). L'etat reel est etabli au montage client.
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div role="status" className="w-full bg-[#DC2626] text-white text-center text-xs font-medium py-2 px-4">
      <span className="inline-flex items-center gap-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
          <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>
        Vous êtes hors ligne — les pages consultées restent accessibles
      </span>
    </div>
  );
}
