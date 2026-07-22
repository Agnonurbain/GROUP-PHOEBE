import type { Metadata } from "next";
import ConnexionForm from "./connexion-form";

export const metadata: Metadata = {
  title: "Connexion — GROUP PHOEBE",
  description: "Connectez-vous à votre compte GROUP PHOEBE pour gérer vos réservations, favoris et documents.",
  openGraph: {
    title: "Connexion — GROUP PHOEBE",
    description: "Connectez-vous à votre compte GROUP PHOEBE pour gérer vos réservations, favoris et documents.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Connexion — GROUP PHOEBE",
    description: "Connectez-vous à votre compte GROUP PHOEBE pour gérer vos réservations, favoris et documents.",
  },
}

export default function ConnexionPage() {
  return <ConnexionForm />;
}