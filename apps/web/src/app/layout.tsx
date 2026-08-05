import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { CartProvider } from "@/lib/cart-context";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { PushNotificationSetup } from "@/components/push-notification-setup";
import { OfflineBanner } from "@/components/offline-banner";
import { getParametresContact } from "@/lib/public-cache";
import { getT, langueCourante } from "@/lib/i18n/server";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Display serif éditoriale (titres) — appairée à Inter (corps).
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
});

export const viewport: Viewport = {
  themeColor: "#141312",
  width: "device-width",
  initialScale: 1,
};

/**
 * Le gabarit racine, dans la langue du visiteur.
 *
 * `export const metadata` est évalué au chargement du module, sans requête :
 * il ne pouvait pas suivre la langue. Et `openGraph.locale` annonçait `fr_CI`
 * même sur une page servie en anglais — les réseaux sociaux affichaient donc
 * la mauvaise variante à qui la partageait.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://group-phoebe.com"),
    title: {
      default: t.meta.siteTitre,
      template: "%s | GROUP PHOEBE",
    },
    description: t.meta.siteDescription,
    openGraph: {
      type: "website",
      locale: t.meta.ogLocale,
      siteName: "GROUP PHOEBE",
      title: t.meta.sitePartageTitre,
      description: t.meta.sitePartageDescription,
    },
    twitter: {
      card: "summary_large_image",
      title: "GROUP PHOEBE",
      description: t.meta.sitePartageDescription,
    },
    icons: {
      icon: "/favicon.ico",
      apple: "/apple-icon.png",
    },
    manifest: "/manifest.json",
    other: {
      "mobile-web-app-capable": "yes",
      "apple-mobile-web-app-status-bar-style": "black-translucent",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const contact = await getParametresContact();

  return (
    // `suppressHydrationWarning` : next-themes pose la classe de thème sur
    // <html> avant l'hydratation, ce qui diverge forcément du rendu serveur.
    // `color-scheme` n'est plus figé ici : le public l'impose en sombre via
    // [data-vertical], et next-themes le gère dans l'admin et l'auth — le figer
    // laissait les contrôles natifs (barres de défilement, sélecteurs de date)
    // en clair sur fond sombre.
    <html
      // `lang` suit la langue choisie : figé à "fr", il faisait annoncer du
      // français à un lecteur d'écran servant une interface anglaise, et
      // orientait mal la traduction automatique des navigateurs.
      lang={await langueCourante()}
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <CartProvider>
          <OfflineBanner />
          {children}
          <WhatsAppFloat whatsapp={contact.whatsapp} />
          <PushNotificationSetup />
        </CartProvider>
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? ""} />
      </body>
    </html>
  );
}
