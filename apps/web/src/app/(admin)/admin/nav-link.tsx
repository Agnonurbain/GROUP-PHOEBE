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
      className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm transition-all duration-200 ${
        isActive
          ? "bg-phoebe-green/10 font-semibold text-phoebe-green-deep shadow-sm shadow-phoebe-green/8 border border-phoebe-green/15"
          : "text-phoebe-anthracite/70 hover:bg-phoebe-green/5 hover:text-phoebe-green-deep"
      }`}
    >
      {children}
      {!!badge && badge > 0 && (
        <span className={`rounded-full ${badgeColor} px-2 py-0.5 text-[10px] font-bold text-white shadow-sm`}>
          {badge}
        </span>
      )}
    </Link>
  );
}
