import { describe, it, expect } from "vitest";
import {
  CONTACT_VIDE,
  telHref,
  whatsappHref,
  reseauxActifs,
  type ParametresContact,
} from "@/lib/contact";

describe("telHref", () => {
  it("nettoie le numéro pour un href utilisable", () => {
    expect(telHref("+225 07 78 63 19 83")).toBe("tel:+2250778631983");
  });
  it("retourne null sans numéro — aucun lien ne doit s'afficher", () => {
    expect(telHref(null)).toBeNull();
    expect(telHref("")).toBeNull();
    expect(telHref("   ")).toBeNull();
  });
});

describe("whatsappHref", () => {
  it("construit un lien wa.me avec message", () => {
    const href = whatsappHref("2250778631983", "Bonjour");
    expect(href).toContain("https://wa.me/2250778631983");
    expect(href).toContain("text=Bonjour");
  });
  it("tolère un numéro formaté", () => {
    expect(whatsappHref("+225 07 78 63 19 83")).toBe("https://wa.me/2250778631983");
  });
  it("retourne null sans numéro — le bouton doit disparaître", () => {
    expect(whatsappHref(null)).toBeNull();
    expect(whatsappHref("")).toBeNull();
    expect(whatsappHref("--")).toBeNull();
  });
});

describe("reseauxActifs", () => {
  it("ne retourne que les réseaux renseignés", () => {
    const contact: ParametresContact = {
      ...CONTACT_VIDE,
      facebook: "https://facebook.com/gp",
      instagram: "   ",
    };
    const actifs = reseauxActifs(contact);
    expect(actifs).toHaveLength(1);
    expect(actifs[0].key).toBe("facebook");
  });

  it("ne retourne rien quand tout est vide", () => {
    expect(reseauxActifs(CONTACT_VIDE)).toEqual([]);
  });

  it("exclut WhatsApp (rendu par son propre bouton)", () => {
    const contact: ParametresContact = { ...CONTACT_VIDE, whatsapp: "2250778631983" };
    expect(reseauxActifs(contact)).toEqual([]);
  });
});

describe("CONTACT_VIDE", () => {
  it("est entièrement nul : aucune coordonnée fictive par défaut", () => {
    expect(Object.values(CONTACT_VIDE).every((v) => v === null)).toBe(true);
  });
});
