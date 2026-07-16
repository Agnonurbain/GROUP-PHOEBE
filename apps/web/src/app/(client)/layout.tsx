import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  console.log("LAYOUT getClaims:", JSON.stringify({ data: claimsResult.data, error: claimsResult.error?.message }));
  const user = claimsResult.data?.claims;

  if (!user) {
    const sessionResult = await supabase.auth.getSession();
    console.log("LAYOUT getSession:", JSON.stringify({ session: !!sessionResult.data.session, error: sessionResult.error?.message }));
    redirect("/connexion");
  }

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        {children}
      </main>
    </>
  );
}
