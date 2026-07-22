import type { Metadata } from "next"
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NouveauMotDePasseForm from "./form";

export const metadata: Metadata = {
  title: "Nouveau mot de passe — GROUP PHOEBE",
  description: "Définissez votre nouveau mot de passe GROUP PHOEBE.",
  openGraph: {
    title: "Nouveau mot de passe — GROUP PHOEBE",
    description: "Définissez votre nouveau mot de passe GROUP PHOEBE.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nouveau mot de passe — GROUP PHOEBE",
    description: "Définissez votre nouveau mot de passe GROUP PHOEBE.",
  },
}

export default async function NouveauMotDePassePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/mot-de-passe-oublie");

  return <NouveauMotDePasseForm />;
}
