import type { Metadata } from "next";
import VerifierOtpForm from "./verifier-otp-form";

export const metadata: Metadata = {
  title: "Vérification OTP — GROUP PHOEBE",
  description: "Saisissez le code de vérification envoyé par SMS ou email pour confirmer votre identité.",
  openGraph: {
    title: "Vérification OTP — GROUP PHOEBE",
    description: "Saisissez le code de vérification envoyé par SMS ou email pour confirmer votre identité.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vérification OTP — GROUP PHOEBE",
    description: "Saisissez le code de vérification envoyé par SMS ou email pour confirmer votre identité.",
  },
}

export default function VerifierOtpPage() {
  return <VerifierOtpForm />;
}