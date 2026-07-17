"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({
  href,
  children,
  badge,
  badgeColor = "bg-phoebe-gold",
  exact = false,
}: {
  href: string;
  children: React.ReactNode;
  badge?: number | null;
  badgeColor?: string;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const isActive = exact
    ? pathname === href
    : pathname === href || (href !== "/admin" && pathname.startsWith(href + "/"));

  return (
    <Link
      href={href}
      className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
        isActive
          ? "bg-phoebe-green/10 font-semibold text-phoebe-green"
          : "text-phoebe-anthracite/70 hover:bg-phoebe-pearl hover:text-phoebe-green"
      }`}
    >
      {children}
      {!!badge && badge > 0 && (
        <span className={`rounded-full ${badgeColor} px-2 py-0.5 text-xs font-bold text-white`}>
          {badge}
        </span>
      )}
    </Link>
  );
}
