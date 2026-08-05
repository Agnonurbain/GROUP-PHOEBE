"use client";

import { useState } from "react";
import Link from "next/link";
import { marquerNotificationLue, marquerToutesLues, type NotifAdmin } from "@/app/actions/notifications-admin";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useT } from "@/lib/langue-context"

type Props = {
  initialNonLues: number;
  initialRecentes: NotifAdmin[];
};

// POC shadcn/ui : le panneau de notifications, jusqu'ici un dropdown fait main
// (etat open manuel, listener mousedown pour le clic exterieur, aucune gestion
// clavier), utilise desormais la primitive DropdownMenu. Elle apporte
// gratuitement : ouverture/fermeture, clic exterieur, touche Echap, navigation
// aux fleches, gestion et restauration du focus.
export function NotificationsDropdown({ initialNonLues, initialRecentes }: Props) {
  const t = useT()
  const [nonLues, setNonLues] = useState(initialNonLues);
  const [recentes, setRecentes] = useState(initialRecentes);

  async function handleClickNotification(n: NotifAdmin) {
    if (!n.lue) {
      await marquerNotificationLue(n.id);
      setNonLues((p) => Math.max(0, p - 1));
      setRecentes((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, lue: true } : x))
      );
    }
  }

  async function handleToutLire() {
    await marquerToutesLues();
    setNonLues(0);
    setRecentes((prev) => prev.map((n) => ({ ...n, lue: true })));
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-xl text-phoebe-anthracite/70 outline-none transition-colors hover:bg-phoebe-pearl hover:text-phoebe-anthracite"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {nonLues > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold leading-none text-white shadow-sm">
            {nonLues > 9 ? "9+" : nonLues}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm font-semibold text-phoebe-anthracite">Notifications</span>
          {nonLues > 0 && (
            <button onClick={handleToutLire} className="text-xs text-phoebe-green hover:underline">
              {t.divers.toutMarquerLu}
            </button>
          )}
        </div>

        <DropdownMenuSeparator className="my-0" />

        <div className="max-h-80 overflow-y-auto py-1">
          {recentes.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-phoebe-anthracite/70">Aucune notification</p>
          ) : (
            recentes.map((n) => {
              const inner = (
                <>
                  <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${!n.lue ? "bg-phoebe-green" : "bg-transparent"}`} />
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-sm ${!n.lue ? "font-medium text-phoebe-anthracite" : "text-phoebe-anthracite/70"}`}>
                      {n.titre}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-phoebe-anthracite/70">{n.message}</span>
                    <span className="mt-0.5 block text-[10px] text-phoebe-anthracite/70">{formatRelativeTime(n.created_at)}</span>
                  </span>
                </>
              );

              return (
                <DropdownMenuItem
                  key={n.id}
                  onClick={() => handleClickNotification(n)}
                  className={`flex cursor-pointer items-start gap-3 rounded-none px-4 py-3 ${!n.lue ? "bg-phoebe-green/5" : ""}`}
                  {...(n.lien ? { render: <Link href={n.lien} /> } : {})}
                >
                  {inner}
                </DropdownMenuItem>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Il y a ${days}j`;
  return new Date(iso).toLocaleDateString("fr-FR");
}
