import type { Metadata } from "next";
import InscriptionForm from "./inscription-form";

export const metadata: Metadata = {
  title: "Inscription — GROUP PHOEBE",
  description: "Créez votre compte GROUP PHOEBE pour réserver des véhicules, consulter l'immobilier et accéder à l'assistance voyage.",
  openGraph: {
    title: "Inscription — GROUP PHOEBE",
    description: "Créez votre compte GROUP PHOEBE pour réserver des véhicules, consulter l'immobilier et accéder à l'assistance voyage.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Inscription — GROUP PHOEBE",
    description: "Créez votre compte GROUP PHOEBE pour réserver des véhicules, consulter l'immobilier et accéder à l'assistance voyage.",
  },
}

export default function InscriptionPage() {
  return <InscriptionForm />;
}