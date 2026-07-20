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

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.sub)
    .single();

  if (!profile || !["operateur", "proprietaire"].includes(profile.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { data: demande } = await supabase
    .from("demandes_transport")
    .select("*, vehicules(marque, modele), users!demandes_transport_client_id_fkey(nom, telephone)")
    .eq("id", demandeId)
    .single();

  if (!demande) {
    return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
  }

  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const page = pdf.addPage([595, 842]); // A4
  const { height } = page.getSize();
  let y = height - 50;

  const green = rgb(57 / 255, 160 / 255, 68 / 255);
  const dark = rgb(34 / 255, 40 / 255, 43 / 255);
  const gray = rgb(0.45, 0.45, 0.45);

  function drawText(text: string, x: number, opts?: { bold?: boolean; size?: number; color?: typeof green }) {
    page.drawText(text, {
      x,
      y,
      size: opts?.size ?? 11,
      font: opts?.bold ? fontBold : font,
      color: opts?.color ?? dark,
    });
  }

  // Header
  drawText("GROUP PHOEBE", 50, { bold: true, size: 18, color: green });
  y -= 20;
  drawText("État des lieux", 50, { bold: true, size: 14 });
  y -= 8;
  page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 1, color: green });
  y -= 25;

  // Vehicle info
  const v = demande.vehicules as { marque: string; modele: string } | null;
  const client = demande.users as { nom: string; telephone: string | null } | null;

  drawText("Véhicule :", 50, { bold: true });
  drawText(v ? `${v.marque} ${v.modele}` : "—", 150);
  y -= 18;

  drawText("Client :", 50, { bold: true });
  drawText(client?.nom ?? "—", 150);
  if (client?.telephone) {
    drawText(`Tél: ${client.telephone}`, 350);
  }
  y -= 18;

  drawText("Réf. demande :", 50, { bold: true });
  drawText(demandeId.slice(0, 8) + "…", 150, { color: gray });
  y -= 18;

  if (demande.periode) {
    const parts = demande.periode.replace(/[\[\]()]/g, "").split(",");
    const d0 = new Date(parts[0]?.trim());
    const d1 = new Date(parts[1]?.trim());
    const fmt = (d: Date) => d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
    drawText("Période :", 50, { bold: true });
    drawText(`${fmt(d0)} → ${fmt(d1)}`, 150);
    y -= 18;
  }

  if (demande.destination) {
    drawText("Destination :", 50, { bold: true });
    drawText(demande.destination, 150);
    y -= 18;
  }

  y -= 15;

  // Départ
  if (demande.kilometrage_depart != null) {
    page.drawRectangle({ x: 50, y: y - 5, width: 495, height: 22, color: rgb(0.95, 0.98, 0.95) });
    drawText("DÉPART", 55, { bold: true, size: 12, color: green });
    y -= 25;

    drawText("Kilométrage :", 70, { bold: true });
    drawText(`${Number(demande.kilometrage_depart).toLocaleString("fr-FR")} km`, 180);
    y -= 18;

    drawText("Carburant :", 70, { bold: true });
    drawText((demande.carburant_depart ?? "—").replace("_", " "), 180);
    y -= 18;

    if (demande.etat_lieux_depart_photos?.length) {
      drawText(`Photos : ${demande.etat_lieux_depart_photos.length} fichier(s) joint(s)`, 70, { color: gray });
      y -= 18;
    }

    y -= 10;
    drawText("Signature client : ________________________", 70, { color: gray });
    y -= 18;
    drawText("Signature opérateur : ________________________", 70, { color: gray });
    y -= 25;
  }

  // Retour
  if (demande.kilometrage_retour != null) {
    page.drawRectangle({ x: 50, y: y - 5, width: 495, height: 22, color: rgb(0.95, 0.95, 0.98) });
    drawText("RETOUR", 55, { bold: true, size: 12, color: rgb(0.3, 0.3, 0.7) });
    y -= 25;

    drawText("Kilométrage :", 70, { bold: true });
    drawText(`${Number(demande.kilometrage_retour).toLocaleString("fr-FR")} km`, 180);
    y -= 18;

    const kmDepart = Number(demande.kilometrage_depart ?? 0);
    const kmRetour = Number(demande.kilometrage_retour);
    const kmParcourus = kmRetour - kmDepart;
    if (kmParcourus > 0) {
      drawText("Km parcourus :", 70, { bold: true });
      drawText(`${kmParcourus.toLocaleString("fr-FR")} km`, 180);
      y -= 18;
    }

    drawText("Carburant :", 70, { bold: true });
    drawText((demande.carburant_retour ?? "—").replace("_", " "), 180);
    y -= 18;

    if (demande.etat_lieux_retour_photos?.length) {
      drawText(`Photos : ${demande.etat_lieux_retour_photos.length} fichier(s) joint(s)`, 70, { color: gray });
      y -= 18;
    }

    const cautionRetenue = Number(demande.caution_retenue ?? 0);
    if (cautionRetenue > 0) {
      drawText("Caution retenue :", 70, { bold: true });
      drawText(`${cautionRetenue.toLocaleString("fr-FR")} FCFA`, 180, { color: rgb(0.8, 0.2, 0.2) });
      y -= 18;
    }

    y -= 10;
    drawText("Signature client : ________________________", 70, { color: gray });
    y -= 18;
    drawText("Signature opérateur : ________________________", 70, { color: gray });
    y -= 25;
  }

  // Financial summary
  y -= 10;
  page.drawLine({ start: { x: 50, y: y + 5 }, end: { x: 545, y: y + 5 }, thickness: 0.5, color: gray });
  y -= 10;

  const montant = Number(demande.montant ?? 0);
  const caution = Number(demande.caution ?? 0);
  const cautionRetenue = Number(demande.caution_retenue ?? 0);

  drawText("Montant location :", 50, { bold: true });
  drawText(`${montant.toLocaleString("fr-FR")} FCFA`, 200);
  y -= 18;

  drawText("Caution versée :", 50, { bold: true });
  drawText(`${caution.toLocaleString("fr-FR")} FCFA`, 200);
  y -= 18;

  drawText("Caution retenue :", 50, { bold: true });
  drawText(`${cautionRetenue.toLocaleString("fr-FR")} FCFA`, 200);
  y -= 18;

  drawText("Caution à rembourser :", 50, { bold: true });
  drawText(`${(caution - cautionRetenue).toLocaleString("fr-FR")} FCFA`, 200, { color: green });
  y -= 30;

  // Footer
  const now = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
  drawText(`Document généré le ${now}`, 50, { size: 8, color: gray });
  y -= 12;
  drawText("GROUP PHOEBE — Location et vente de véhicules premium", 50, { size: 8, color: gray });

  const pdfBytes = await pdf.save();

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="etat-lieux-${demandeId.slice(0, 8)}.pdf"`,
    },
  });
}
