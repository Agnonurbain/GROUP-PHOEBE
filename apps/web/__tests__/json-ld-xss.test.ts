import { describe, it, expect } from "vitest"
import { serializeJsonLd, renderJsonLd, createProductSchema } from "@/lib/json-ld"

// Charge utile realiste : un operateur saisit ceci dans la description d'un
// vehicule, le champ ressort tel quel dans le <script type="application/ld+json">
// de la fiche publique.
const EVASION = '</script><script>alert(document.domain)</script>'

describe("serializeJsonLd", () => {
  it("neutralise une tentative de sortie du bloc script", () => {
    const sortie = serializeJsonLd({ description: EVASION })

    // Le point critique : plus aucun chevron litteral dans la sortie.
    expect(sortie).not.toContain("</script>")
    expect(sortie).not.toContain("<")
    expect(sortie).not.toContain(">")
    expect(sortie).toContain("\\u003c")
  })

  it("reste du JSON valide qui reparse la valeur d'origine", () => {
    // L'echappement ne doit pas alterer la donnee : les moteurs de recherche
    // doivent lire exactement ce qui a ete saisi.
    const valeurs = [
      EVASION,
      "Berline <premium> & confort",
      "Guillemets \" et ' apostrophes",
      "Accents: éàùç — tirets cadratins",
    ]

    for (const v of valeurs) {
      expect(JSON.parse(serializeJsonLd({ description: v })).description).toBe(v)
    }
  })

  it("echappe les separateurs de ligne illegaux en JavaScript", () => {
    const original = "avant\u2028apres\u2029fin"
    const sortie = serializeJsonLd({ note: original })

    expect(sortie).toContain("\\u2028")
    expect(sortie).toContain("\\u2029")
    expect(JSON.parse(sortie).note).toBe(original)
  })

  it("echappe l'esperluette, qui permettrait des entites HTML", () => {
    expect(serializeJsonLd({ x: "a&b" })).toContain("\\u0026")
  })
})

describe("renderJsonLd", () => {
  it("produit un bloc script que la charge utile ne peut pas refermer", () => {
    const html = renderJsonLd(
      createProductSchema({
        name: EVASION,
        description: EVASION,
        price: 1000,
        currency: "XOF",
        availability: "https://schema.org/InStock",
      }),
    )

    // Exactement une balise ouvrante et une fermante : celles du gabarit.
    expect(html.match(/<script/g)).toHaveLength(1)
    expect(html.match(/<\/script>/g)).toHaveLength(1)
    expect(html.startsWith('<script type="application/ld+json">')).toBe(true)
    expect(html.endsWith("</script>")).toBe(true)
  })
})
