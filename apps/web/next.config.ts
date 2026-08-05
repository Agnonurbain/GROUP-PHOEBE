import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `deposerPieceDossier` accepte des pièces jusqu'à 10 Mo (`MAX_FILE_SIZE`),
  // mais une Server Action plafonne à 1 Mo par défaut : tout fichier au-delà
  // échouait sans message utile. On aligne la limite sur ce que le code promet.
  //
  // Les passeports du formulaire de billet ne passent PAS par ici : ils montent
  // du navigateur vers le bucket, un dossier pouvant compter neuf voyageurs.
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // Next 16 refuse par défaut d'optimiser une image servie par une IP privée
    // — une protection contre le SSRF, et elle a raison de l'être. En
    // développement, la Supabase locale EST sur 127.0.0.1 : sans cette
    // dérogation, aucune photo de storage n'est vérifiable au navigateur.
    // Jamais en production, où l'optimiseur ne doit pas pouvoir être dirigé
    // vers le réseau interne du serveur.
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
    // Next 16 exige de déclarer les qualités autorisées (75 par défaut + celles
    // utilisées explicitement dans l'app).
    qualities: [75, 80, 85],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      // La Supabase locale sert sur 127.0.0.1 : sans cette entrée, `next/image`
      // rejette toute photo de storage en développement — et la page qui
      // l'affiche casse entièrement, ce qui rend la vérification au navigateur
      // impossible pour le catalogue comme pour les véhicules.
      //
      // Bornée au développement : en production, l'optimiseur d'images ne doit
      // pas pouvoir être dirigé vers la boucle locale du serveur.
      ...(process.env.NODE_ENV === "production"
        ? []
        : [
            {
              protocol: "http" as const,
              hostname: "127.0.0.1",
              pathname: "/storage/v1/object/public/**",
            },
          ]),
    ],
  },
  async headers() {
    const securityHeaders = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "geolocation=(self), camera=(self)" },
    ]
    return [
      {
        source: "/images/:path*",
        headers: [
          ...securityHeaders,
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/logo.:ext",
        headers: [
          ...securityHeaders,
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          ...securityHeaders,
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ]
  },
  async redirects() {
    return [
      {
        source: "/catalogue",
        destination: "/transport/catalogue",
        permanent: true,
      },
      {
        source: "/catalogue/:slug",
        destination: "/transport/vehicule/:slug",
        permanent: true,
      },
      {
        source: "/catalogue/:path*",
        destination: "/transport/catalogue/:path*",
        permanent: true,
      },
      {
        source: "/profil",
        destination: "/compte/profil",
        permanent: true,
      },
      {
        source: "/profil/reservations",
        destination: "/compte/reservations",
        permanent: true,
      },
      {
        source: "/profil/favoris",
        destination: "/compte/favoris",
        permanent: true,
      },
      {
        source: "/profil/verification",
        destination: "/compte/verification",
        permanent: true,
      },
      {
        source: "/auth/callback",
        destination: "/callback",
        permanent: true,
      },
    ]
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  sourcemaps: { deleteSourcemapsAfterUpload: true },
  webpack: {
    treeshake: { removeDebugLogging: true },
  },
});
