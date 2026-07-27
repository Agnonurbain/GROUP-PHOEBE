import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { CartProvider } from "@/lib/cart-context";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { PushNotificationSetup } from "@/components/push-notification-setup";
import { OfflineBanner } from "@/components/offline-banner";
import { getParametresContact } from "@/lib/public-cache";
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

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://group-phoebe.com"),
  title: {
    default: "GROUP PHOEBE — Transport, Livraison, Immobilier & Assistance Migration",
    template: "%s | GROUP PHOEBE",
  },
  description:
    "Plateforme numérique de services professionnels : transport, livraison de colis, immobilier et assistance migration, visa et études en Côte d'Ivoire.",
  openGraph: {
    type: "website",
    locale: "fr_CI",
    siteName: "GROUP PHOEBE",
    title: "GROUP PHOEBE — Services professionnels",
    description: "Transport, livraison, immobilier et assistance migration, visa et études en Côte d'Ivoire.",
  },
  twitter: {
    card: "summary_large_image",
    title: "GROUP PHOEBE",
    description: "Transport, livraison, immobilier et assistance migration, visa et études en Côte d'Ivoire.",
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
      lang="fr"
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
