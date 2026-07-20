import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { CartProvider } from "@/lib/cart-context";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { PushNotificationSetup } from "@/components/push-notification-setup";
import { OfflineBanner } from "@/components/offline-banner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
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
    card: "summary",
    title: "GROUP PHOEBE",
    description: "Transport, livraison, immobilier et assistance migration, visa et études en Côte d'Ivoire.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={{ colorScheme: "light" }}
    >
      <body className="min-h-full flex flex-col">
        <CartProvider>
          <OfflineBanner />
          {children}
          <WhatsAppFloat />
          <PushNotificationSetup />
        </CartProvider>
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? ""} />
      </body>
    </html>
  );
}
