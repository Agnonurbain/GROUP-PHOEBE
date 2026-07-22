import type { Metadata } from "next"
import MotDePasseOubliePage from "./page-client";

export const metadata: Metadata = {
  title: "Mot de passe oublié — GROUP PHOEBE",
  description: "Réinitialisez votre mot de passe GROUP PHOEBE. Recevez un lien de réinitialisation par email.",
  openGraph: {
    title: "Mot de passe oublié — GROUP PHOEBE",
    description: "Réinitialisez votre mot de passe GROUP PHOEBE. Recevez un lien de réinitialisation par email.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mot de passe oublié — GROUP PHOEBE",
    description: "Réinitialisez votre mot de passe GROUP PHOEBE. Recevez un lien de réinitialisation par email.",
  },
}

export default function Page() {
  return <MotDePasseOubliePage />;
}
