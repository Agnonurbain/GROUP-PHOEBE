import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
    default: "GROUP PHOEBE — Transport, Livraison, Immobilier & Assistance Voyages",
    template: "%s | GROUP PHOEBE",
  },
  description:
    "Plateforme numérique de services professionnels : transport, livraison de colis, immobilier et assistance voyages et études en Côte d'Ivoire.",
  openGraph: {
    type: "website",
    locale: "fr_CI",
    siteName: "GROUP PHOEBE",
    title: "GROUP PHOEBE — Services professionnels",
    description: "Transport, livraison, immobilier et assistance voyages en Côte d'Ivoire.",
  },
  twitter: {
    card: "summary",
    title: "GROUP PHOEBE",
    description: "Transport, livraison, immobilier et assistance voyages en Côte d'Ivoire.",
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
