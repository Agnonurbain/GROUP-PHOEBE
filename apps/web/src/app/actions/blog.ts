"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Database } from "@group-phoebe/database/types";

async function requireStaff() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) throw new Error("Non authentifié");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.sub)
    .single();
  if (!profile || !["operateur", "proprietaire", "agent_immobilier"].includes(profile.role)) {
    throw new Error("Accès refusé");
  }
  return { user, role: profile.role as string };
}

function getAdmin() {
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export type BlogState = {
  error?: string;
  success?: boolean;
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ─── Catégories ───────────────────────────────────────────────────────────────

export async function creerCategorie(
  _prev: BlogState,
  formData: FormData
): Promise<BlogState> {
  try {
    await requireStaff();
  } catch {
    return { error: "Session expirée ou accès refusé." };
  }

  const admin = getAdmin();
  const id = formData.get("id") as string | null;
  const nom = formData.get("nom") as string;
  const slug = (formData.get("slug") as string) || slugify(nom);
  const description = (formData.get("description") as string) || null;
  const ordre = Number(formData.get("ordre")) || 0;

  if (!nom) return { error: "Le nom est obligatoire." };

  if (id) {
      const { error } = await admin
        .from("categories_article")
        .update({ nom, slug, description, ordre })
        .eq("id", id);
      if (error) return { error: error.message };
    } else {
      const { error } = await admin
        .from("categories_article")
        .insert({ nom, slug, description, ordre } as never);
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/blog/categories");
  return { success: true };
}

export async function supprimerCategorie(id: string): Promise<BlogState> {
  try {
    await requireStaff();
  } catch {
    return { error: "Session expirée ou accès refusé." };
  }

  const admin = getAdmin();
  const { error } = await admin.from("categories_article").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/blog/categories");
  return { success: true };
}

// ─── Articles ─────────────────────────────────────────────────────────────────

export async function creerArticle(
  _prev: BlogState,
  formData: FormData
): Promise<BlogState> {
  try {
    await requireStaff();
  } catch {
    return { error: "Session expirée ou accès refusé." };
  }

  const admin = getAdmin();
  const id = formData.get("id") as string | null;
  const titre = formData.get("titre") as string;
  const slug = (formData.get("slug") as string) || slugify(titre);
  const categorie_id = (formData.get("categorie_id") as string) || null;
  const resume = (formData.get("resume") as string) || null;
  const contenu = formData.get("contenu") as string;
  const image_couverture = (formData.get("image_couverture") as string) || null;
  const auteur = (formData.get("auteur") as string) || null;
  const meta_description = (formData.get("meta_description") as string) || null;
  const meta_title = (formData.get("meta_title") as string) || null;
  const publie = formData.get("publie") === "on";

  if (!titre) return { error: "Le titre est obligatoire." };
  if (!contenu) return { error: "Le contenu est obligatoire." };

  if (id) {
    const updates: Record<string, unknown> = {
      titre,
      slug,
      categorie_id,
      resume,
      contenu,
      image_couverture,
      auteur,
      meta_description,
      meta_title,
      publie,
      updated_at: new Date().toISOString(),
    };

    if (publie && !formData.get("date_publication")) {
      updates.date_publication = new Date().toISOString();
    }

    const { error } = await admin.from("articles").update(updates as never).eq("id", id);
    if (error) return { error: error.message };
  } else {
    const insert: Record<string, unknown> = {
      titre,
      slug,
      categorie_id,
      resume,
      contenu,
      image_couverture,
      auteur,
      meta_description,
      meta_title,
      publie,
    };

    if (publie) {
      insert.date_publication = new Date().toISOString();
    }

    const { error } = await admin.from("articles").insert(insert as never);
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/blog");
  return { success: true };
}

export async function publierArticle(
  id: string,
  publie: boolean
): Promise<BlogState> {
  try {
    await requireStaff();
  } catch {
    return { error: "Session expirée ou accès refusé." };
  }

  const admin = getAdmin();
  const updates: Record<string, unknown> = { publie, updated_at: new Date().toISOString() };

  if (publie) {
    updates.date_publication = new Date().toISOString();
  }

  const { error } = await admin.from("articles").update(updates as never).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/blog");
  return { success: true };
}

export async function supprimerArticle(id: string): Promise<BlogState> {
  try {
    await requireStaff();
  } catch {
    return { error: "Session expirée ou accès refusé." };
  }

  const admin = getAdmin();
  const { error } = await admin.from("articles").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/blog");
  redirect("/admin/blog");
}
