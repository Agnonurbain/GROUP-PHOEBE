import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { makeGroupKey } from "@/lib/vehicle-group";

export default async function ChoixRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: v } = await supabase
    .from("vehicules")
    .select("marque, modele")
    .eq("id", id)
    .single();

  if (!v) notFound();

  const groupKey = makeGroupKey(v.marque, v.modele);
  redirect(`/catalogue/groupe/${encodeURIComponent(groupKey)}/choix`);
}
