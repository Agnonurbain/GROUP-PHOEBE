import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NouveauMotDePasseForm from "./form";

export default async function NouveauMotDePassePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/mot-de-passe-oublie");

  return <NouveauMotDePasseForm />;
}
