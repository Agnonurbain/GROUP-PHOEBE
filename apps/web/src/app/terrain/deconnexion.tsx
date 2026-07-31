import { LogoutButton } from "@/components/logout-button";

export function DeconnexionTerrain() {
  return (
    <LogoutButton
      label="Quitter"
      className="shrink-0 rounded-lg border border-public-border px-3 py-1.5 text-xs font-semibold text-public-text-muted transition-colors hover:text-public-text"
    />
  );
}
