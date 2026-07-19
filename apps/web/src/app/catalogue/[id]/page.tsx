import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { makeGroupKey } from "@/lib/vehicle-group";

export default async function VehiculeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const mode = sp.mode;

  const supabase = await createClient();
  const { data: v } = await supabase
    .from("vehicules")
    .select("marque, modele")
    .eq("id", id)
    .single();

  if (!v) notFound();

  const groupKey = makeGroupKey(v.marque, v.modele);
  const target = mode
    ? `/catalogue/groupe/${encodeURIComponent(groupKey)}?mode=${mode}`
    : `/catalogue/groupe/${encodeURIComponent(groupKey)}/choix`;

  redirect(target);
}
