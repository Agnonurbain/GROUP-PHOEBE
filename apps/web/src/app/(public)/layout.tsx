import { createClient } from "@/lib/supabase/server"
import { Footer } from "@/components/public/footer"
import { SmartHeader } from "@/components/public/smart-header"
import { VerticalLayout } from "./vertical-layout"
import { ThemeProvider } from "@/components/theme-provider"
import { getLangues, detecterLangue, LANGUE_COOKIE } from "@/lib/langues"
import { LangueProvider } from "@/lib/langue-context"
import { cookies, headers } from "next/headers"

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [langues, acceptLanguage, langueCookie] = await Promise.all([
    getLangues(),
    headers().then((h) => h.get("accept-language") ?? undefined),
    cookies().then((c) => c.get(LANGUE_COOKIE)?.value),
  ])

  const langue = (() => {
    const detected = detecterLangue(acceptLanguage, langueCookie)
    if (langues.some((l) => l.code === detected)) return detected
    const defaut = langues.find((l) => l.defaut)
    return defaut?.code ?? "fr"
  })()

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const user = claimsData?.claims

  let session: { nom?: string; role?: string } | null = null
  if (user) {
    const { data } = await supabase.from("users").select("nom, role").eq("id", user.sub).single()
    session = data
  }

  return (
    // Sombre par défaut (identité verrouillée dans design.md) : `enableSystem`
    // est désactivé, sinon un visiteur au système clair verrait le site basculer.
    // Clé de stockage distincte : la préférence d'un opérateur dans le
    // back-office ne doit pas changer le site vu par les visiteurs.
    <ThemeProvider defaultTheme="dark" enableSystem={false} storageKey="theme-public">
      <LangueProvider langue={langue}>
      <VerticalLayout>
      <a href="#contenu" className="skip-link">
        Aller au contenu principal
      </a>
      <SmartHeader session={session} langues={langues} langue={langue} />
      <main id="contenu" tabIndex={-1} className="flex-1">
        {children}
      </main>
      <Footer />
      </VerticalLayout>
      </LangueProvider>
    </ThemeProvider>
  )
}
