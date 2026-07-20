import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function GET(request: NextRequest) {
  const demandeId = request.nextUrl.searchParams.get("id");
  if (!demandeId) {
    return NextResponse.json({ error: "id requis" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { data: demande } = await supabase
    .from("demandes_transport")
    .select("*, vehicules!demandes_transport_vehicule_id_fkey(marque, modele, immatriculation, annee), users!demandes_transport_client_id_fkey(nom, telephone, email)")
    .eq("id", demandeId)
    .single();

  if (!demande) {
    return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
  }

  if (demande.client_id !== user.sub) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.sub)
      .single();
    if (!profile || !["operateur", "proprietaire"].includes(profile.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
  }

  const v = demande.vehicules as Record<string, unknown> | null;
  const client = demande.users as { nom: string; telephone: string | null; email: string | null } | null;

  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const page = pdf.addPage([595, 842]);
  const { height, width } = page.getSize();
  let y = height - 50;

  const green = rgb(57 / 255, 160 / 255, 68 / 255);
  const dark = rgb(34 / 255, 40 / 255, 43 / 255);
  const gray = rgb(0.45, 0.45, 0.45);
  const gold = rgb(193 / 255, 140 / 255, 55 / 255);

  function t(text: string, x: number, opts?: { bold?: boolean; size?: number; color?: typeof dark }) {
    page.drawText(text, {
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

  // Header
  t("GROUP PHOEBE", 50, { bold: true, size: 20, color: green });
  t("CONTRAT DE LOCATION", 50, { bold: true, size: 14, color: gold });
  y -= 6;
  t(`Réf: ${demandeId.slice(0, 8).toUpperCase()}`, 50, { size: 9, color: gray });
  y -= 8;
  page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 2, color: green });
  y -= 30;

  // Parties
  t("ENTRE LES SOUSSIGNÉS :", 50, { bold: true, size: 12, color: gold });
  y -= 22;
  t("Le loueur : GROUP PHOEBE SARL", 60, { bold: true, size: 10 });
  y -= 16;
  t("Abidjan, Côte d'Ivoire", 60, { size: 10, color: gray });
  y -= 16;
  t("Tél: +225 07 78 63 19 83", 60, { size: 10, color: gray });
  y -= 24;

  t("Le client :", 60, { bold: true, size: 10 });
  y -= 16;
  t(client?.nom ?? "—", 80, { size: 10 });
  y -= 16;
  if (client?.telephone) t(`Tél: ${client.telephone}`, 80, { size: 10, color: gray });
  y -= 16;
  if (client?.email) t(`Email: ${client.email}`, 80, { size: 10, color: gray });
  y -= 26;
  line();

  // Vehicle info
  t("VÉHICULE", 50, { bold: true, size: 12, color: gold });
  y -= 22;
  t("Modèle :", 60, { bold: true, size: 10 });
  t(v ? `${v.marque} ${v.modele}` : "—", 150, { size: 10 });
  y -= 18;
  t("Immatriculation :", 60, { bold: true, size: 10 });
  t(v?.immatriculation ? String(v.immatriculation) : "—", 150, { size: 10 });
  y -= 18;
  t("Année :", 60, { bold: true, size: 10 });
  t(v?.annee ? String(v.annee) : "—", 150, { size: 10 });
  y -= 26;
  line();

  // Period
  if (demande.periode) {
    t("PÉRIODE DE LOCATION", 50, { bold: true, size: 12, color: gold });
    y -= 22;
    const parts = demande.periode.replace(/[\[\]()]/g, "").split(",");
    const d0 = new Date(parts[0]?.trim());
    const d1 = new Date(parts[1]?.trim());
    const fmt = (d: Date) => d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
    t("Du :", 60, { bold: true, size: 10 });
    t(fmt(d0), 150, { size: 10 });
    y -= 18;
    t("Au :", 60, { bold: true, size: 10 });
    t(fmt(d1), 150, { size: 10 });
    y -= 18;
    const nbJours = Math.max(1, Math.ceil((d1.getTime() - d0.getTime()) / (1000 * 60 * 60 * 24)));
    t("Durée :", 60, { bold: true, size: 10 });
    t(`${nbJours} jour${nbJours > 1 ? "s" : ""}`, 150, { size: 10 });
    y -= 26;
    line();
  }

  // Destination
  if (demande.destination) {
    t("DESTINATION", 50, { bold: true, size: 12, color: gold });
    y -= 22;
    t("Départ :", 60, { bold: true, size: 10 });
    t(demande.ville_depart ?? "—", 150, { size: 10 });
    y -= 18;
    t("Destination :", 60, { bold: true, size: 10 });
    t(demande.destination, 150, { size: 10 });
    y -= 26;
    line();
  }

  // Financial
  t("CONDITIONS FINANCIÈRES", 50, { bold: true, size: 12, color: gold });
  y -= 22;
  const montant = Number(demande.montant ?? 0);
  const caution = Number(demande.caution ?? 0);

  t("Montant de la location :", 60, { bold: true, size: 10 });
  t(`${montant.toLocaleString("fr-FR")} FCFA`, 250, { size: 10, color: green });
  y -= 18;
  t("Dépôt de garantie (caution) :", 60, { bold: true, size: 10 });
  t(`${caution.toLocaleString("fr-FR")} FCFA`, 250, { size: 10 });
  y -= 18;

  if (demande.avec_chauffeur) {
    t("Avec chauffeur :", 60, { bold: true, size: 10 });
    t("Oui", 250, { size: 10, color: green });
    y -= 18;
  }

  const methode = demande.methode_paiement === "cinetpay" ? "Mobile Money (CinetPay)" : "Carte bancaire (Stripe)";
  t("Mode de paiement :", 60, { bold: true, size: 10 });
  t(methode, 250, { size: 10, color: gray });
  y -= 30;

  // Signature area
  page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 1, color: rgb(0.9, 0.9, 0.9) });
  y -= 20;
  t("Fait à Abidjan, le", 50, { size: 10, color: gray });
  t(new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }), 170, { size: 10, color: dark });
  y -= 30;
  t("Signature du client", 50, { size: 10, color: gray });
  t("Signature du loueur", 350, { size: 10, color: gray });
  y -= 50;
  t("________________________", 50, { size: 10, color: gray });
  t("________________________", 350, { size: 10, color: gray });

  // Footer
  y = 40;
  t("GROUP PHOEBE — Location et vente de véhicules premium", 50, { size: 8, color: gray });
  t("Abidjan, Côte d'Ivoire | +225 07 78 63 19 83", 50, { size: 8, color: gray });

  const pdfBytes = await pdf.save();

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="contrat-${demandeId.slice(0, 8)}.pdf"`,
    },
  });
}
