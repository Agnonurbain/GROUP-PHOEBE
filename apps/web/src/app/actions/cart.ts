"use server";

import { createClient } from "@/lib/supabase/server";
import type { CartItem } from "@/lib/cart-context";

export type CartState = {
  error?: string;
  items?: CartItem[];
};

export async function loadServerCart(): Promise<CartItem[]> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) return [];

  const { data } = await supabase
    .from("paniers")
    .select("items")
    .eq("client_id", user.sub)
    .maybeSingle();

  if (!data) return [];
  return (data.items as CartItem[]) ?? [];
}

export async function saveServerCart(
  _prev: CartState,
  formData: FormData
): Promise<CartState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) return { error: "Non connecté" };

  const itemsRaw = formData.get("items") as string;
  if (!itemsRaw) return { error: "Panier vide" };

  let items: CartItem[];
  try {
    items = JSON.parse(itemsRaw);
  } catch {
    return { error: "Données invalides" };
  }

  const { error } = await supabase.from("paniers").upsert(
    { client_id: user.sub, items },
    { onConflict: "client_id" }
  );

  if (error) return { error: error.message };
  return { items };
}

export async function clearServerCart(): Promise<void> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) return;

  await supabase.from("paniers").delete().eq("client_id", user.sub);
}
