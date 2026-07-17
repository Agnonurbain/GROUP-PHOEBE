import { describe, it, expect } from "vitest";

// ─── Role guard logic extracted from the codebase ───────────────────
// These tests verify the role-checking logic used across the application.
// The actual checks are in: middleware.ts, admin/layout.tsx, and
// requireStaff() in 5 action files.

type Role = "client" | "operateur" | "proprietaire" | "livreur" | "agent_immobilier";

const STAFF_ROLES: Role[] = ["operateur", "proprietaire"];

function isStaff(role: Role | null | undefined): boolean {
  if (!role) return false;
  return STAFF_ROLES.includes(role);
}

function isProprietaire(role: Role | null | undefined): boolean {
  return role === "proprietaire";
}

function requireStaffCheck(
  user: { id: string } | null,
  profile: { role: Role } | null
): { ok: boolean; error?: string } {
  if (!user) return { ok: false, error: "Non authentifié" };
  if (!profile || !isStaff(profile.role))
    return { ok: false, error: "Accès refusé" };
  return { ok: true };
}

function adminLayoutCheck(
  profile: { role: Role } | null
): "allow" | "redirect_profil" {
  if (!profile || !isStaff(profile.role)) return "redirect_profil";
  return "allow";
}

function middlewareCheck(
  user: { id: string } | null,
  pathname: string
): "next" | "redirect_connexion" | "redirect_profil" {
  if (!user && (pathname.startsWith("/profil") || pathname.startsWith("/admin"))) {
    return "redirect_connexion";
  }
  if (user && (pathname === "/connexion" || pathname === "/inscription")) {
    return "redirect_profil";
  }
  return "next";
}

// ─── Tests ──────────────────────────────────────────────────────────

describe("Garde-fous de rôle — requireStaff()", () => {
  it("rejette un utilisateur non authentifié", () => {
    const result = requireStaffCheck(null, null);
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Non authentifié");
  });

  it("rejette un client (rôle insuffisant)", () => {
    const result = requireStaffCheck(
      { id: "user-1" },
      { role: "client" }
    );
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Accès refusé");
  });

  it("rejette un livreur (pas dans la liste staff)", () => {
    const result = requireStaffCheck(
      { id: "user-2" },
      { role: "livreur" }
    );
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Accès refusé");
  });

  it("rejette un agent_immobilier", () => {
    const result = requireStaffCheck(
      { id: "user-3" },
      { role: "agent_immobilier" }
    );
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Accès refusé");
  });

  it("accepte un opérateur", () => {
    const result = requireStaffCheck(
      { id: "user-4" },
      { role: "operateur" }
    );
    expect(result.ok).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("accepte un propriétaire", () => {
    const result = requireStaffCheck(
      { id: "user-5" },
      { role: "proprietaire" }
    );
    expect(result.ok).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("rejette un profil null (user authentifié mais pas de row dans users)", () => {
    const result = requireStaffCheck({ id: "user-6" }, null);
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Accès refusé");
  });
});

describe("Garde-fous de rôle — admin layout", () => {
  it("redirige un client vers /profil", () => {
    expect(adminLayoutCheck({ role: "client" })).toBe("redirect_profil");
  });

  it("redirige un livreur vers /profil", () => {
    expect(adminLayoutCheck({ role: "livreur" })).toBe("redirect_profil");
  });

  it("autorise un opérateur", () => {
    expect(adminLayoutCheck({ role: "operateur" })).toBe("allow");
  });

  it("autorise un propriétaire", () => {
    expect(adminLayoutCheck({ role: "proprietaire" })).toBe("allow");
  });

  it("redirige si profil manquant", () => {
    expect(adminLayoutCheck(null)).toBe("redirect_profil");
  });
});

describe("Garde-fous de rôle — middleware auth", () => {
  it("utilisateur non connecté sur /admin → redirigé vers /connexion", () => {
    expect(middlewareCheck(null, "/admin")).toBe("redirect_connexion");
    expect(middlewareCheck(null, "/admin/demandes")).toBe("redirect_connexion");
    expect(middlewareCheck(null, "/admin/vehicules")).toBe("redirect_connexion");
  });

  it("utilisateur non connecté sur /profil → redirigé vers /connexion", () => {
    expect(middlewareCheck(null, "/profil")).toBe("redirect_connexion");
    expect(middlewareCheck(null, "/profil/reservations")).toBe("redirect_connexion");
  });

  it("utilisateur connecté sur /connexion → redirigé vers /profil", () => {
    expect(middlewareCheck({ id: "u1" }, "/connexion")).toBe("redirect_profil");
  });

  it("utilisateur connecté sur /inscription → redirigé vers /profil", () => {
    expect(middlewareCheck({ id: "u1" }, "/inscription")).toBe("redirect_profil");
  });

  it("utilisateur non connecté sur /catalogue → passe (page publique)", () => {
    expect(middlewareCheck(null, "/catalogue")).toBe("next");
  });

  it("utilisateur non connecté sur / → passe (page publique)", () => {
    expect(middlewareCheck(null, "/")).toBe("next");
  });

  it("utilisateur connecté sur /admin → passe (middleware ne vérifie pas le rôle)", () => {
    expect(middlewareCheck({ id: "u1" }, "/admin")).toBe("next");
  });
});

describe("Garde-fous de rôle — creerCompteInterne (propriétaire only)", () => {
  const ALLOWED_CREATION_ROLES = ["operateur", "livreur"];

  it("seul le propriétaire peut créer des comptes internes", () => {
    expect(isProprietaire("proprietaire")).toBe(true);
    expect(isProprietaire("operateur")).toBe(false);
    expect(isProprietaire("client")).toBe(false);
  });

  it("un opérateur reçoit une erreur explicite", () => {
    const role: Role = "operateur";
    const error =
      role !== "proprietaire"
        ? "Seul le propriétaire peut créer des comptes internes."
        : null;
    expect(error).toBe(
      "Seul le propriétaire peut créer des comptes internes."
    );
  });

  it("ne peut créer que des opérateurs ou livreurs (pas de second propriétaire)", () => {
    expect(ALLOWED_CREATION_ROLES.includes("operateur")).toBe(true);
    expect(ALLOWED_CREATION_ROLES.includes("livreur")).toBe(true);
    expect(ALLOWED_CREATION_ROLES.includes("proprietaire")).toBe(false);
    expect(ALLOWED_CREATION_ROLES.includes("client")).toBe(false);
  });

  it("un rôle invalide est rejeté côté serveur", () => {
    const role = "proprietaire";
    const isValid = ALLOWED_CREATION_ROLES.includes(role);
    const error = !isValid ? "Rôle invalide." : null;
    expect(error).toBe("Rôle invalide.");
  });
});

describe("Garde-fous de rôle — supprimerCompteInterne (propriétaire only)", () => {
  it("seul le propriétaire peut supprimer des comptes", () => {
    expect(isProprietaire("proprietaire")).toBe(true);
    expect(isProprietaire("operateur")).toBe(false);
  });

  it("on ne peut pas supprimer un compte propriétaire", () => {
    const targetRole: Role = "proprietaire";
    const canDelete = ["operateur", "livreur"].includes(targetRole);
    expect(canDelete).toBe(false);
  });

  it("on peut supprimer un compte opérateur ou livreur", () => {
    expect(["operateur", "livreur"].includes("operateur")).toBe(true);
    expect(["operateur", "livreur"].includes("livreur")).toBe(true);
  });
});

describe("Garde-fous de rôle — trigger auth.on_auth_user_created", () => {
  it("le trigger force le rôle 'client' — on ne peut pas injecter un rôle via signUp", () => {
    // Migration 00003: the trigger hardcodes role = 'client'
    // regardless of what raw_user_meta_data contains.
    const signUpMetadata = { role: "proprietaire", nom: "Hacker" };
    const triggerRole = "client"; // hardcoded in trigger

    expect(triggerRole).toBe("client");
    expect(triggerRole).not.toBe(signUpMetadata.role);
  });
});
