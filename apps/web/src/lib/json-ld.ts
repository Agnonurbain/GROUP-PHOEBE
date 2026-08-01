import { CONTACT_VIDE, reseauxActifs, type ParametresContact } from "@/lib/contact";

export interface JsonLdContext {
  "@context": string;
  "@type": string;
  [key: string]: unknown;
}

/**
 * Données structurées de l'organisation, alimentées par les coordonnées
 * saisies en administration (table parametres_contact).
 *
 * Aucun champ n'est inventé : téléphone, e-mail, adresse et réseaux ne sont
 * inclus que s'ils sont réellement renseignés. Publier un faux numéro ou un
 * profil social inexistant dans un balisage lu par Google est pire qu'une
 * absence.
 */
export function createOrganizationSchema(params: {
  baseUrl: string;
  contact?: ParametresContact;
}): JsonLdContext {
  const { baseUrl, contact } = params;
  const c = contact ?? CONTACT_VIDE;

  const schema: JsonLdContext = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "GROUP PHOEBE",
    url: baseUrl,
    logo: `${baseUrl}/logos/phoebe.png`,
    description:
      "Transport et livraison, immobilier et assistance voyages à Abidjan et partout en Côte d'Ivoire.",
    areaServed: { "@type": "Country", name: "Côte d'Ivoire" },
  };

  const reseaux = reseauxActifs(c).map((r) => r.url);
  if (reseaux.length > 0) schema.sameAs = reseaux;

  if (c.telephone || c.email) {
    schema.contactPoint = {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: ["French"],
      areaServed: "CI",
      ...(c.telephone ? { telephone: c.telephone } : {}),
      ...(c.email ? { email: c.email } : {}),
    };
  }

  if (c.adresse) {
    schema.address = {
      "@type": "PostalAddress",
      addressCountry: "CI",
      streetAddress: c.adresse,
    };
  }

  if (c.horaires) schema.openingHours = c.horaires;

  return schema;
}

/**
 * Le SearchAction a été retiré : il déclarait à Google une recherche
 * `/search?q=` alors que cette route n'existe pas.
 */
export function createWebSiteSchema(baseUrl: string): JsonLdContext {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "GROUP PHOEBE",
    url: baseUrl,
  };
}

export function createBreadcrumbSchema(items: Array<{ name: string; url: string }>): JsonLdContext {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function createProductSchema(params: {
  name: string;
  description: string;
  image?: string;
  price: number;
  currency: string;
  availability: string;
  brand?: string;
  category?: string;
  sku?: string;
  offers?: {
    price: number;
    currency: string;
    availability: string;
    url?: string;
  }[];
}): JsonLdContext {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: params.name,
    description: params.description,
    image: params.image,
    brand: params.brand ? { "@type": "Brand", name: params.brand } : undefined,
    category: params.category,
    sku: params.sku,
    offers: params.offers?.map((offer) => ({
      "@type": "Offer",
      price: offer.price,
      priceCurrency: offer.currency,
      availability: offer.availability,
      url: offer.url,
    })) ?? [
      {
        "@type": "Offer",
        price: params.price,
        priceCurrency: params.currency,
        availability: params.availability,
      },
    ],
  };
}

export function createVehicleSchema(params: {
  name: string;
  description: string;
  image?: string;
  price: number;
  currency: string;
  availability: string;
  brand: string;
  model: string;
  category: string;
  specs: Record<string, string>;
  availabilityStarts?: string;
  availabilityEnds?: string;
}): JsonLdContext {
  return {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name: params.name,
    description: params.description,
    image: params.image,
    brand: {
      "@type": "Brand",
      name: params.brand,
    },
    model: params.model,
    vehicleConfiguration: params.category,
    vehicleModelDate: new Date().getFullYear().toString(),
    ...Object.fromEntries(
      Object.entries(params.specs).map(([key, value]) => [
        key.toLowerCase().replace(/\s+/g, ""),
        value,
      ])
    ),
    offers: {
      "@type": "Offer",
      price: params.price,
      priceCurrency: params.currency,
      availability: params.availability,
      validFrom: params.availabilityStarts,
      validThrough: params.availabilityEnds,
    },
  };
}

export function createRealEstateListingSchema(params: {
  name: string;
  description: string;
  image?: string;
  price: number;
  currency: string;
  availability: string;
  address: {
    streetAddress?: string;
    addressLocality: string;
    addressRegion?: string;
    addressCountry: string;
    postalCode?: string;
  };
  numberOfRooms?: number;
  floorSize?: {
    value: number;
    unitCode: string;
  };
  numberOfBathrooms?: number;
  numberOfBedrooms?: number;
  propertyType: string;
  transactionType: "rent" | "sale";
  availabilityStarts?: string;
  availabilityEnds?: string;
}): JsonLdContext {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: params.name,
    description: params.description,
    image: params.image,
    address: {
      "@type": "PostalAddress",
      streetAddress: params.address.streetAddress,
      addressLocality: params.address.addressLocality,
      addressRegion: params.address.addressRegion,
      addressCountry: params.address.addressCountry,
      postalCode: params.address.postalCode,
    },
    numberOfRooms: params.numberOfRooms,
    floorSize: params.floorSize
      ? {
          "@type": "QuantitativeValue",
          value: params.floorSize.value,
          unitCode: params.floorSize.unitCode,
        }
      : undefined,
    numberOfBathrooms: params.numberOfBathrooms,
    numberOfBedrooms: params.numberOfBedrooms,
    propertyType: params.propertyType,
    offers: {
      "@type": "Offer",
      price: params.price,
      priceCurrency: params.currency,
      availability: params.availability,
      validFrom: params.availabilityStarts,
      validThrough: params.availabilityEnds,
      businessFunction: params.transactionType === "sale"
        ? "http://purl.org/goodrelations/v1#Sell"
        : "http://purl.org/goodrelations/v1#LeaseOut",
    },
  };
}

export function createServiceSchema(params: {
  name: string;
  description: string;
  provider: {
    name: string;
    url: string;
  };
  areaServed: string | string[];
  serviceType: string;
  price?: number;
  currency?: string;
  availability?: string;
}): JsonLdContext {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: params.name,
    description: params.description,
    provider: {
      "@type": "Organization",
      name: params.provider.name,
      url: params.provider.url,
    },
    areaServed: params.areaServed,
    serviceType: params.serviceType,
    offers: params.price
      ? {
          "@type": "Offer",
          price: params.price,
          priceCurrency: params.currency,
          availability: params.availability,
        }
      : undefined,
  };
}

export function createCourseSchema(params: {
  name: string;
  description: string;
  provider: {
    name: string;
    url: string;
  };
  educationalLevel: string;
  teaches?: string[];
  hasCourseInstance: {
    courseMode: "online" | "offline" | "blended";
    location?: {
      "@type": "Place";
      address: {
        "@type": "PostalAddress";
        addressLocality: string;
        addressCountry: string;
      };
    };
    startDate: string;
    endDate?: string;
  }[];
}): JsonLdContext {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: params.name,
    description: params.description,
    provider: {
      "@type": "Organization",
      name: params.provider.name,
      url: params.provider.url,
    },
    educationalLevel: params.educationalLevel,
    teaches: params.teaches,
    hasCourseInstance: params.hasCourseInstance.map((instance) => ({
      "@type": "CourseInstance",
      courseMode: instance.courseMode,
      location: instance.location,
      startDate: instance.startDate,
      endDate: instance.endDate,
    })),
  };
}

/**
 * Serialise un schema pour injection dans un <script type="application/ld+json">.
 *
 * JSON.stringify n'echappe ni `<` ni `>`. Une valeur issue de la base contenant
 * `</script>` refermerait donc le bloc, et le navigateur interpreterait la suite
 * comme du HTML : XSS stocke sur une page publique.
 *
 * Les sequences < et > restent du JSON parfaitement valide et se
 * reparsent en `<` et `>`, sans jamais apparaitre litteralement dans la page.
 * U+2028 et U+2029 sont des sauts de ligne valides en JSON mais illegaux dans
 * un litteral JavaScript, d'ou leur echappement.
 */
export function serializeJsonLd(schema: unknown): string {
  return JSON.stringify(schema)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function renderJsonLd(schema: JsonLdContext): string {
  return `<script type="application/ld+json">${serializeJsonLd(schema)}</script>`;
}

export function combineJsonLd(...schemas: JsonLdContext[]): string {
  return schemas.map(renderJsonLd).join("\n");
}