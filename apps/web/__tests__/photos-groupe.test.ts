import { describe, it, expect } from "vitest";
import { photosDuGroupe } from "@/lib/vehicle-group";

describe("photosDuGroupe", () => {
  it("remonte les photos d'un AUTRE exemplaire du groupe", () => {
    // Le bug : la fiche ne regardait que vehicules[0]. Si l'admin avait mis les
    // photos sur le 2e exemplaire, la page était vide alors que le catalogue,
    // lui, affichait bien une photo.
    const photos = photosDuGroupe(
      ["v1", "v2"],
      [{ vehicule_id: "v2", url: "/b.jpg", ordre: 0 }]
    );
    expect(photos).toEqual([{ url: "/b.jpg" }]);
  });

  it("ordonne par position du véhicule, puis par ordre de la photo", () => {
    const photos = photosDuGroupe(
      ["v1", "v2"],
      [
        { vehicule_id: "v2", url: "/v2-a.jpg", ordre: 0 },
        { vehicule_id: "v1", url: "/v1-b.jpg", ordre: 1 },
        { vehicule_id: "v1", url: "/v1-a.jpg", ordre: 0 },
      ]
    );
    expect(photos.map((p) => p.url)).toEqual(["/v1-a.jpg", "/v1-b.jpg", "/v2-a.jpg"]);
  });

  it("retire les doublons d'URL (même cliché sur deux exemplaires)", () => {
    const photos = photosDuGroupe(
      ["v1", "v2"],
      [
        { vehicule_id: "v1", url: "/same.jpg", ordre: 0 },
        { vehicule_id: "v2", url: "/same.jpg", ordre: 0 },
      ]
    );
    expect(photos).toHaveLength(1);
  });

  it("ignore une photo rattachée à un véhicule hors du groupe", () => {
    const photos = photosDuGroupe(
      ["v1"],
      [{ vehicule_id: "autre", url: "/x.jpg", ordre: 0 }]
    );
    expect(photos).toEqual([]);
  });

  it("tolère null, undefined et un ordre manquant", () => {
    expect(photosDuGroupe(["v1"], null)).toEqual([]);
    expect(photosDuGroupe(["v1"], undefined)).toEqual([]);
    expect(
      photosDuGroupe(["v1"], [{ vehicule_id: "v1", url: "/a.jpg", ordre: null }])
    ).toEqual([{ url: "/a.jpg" }]);
  });
});
