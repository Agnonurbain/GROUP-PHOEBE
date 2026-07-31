import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { createClient } from "@supabase/supabase-js";
import type { Database } from "@group-phoebe/database/types";

type AdminClient = ReturnType<typeof createClient<Database>>;
type Paiement = Database["public"]["Tables"]["paiements"]["Row"];

// Un paiement ne porte pas son client : il pointe une demande (transport,
// immobilier, billet, expédition, dossier voyage) et c'est elle qui le porte.
// Les cinq tables référencées ont toutes une colonne `client_id`.
// `factures.client_id` étant NOT NULL, sans cette résolution l'insert échoue —
// silencieusement, puisque l'appelant avale l'erreur pour ne pas faire échouer
// la confirmation du paiement.
const TABLES_AVEC_CLIENT = [
  "demandes_transport",
  "demandes_immobilier",
  "demandes_billet",
  "expeditions",
  "dossiers_voyage",
] as const;

type TableAvecClient = (typeof TABLES_AVEC_CLIENT)[number];

function porteUnClient(table: string): table is TableAvecClient {
  return (TABLES_AVEC_CLIENT as readonly string[]).includes(table);
}

// Les polices standard de pdf-lib encodent en WinAnsi : un caractère hors de ce
// jeu fait échouer `drawText`, donc toute la facture. Deux sources en
// produisent — `toLocaleString("fr-FR")`, qui sépare les milliers par une espace
// fine insécable (U+202F), et les noms clients, qui contiennent ce qu'ils
// veulent. Le montant est donc formaté à la main, et le reste est ramené au jeu
// encodable plutôt que de laisser une facture entière tomber sur un caractère.
const REMPLACEMENTS: Record<string, string> = {
  " ": " ", // espace fine insécable
  " ": " ", // espace insécable
  " ": " ", // espace fine
  "‘": "'",
  "’": "'",
  "“": '"',
  "”": '"',
};

const SPECIAUX_WINANSI = new Set("€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ");

function enWinAnsi(text: string): string {
  return [...text.normalize("NFC")]
    .map((c) => REMPLACEMENTS[c] ?? c)
    .map((c) => {
      const p = c.codePointAt(0)!;
      const ok =
        (p >= 0x20 && p <= 0x7e) ||
        (p >= 0xa0 && p <= 0xff) ||
        SPECIAUX_WINANSI.has(c);
      return ok ? c : "?";
    })
    .join("");
}

// « 100 000,00 » sans passer par toLocaleString, dont le séparateur dépend de
// la version d'ICU et n'est pas encodable en WinAnsi.
function formatMontant(n: number): string {
  const [entier, decimales = "00"] = n.toFixed(2).split(".");
  return `${entier.replace(/\B(?=(\d{3})+(?!\d))/g, " ")},${decimales}`;
}

async function resoudreClientId(
  admin: AdminClient,
  paiement: Paiement
): Promise<string | null> {
  if (!porteUnClient(paiement.reference_table)) return null;

  const { data } = await admin
    .from(paiement.reference_table)
    .select("client_id")
    .eq("id", paiement.reference_id)
    .single();

  return data?.client_id ?? null;
}

export async function genererEtStockerFacture(
  admin: AdminClient,
  paiement: Paiement
) {
  // Un webhook rejoué ne doit ni produire une seconde facture ni consommer un
  // numéro : la vérification passe avant la réservation.
  const { data: existante } = await admin
    .from("factures")
    .select("id")
    .eq("paiement_id", paiement.id)
    .maybeSingle();

  if (existante) return;

  const clientId = await resoudreClientId(admin, paiement);
  if (!clientId) {
    throw new Error(
      `Facture impossible : client introuvable pour ` +
      `${paiement.reference_table}/${paiement.reference_id}`
    );
  }

  const { data: numero, error: numeroError } = await admin.rpc(
    "prochain_numero_facture"
  );
  if (numeroError) throw numeroError;
  if (!numero) throw new Error("Numéro de facture indisponible.");

  const { data: client } = await admin
    .from("users")
    .select("nom, telephone, email")
    .eq("id", clientId)
    .single();

  const { data: params } = await admin
    .from("parametres_facturation")
    .select("taux_tva")
    .single();

  const tauxTva = params?.taux_tva ?? 18;
  const montantTtc = paiement.montant;
  const montantHt = Math.round((montantTtc / (1 + tauxTva / 100)) * 100) / 100;

  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const page = pdf.addPage([595, 842]);
  const { height } = page.getSize();
  let y = height - 50;

  const green = rgb(57 / 255, 160 / 255, 68 / 255);
  const dark = rgb(34 / 255, 40 / 255, 43 / 255);
  const gray = rgb(0.45, 0.45, 0.45);
  const gold = rgb(193 / 255, 140 / 255, 55 / 255);

  function t(text: string, x: number, opts?: { bold?: boolean; size?: number; color?: typeof dark }) {
    page.drawText(enWinAnsi(text), {
      x,
      y,
      size: opts?.size ?? 11,
      font: opts?.bold ? fontBold : font,
      color: opts?.color ?? dark,
    });
  }

  function line() {
    y -= 4;
    page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 1, color: rgb(0.9, 0.9, 0.9) });
    y -= 12;
  }

  t("GROUP PHOEBE", 50, { bold: true, size: 20, color: green });
  t("FACTURE", 50, { bold: true, size: 14, color: gold });
  y -= 6;
  t(`N° ${numero}`, 50, { size: 9, color: gray });
  y -= 8;
  page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 2, color: green });
  y -= 30;

  const today = new Date();
  t(`Date : ${today.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}`, 50, { size: 10, color: gray });
  y -= 26;
  line();

  t("CLIENT", 50, { bold: true, size: 12, color: gold });
  y -= 22;
  t(`Nom : ${client?.nom ?? "—"}`, 60, { size: 10 });
  y -= 16;
  if (client?.telephone) t(`Tél : ${client.telephone}`, 60, { size: 10, color: gray });
  y -= 16;
  if (client?.email) t(`Email : ${client.email}`, 60, { size: 10, color: gray });
  y -= 26;
  line();

  t("DÉTAILS DE LA FACTURE", 50, { bold: true, size: 12, color: gold });
  y -= 22;

  t("Montant HT :", 60, { bold: true, size: 10 });
  t(`${formatMontant(montantHt)} FCFA`, 250, { size: 10 });
  y -= 18;

  t(`TVA (${tauxTva}%) :`, 60, { bold: true, size: 10 });
  t(`${formatMontant(montantTtc - montantHt)} FCFA`, 250, { size: 10 });
  y -= 18;

  t("Montant TTC :", 60, { bold: true, size: 10 });
  t(`${formatMontant(montantTtc)} FCFA`, 250, { size: 10, color: green });
  y -= 26;
  line();

  t("MOYEN DE PAIEMENT", 50, { bold: true, size: 12, color: gold });
  y -= 22;

  const methodeLabel =
    paiement.methode === "cinetpay" ? "Mobile Money (CinetPay)"
    : paiement.methode === "stripe" ? "Carte bancaire (Stripe)"
    : paiement.methode === "virement" ? "Virement bancaire"
    : paiement.methode === "agence" ? "Paiement en agence"
    : paiement.methode;

  t(methodeLabel, 60, { size: 10, color: gray });
  y -= 30;

  page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 1, color: rgb(0.9, 0.9, 0.9) });
  y -= 20;

  y = 40;
  // Neutre : la même facture sert le transport, la livraison, l'immobilier et
  // l'assistance. « Location et vente de véhicules » s'imprimait sur la facture
  // d'un billet d'avion.
  t("GROUP PHOEBE — Transport, Livraison, Immobilier, Assistance Voyages", 50, { size: 8, color: gray });
  t("Abidjan, Côte d'Ivoire | +225 07 78 63 19 83", 50, { size: 8, color: gray });

  const pdfBytes = await pdf.save();

  const fileName = `${numero}.pdf`;
  const { error: uploadError } = await admin.storage
    .from("factures")
    .upload(fileName, pdfBytes, { contentType: "application/pdf", upsert: true });

  if (uploadError) throw uploadError;

  // Le bucket est privé : on garde le chemin, l'URL est signée à la demande.
  const { error: insertError } = await admin
    .from("factures")
    .insert({
      paiement_id: paiement.id,
      numero,
      reference_table: paiement.reference_table,
      reference_id: paiement.reference_id,
      client_id: clientId,
      montant_ht: montantHt,
      taux_tva: tauxTva,
      montant_ttc: montantTtc,
      pdf_chemin: fileName,
    });

  if (insertError) throw insertError;
}
