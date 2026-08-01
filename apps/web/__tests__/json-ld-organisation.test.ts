import { describe, it, expect } from "vitest";
import { createOrganizationSchema, createWebSiteSchema } from "@/lib/json-ld";
import { CONTACT_VIDE, type ParametresContact } from "@/lib/contact";

const baseUrl = "https://exemple.test";

describe("createOrganizationSchema", () => {
  it("n'expose aucun contact quand rien n'est renseigné", () => {
    const s = createOrganizationSchema({ baseUrl, contact: CONTACT_VIDE });
    expect(s.contactPoint).toBeUndefined();
    expect(s.sameAs).toBeUndefined();
    expect(s.address).toBeUndefined();
    expect(s.openingHours).toBeUndefined();
  });

  it("n'invente rien quand aucun contact n'est fourni", () => {
    const s = createOrganizationSchema({ baseUrl });
    expect(JSON.stringify(s)).not.toMatch(/groupphoebe\.com|01 ?02 ?03|facebook/i);
  });

  it("expose le téléphone et l'e-mail réellement saisis", () => {
    const contact: ParametresContact = {
      ...CONTACT_VIDE,
      telephone: "+225 07 78 63 19 83",
      email: "contact@exemple.test",
    };
    const s = createOrganizationSchema({ baseUrl, contact });
    expect(s.contactPoint).toMatchObject({
      telephone: "+225 07 78 63 19 83",
      email: "contact@exemple.test",
    });
  });

  it("ne liste que les réseaux renseignés", () => {
    const contact: ParametresContact = {
      ...CONTACT_VIDE,
      facebook: "https://facebook.com/gp",
      instagram: "  ",
    };
    const s = createOrganizationSchema({ baseUrl, contact });
    expect(s.sameAs).toEqual(["https://facebook.com/gp"]);
  });

  it("n'inclut pas WhatsApp dans sameAs (ce n'est pas un profil)", () => {
    const contact: ParametresContact = { ...CONTACT_VIDE, whatsapp: "2250778631983" };
    const s = createOrganizationSchema({ baseUrl, contact });
    expect(s.sameAs).toBeUndefined();
  });

  it("utilise le domaine passé en paramètre, jamais un domaine codé en dur", () => {
    const s = createOrganizationSchema({ baseUrl });
    expect(s.url).toBe(baseUrl);
    // Ce qui est gardé ici, c'est le DOMAINE, pas le nom du fichier : figer
    // celui-ci faisait échouer le test au premier changement de logo, alors
    // que la règle qu'il protège n'avait pas bougé.
    expect(s.logo).toMatch(new RegExp(`^${baseUrl}/logos/[\\w-]+\\.png$`));
    expect(s.logo).not.toMatch(/group-phoebe\.com/);
  });
});

describe("createWebSiteSchema", () => {
  it("ne déclare pas de SearchAction — la route /search n'existe pas", () => {
    const s = createWebSiteSchema(baseUrl);
    expect(s.potentialAction).toBeUndefined();
    expect(JSON.stringify(s)).not.toContain("/search");
  });
});
