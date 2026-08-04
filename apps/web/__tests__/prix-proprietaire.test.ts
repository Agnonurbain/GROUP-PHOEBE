import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Garde-fou : toute action qui écrit un montant facturé doit être réservée au
// propriétaire. Un opérateur passe par le workflow de proposition de prix.
// Ce test lit le source — il casse si quelqu'un relâche une garde.

const src = (p: string) => readFileSync(join(process.cwd(), "src", p), "utf8");

function corpsDeFonction(source: string, nom: string): string {
  const debut = source.indexOf(`export async function ${nom}`);
  if (debut === -1) throw new Error(`Fonction introuvable : ${nom}`);
  const suivante = source.indexOf("\nexport ", debut + 1);
  return source.slice(debut, suivante === -1 ? undefined : suivante);
}

describe("les prix ne sont modifiables que par le propriétaire", () => {
  it("ajusterPrixExpedition exige le propriétaire", () => {
    const corps = corpsDeFonction(src("app/actions/livraison.ts"), "ajusterPrixExpedition");
    expect(corps).toContain("requireProprietaire()");
    expect(corps).not.toContain("await requireStaff()");
  });

  it.each([
    "creerMoyenLivraison",
    "modifierMoyenLivraison",
    "modifierTarifAssistance",
    "modifierParametresContact",
  ])("%s exige le propriétaire", (nom) => {
    const corps = corpsDeFonction(src("app/actions/tarifs.ts"), nom);
    expect(corps).toContain("requireProprietaireAvecId()");
  });

  it.each([
    "proposerContreOffre",
    "modifierParametresImmobilier",
  ])("%s exige le propriétaire", (nom) => {
    const corps = corpsDeFonction(src("app/actions/immobilier.ts"), nom);
    expect(corps).toContain("requireProprietaireAvecId()");
    expect(corps).not.toContain("await requireStaff()");
  });

  it("le statut contre_offre n'est pas atteignable par le sélecteur générique", () => {
    // Sinon un opérateur poserait le statut sans montant : le client verrait
    // une contre-offre vide.
    const corps = corpsDeFonction(src("app/actions/immobilier.ts"), "changerStatutDemandeImmobilier");
    expect(corps).toContain('statut === "contre_offre"');
  });

  it("la garde base sur les montants immobiliers existe", () => {
    const migration = readFileSync(
      join(process.cwd(), "..", "..", "supabase", "migrations", "00047_contre_offre_garde_montants.sql"),
      "utf8"
    );
    // La policy staff_manage laisse un opérateur écrire via l'API REST : le
    // trigger est le seul rempart sur ce chemin.
    expect(migration).toContain("create trigger garde_montants");
    expect(migration).toContain("public.is_proprietaire()");

    // La garde ne cible que les rôles PostgREST de bout de chaîne, et doit
    // rester en security invoker : en security definer, `current_user` vaudrait
    // le propriétaire de la fonction et la garde bloquerait tous les chemins,
    // server actions incluses.
    const debut = migration.indexOf("function public.garde_montants_demandes_immobilier()");
    const corpsTrigger = migration.slice(debut, migration.indexOf("$$;", debut));
    expect(corpsTrigger).toContain("current_user not in ('anon', 'authenticated')");
    expect(corpsTrigger).not.toContain("security definer");
  });

  it("creerBien exige le propriétaire (biens.prix est NOT NULL)", () => {
    const corps = corpsDeFonction(src("app/actions/biens.ts"), "creerBien");
    expect(corps).toContain("requireProprietaireAvecId()");
  });

  it("modifierBien retire le prix pour un opérateur", () => {
    const corps = corpsDeFonction(src("app/actions/biens.ts"), "modifierBien");
    expect(corps).toContain("retirerChampsPrix");
    expect(corps).toContain('estProprietaire = role === "proprietaire"');
    // Le prix ne doit pas être exigé d'un opérateur : il ne le soumet pas.
    expect(corps).toContain("avecPrix: estProprietaire");
  });

  it("la garde base sur le prix des biens existe", () => {
    const migration = readFileSync(
      join(process.cwd(), "..", "..", "supabase", "migrations", "00049_biens_garde_prix.sql"),
      "utf8"
    );
    expect(migration).toContain("create trigger garde_prix");
    expect(migration).toContain("public.is_proprietaire()");
    expect(migration).toContain("current_user not in ('anon', 'authenticated')");
    const debut = migration.indexOf("function public.garde_prix_biens()");
    expect(migration.slice(debut, migration.indexOf("$$;", debut))).not.toContain("security definer");
  });

  it("proposerDevisBillet exige le propriétaire", () => {
    // Chiffrer un billet écrit un montant facturé : même règle que partout.
    const corps = corpsDeFonction(src("app/actions/billets.ts"), "proposerDevisBillet");
    expect(corps).toContain("requireProprietaireAvecId()");
  });

  /**
   * L'atelier de propositions est la porte de service du prix : un opérateur y
   * dépose une valeur que le propriétaire applique. Approuver automatiquement
   * sous un seuil rouvrait la porte principale — l'opérateur écrivait le prix
   * lui-même, avec le client service_role, donc sans RLS pour l'arrêter.
   *
   * Et l'écart se mesurait à chaque fois depuis la valeur COURANTE : quelques
   * propositions toutes sous le seuil doublaient le tarif sans qu'aucune ne le
   * franchisse. Le propriétaire n'en était pas averti, la notification n'étant
   * envoyée que lorsque le seuil était dépassé.
   */
  it.each([
    ["propositions.ts", "proposerPrix"],
    ["propositions-zones.ts", "proposerModificationZone"],
  ])("%s n'approuve rien automatiquement", (fichier, nom) => {
    const corps = corpsDeFonction(src(`app/actions/${fichier}`), nom);
    expect(corps).not.toContain("autoApprouve");
    expect(corps).not.toContain("SEUIL_APPROBATION_AUTO_PCT");
    // Poser « acceptee » à l'insertion revient au même par un autre chemin.
    expect(corps).not.toContain('statut: "acceptee"');
  });

  it("le seuil d'approbation automatique n'existe plus", () => {
    expect(src("lib/constants.ts")).not.toContain("SEUIL_APPROBATION_AUTO_PCT");
  });

  it("les champs tarifaires du véhicule sont retirés pour un opérateur", () => {
    const source = src("app/actions/vehicules.ts");
    // Le filtre existe et couvre tous les champs monétaires.
    for (const champ of [
      "prix_journalier",
      "prix_mensuel",
      "prix_vente",
      "taux_caution",
      "caution_base_fcfa",
    ]) {
      expect(source).toContain(`"${champ}"`);
    }
    expect(source).toContain("retirerChampsPrix");
    // Création comme modification passent par le filtre.
    expect(source).toContain('role === "proprietaire" ? rows : rows.map(retirerChampsPrix)');
    expect(source).toContain('role === "proprietaire" ? updateData : retirerChampsPrix(updateData)');
  });
});
