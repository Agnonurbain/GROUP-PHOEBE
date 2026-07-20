"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { marquerNotificationLue, marquerToutesLues, type NotifAdmin } from "@/app/actions/notifications-admin";

type Props = {
  initialNonLues: number;
  initialRecentes: NotifAdmin[];
};

export function NotificationsDropdown({ initialNonLues, initialRecentes }: Props) {
  const [open, setOpen] = useState(false);
  const [nonLues, setNonLues] = useState(initialNonLues);
  const [recentes, setRecentes] = useState(initialRecentes);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleClickNotification(n: NotifAdmin) {
    if (!n.lue) {
      await marquerNotificationLue(n.id);
      setNonLues((p) => Math.max(0, p - 1));
      setRecentes((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, lue: true } : x))
      );
    }
    setOpen(false);
  }

  async function handleToutLire() {
    await marquerToutesLues();
    setNonLues(0);
    setRecentes((prev) => prev.map((n) => ({ ...n, lue: true })));
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl text-phoebe-anthracite/60 transition-colors hover:bg-phoebe-pearl hover:text-phoebe-anthracite"
        aria-label="Notifications"
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
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 origin-top-right animate-fade-in rounded-xl border border-phoebe-pearl bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-phoebe-pearl px-4 py-3">
            <span className="text-sm font-semibold text-phoebe-anthracite">
              Notifications
            </span>
            {nonLues > 0 && (
              <button
                onClick={handleToutLire}
                className="text-xs text-phoebe-green hover:underline"
              >
                Tout marquer lu
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {recentes.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-phoebe-anthracite/40">
                Aucune notification
              </div>
            ) : (
              recentes.map((n) => {
                const content = (
                  <button
                    onClick={() => handleClickNotification(n)}
                    className={`flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-phoebe-pearl/50 ${
                      !n.lue ? "bg-phoebe-green/3" : ""
                    }`}
                  >
                    <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${!n.lue ? "bg-phoebe-green" : "bg-transparent"}`} />
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm ${!n.lue ? "font-medium text-phoebe-anthracite" : "text-phoebe-anthracite/60"}`}>
                        {n.titre}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-phoebe-anthracite/40">
                        {n.message}
                      </p>
                      <p className="mt-0.5 text-[10px] text-phoebe-anthracite/30">
                        {formatRelativeTime(n.created_at)}
                      </p>
                    </div>
                  </button>
                );

                return n.lien ? (
                  <Link key={n.id} href={n.lien} onClick={() => handleClickNotification(n)}>
                    {content}
                  </Link>
                ) : (
                  <div key={n.id}>{content}</div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
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
