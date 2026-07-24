export interface JsonLdContext {
  "@context": string;
  "@type": string;
  [key: string]: unknown;
}

export function createOrganizationSchema(): JsonLdContext {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "GROUP PHOEBE",
    url: "https://groupphoebe.com",
    logo: "https://groupphoebe.com/logo.png",
    sameAs: [
      "https://facebook.com/groupphoebe",
      "https://twitter.com/groupphoebe",
      "https://linkedin.com/company/groupphoebe",
      "https://instagram.com/groupphoebe",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+225-01-02-03-04-05",
      contactType: "customer service",
      availableLanguage: ["French"],
      areaServed: "CI",
    },
    address: {
      "@type": "PostalAddress",
      addressCountry: "CI",
      addressLocality: "Abidjan",
    },
  };
}

export function createWebSiteSchema(): JsonLdContext {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "GROUP PHOEBE",
    url: "https://groupphoebe.com",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://groupphoebe.com/search?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
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

export function renderJsonLd(schema: JsonLdContext): string {
  return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
}

export function combineJsonLd(...schemas: JsonLdContext[]): string {
  return schemas.map(renderJsonLd).join("\n");
}