import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://group-phoebe.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/profil/",
          "/panier/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
