import type { Database } from "@group-phoebe/database/types";

type User = Database["public"]["Tables"]["users"]["Row"];

export type StatutVerification = User["statut_verification"];

export function isUserVerified(user: Pick<User, "statut_verification">): boolean {
  return user.statut_verification === "verifie";
}

export function hasMinimumAge(dateNaissance: string | Date, minimumAge = 21): boolean {
  const birth = new Date(dateNaissance);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= minimumAge;
}
