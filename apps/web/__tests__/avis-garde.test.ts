import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Un avis ne se dépose que sur SA prestation, terminée, et dans la fenêtre.
 *
 * La policy d'insertion annonçait « sur une réservation terminée le
 * concernant » et ne vérifiait ni l'un ni l'autre. Comme `avis` porte un
 * `unique (reference_table, reference_id)`, la conséquence dépassait le faux
 * avis : le premier à écrire sur un identifiant occupait la place, donc
 * n'importe quel client pouvait empêcher le vrai client de s'exprimer.
 *
 * Ces tests lisent le SQL et le source. Ils cassent si la garde est relâchée.
 */

const src = (p: string) => readFileSync(join(process.cwd(), "src", p), "utf8");
const DOSSIER_MIGRATIONS = join(process.cwd(), "..", "..", "supabase", "migrations");
const migration = (nom: string) => readFileSync(join(DOSSIER_MIGRATIONS, nom), "utf8");

/**
 * La DERNIÈRE migration qui définit la fonction, pas une migration nommée.
 *
 * Le test citait `00077_garde_avis.sql`. Quand 00089 a redéfini la fonction
 * pour y ajouter le textile, il continuait de passer en lisant une version
 * dépassée : il aurait laissé retirer un service de la vraie fonction sans
 * rien dire. Un test qui vise un fichier plutôt que l'état courant vieillit
 * en silence.
 */
function derniereMigrationContenant(motif: RegExp, quoi: string): string {
  const fichier = readdirSync(DOSSIER_MIGRATIONS)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .reverse()
    .find((f) => motif.test(migration(f)));
  if (!fichier) throw new Error(`Aucune migration ne définit ${quoi}`);
  return migration(fichier);
}

/** La fonction telle qu'elle est aujourd'hui — 00077 à l'origine, 00089 depuis. */
const SQL = derniereMigrationContenant(
  /create or replace function public\.avis_refus_motif/,
  "avis_refus_motif"
);

/** La policy d'insertion, où qu'elle ait été redéfinie en dernier. */
const SQL_POLICY = derniereMigrationContenant(
  /create policy "avis_insert_client"/,
  'la policy "avis_insert_client"'
);

/**
 * Les services que l'espace client affiche, lus dans la page elle-même.
 *
 * C'est le lien qui manquait : le bouton « Donner mon avis » s'affiche sur
 * toute ligne terminée, quel que soit son service. Un service ajouté à cette
 * page sans l'être à la garde offre donc un bouton qui ne peut pas aboutir —
 * c'est exactement ce qui est arrivé au textile entre 00087 et 00089.
 */
function servicesDeLEspaceClient(): string[] {
  const page = src("app/(public)/compte/reservations/page.tsx");
  return [...new Set(
    [...page.matchAll(/referenceTable:\s*"([a-z_]+)"/g)].map((m) => m[1])
  )];
}

describe("Avis — la garde à l'insertion", () => {
  it("la policy appelle la règle au lieu de la réécrire", () => {
    const debut = SQL_POLICY.indexOf('create policy "avis_insert_client"');
    expect(debut).toBeGreaterThan(-1);
    const corps = SQL_POLICY.slice(debut, SQL_POLICY.indexOf(";", debut));
    expect(corps).toContain("public.avis_refus_motif(reference_table, reference_id) is null");
    // L'ancienne policy se contentait de ces deux lignes : elles restent
    // nécessaires, elles ne sont plus suffisantes.
    expect(corps).toContain("client_id = auth.uid()");
  });

  /**
   * La liste attendue n'est pas écrite ici : elle est LUE dans l'espace client.
   * Un sixième service ajouté à la page sans l'être à la garde casse ce test,
   * au lieu d'offrir au client un bouton qui refuse.
   */
  it("la fonction couvre tout service affiché au client, et rejette les autres", () => {
    const services = servicesDeLEspaceClient();
    expect(services.length).toBeGreaterThanOrEqual(6);
    for (const table of services) {
      expect(SQL, `${table} n'est pas couvert par avis_refus_motif`)
        .toContain(`p_reference_table = '${table}'`);
    }
    // Une table hors liste ne doit pas tomber dans un cas par défaut permissif.
    expect(SQL).toContain("return 'service_inconnu'");
  });

  it("chaque service exige son propre statut terminal", () => {
    for (const [table, statut] of [
      ["demandes_transport", "terminee"],
      ["demandes_immobilier", "finalisee"],
      ["dossiers_voyage", "finalise"],
      ["demandes_billet", "emise"],
      ["expeditions", "livree"],
      // Le pagne se juge une fois reçu : une commande confirmée n'est encore
      // qu'une promesse.
      ["demandes_textile", "livree"],
    ]) {
      expect(SQL, `${table} → ${statut}`).toContain(`v_statut is distinct from '${statut}'`);
    }
  });

  it("la propriété de la prestation est vérifiée", () => {
    expect(SQL).toContain("v_client <> auth.uid()");
    expect(SQL).toContain("return 'introuvable'");
  });

  /**
   * Le même raisonnement que pour les heures ouvrées : le client ne doit pas
   * payer notre lenteur. Si une prestation est marquée terminée trois semaines
   * après sa fin réelle, la fenêtre part de la clôture, pas de la fin.
   */
  it("la fenêtre part du plus tardif entre fin réelle et clôture", () => {
    expect(SQL).toContain("greatest(upper(periode), updated_at)");
    expect(SQL).toContain("greatest(livree_at, updated_at)");
  });

  it("la fenêtre vient du paramètre, pas d'une constante", () => {
    expect(SQL).toContain("delai_apres_terme_jours");
    expect(SQL).toContain("make_interval(days => v_delai)");
    // Paramètre illisible : on retombe sur la valeur d'origine plutôt que
    // d'ouvrir la fenêtre en grand.
    expect(SQL).toContain("coalesce(v_delai, 30)");
  });

  // En `security definer` avec un search_path vide : la fonction doit lire les
  // tables des demandes malgré la RLS, sans être détournable par un schéma
  // interposé.
  it("la fonction est isolée comme les autres gardes du dépôt", () => {
    expect(SQL).toContain("security definer");
    expect(SQL).toContain("set search_path = ''");
  });
});

describe("Avis — ce que l'application en fait", () => {
  const action = src("app/actions/avis.ts");

  it("l'action explique le refus au lieu de laisser fuiter l'erreur RLS", () => {
    expect(action).toContain("avis_refus_motif");
    expect(action).toContain("MESSAGES_REFUS");
    for (const motif of ["non_terminee", "delai_depasse", "introuvable", "service_inconnu"]) {
      expect(action, motif).toContain(motif);
    }
  });

  // Distinguer « n'existe pas » de « pas la vôtre » dirait à un curieux quels
  // identifiants existent.
  it("« introuvable » ne distingue pas l'inexistant du non-possédé", () => {
    const debut = SQL.indexOf("v_client is null or v_client <> auth.uid()");
    expect(debut).toBeGreaterThan(-1);
    expect(SQL.slice(debut, debut + 120)).toContain("'introuvable'");
  });

  it("la garde reste en base, l'action ne fait que traduire", () => {
    // Si l'action passait au client de service, la policy ne s'appliquerait
    // plus et ce contrôle deviendrait décoratif.
    expect(action).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(action).toContain('from("avis").insert');
  });
});

describe("Avis — le paramétrage", () => {
  it("moderation_obligatoire est retiré", () => {
    // La colonne décrivait le comportement sans pouvoir le changer, et la
    // brancher aurait offert un interrupteur pour publier sans relecture.
    expect(migration("00077_garde_avis.sql")).toContain(
      "drop column if exists moderation_obligatoire"
    );
    expect(src("app/actions/avis.ts")).not.toContain("moderation_obligatoire");
  });

  it("la modération tient à la policy de lecture, pas à un réglage", () => {
    const avis59 = migration("00059_avis_factures_blog_i18n.sql");
    expect(avis59).toContain("avis_select_public");
    expect(avis59).toContain("statut = 'publie'");
  });
});

describe("Agences — dormante par intention", () => {
  // Sans trace écrite, un audit reproposera sa suppression à chaque passage.
  it("l'intention de conserver la table est enregistrée en base", () => {
    const sql = migration("00078_agences_intention.sql");
    expect(sql).toContain("comment on table public.agences");
    expect(sql.toLowerCase()).toContain("ne pas supprimer");
  });
});
