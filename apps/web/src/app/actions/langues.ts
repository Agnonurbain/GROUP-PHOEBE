"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { LANGUE_COOKIE } from "@/lib/langues";

export async function changerLangue(code: string) {
  const cookieStore = await cookies();
  cookieStore.set(LANGUE_COOKIE, code, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}
