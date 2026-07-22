import { createClient } from "@/lib/supabase/server"
import { Footer } from "@/components/public/footer"
import { SmartHeader } from "@/components/public/smart-header"
import { VerticalLayout } from "./vertical-layout"

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const user = claimsData?.claims

  let session: { nom?: string; role?: string } | null = null
  if (user) {
    const { data } = await supabase.from("users").select("nom, role").eq("id", user.sub).single()
    session = data
  }

  return (
    <VerticalLayout>
      <SmartHeader session={session} />
      <main className="flex-1">{children}</main>
      <Footer />
    </VerticalLayout>
  )
}
