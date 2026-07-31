// Où atterrit un compte selon son rôle. Module pur : utilisé par les server
// actions d'authentification et testable sans base.

/**
 * Un livreur tombait sur `/compte/profil`, c'est-à-dire l'espace d'un client :
 * son propre outil de travail était invisible, et le back-office lui répond
 * `notFound()`. Le rôle décide de la porte.
 */
export function accueilSelonRole(role: string | null | undefined): string {
  switch (role) {
    case "operateur":
    case "proprietaire":
    case "agent_immobilier":
      return "/admin";
    case "livreur":
      return "/terrain/livreur";
    default:
      return "/compte/profil";
  }
}
