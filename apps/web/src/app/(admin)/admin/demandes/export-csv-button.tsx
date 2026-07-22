"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

type Demande = {
  id: string;
  statut: string;
  type: string;
  montant: number | null;
  caution: number | null;
  caution_retenue: number;
  destination: string | null;
  ville_depart: string | null;
  created_at: string;
  client: string;
  vehicule: string;
};

export function ExportCsvButton({ demandes }: { demandes: Demande[] }) {
  const [exporting, setExporting] = useState(false);

  function handleExport() {
    setExporting(true);
    const headers = [
      "ID",
      "Statut",
      "Type",
      "Client",
      "Véhicule",
      "Départ",
      "Destination",
      "Montant (FCFA)",
      "Caution (FCFA)",
      "Caution retenue",
      "Date",
    ];

    const rows = demandes.map((d) => [
      d.id.slice(0, 8),
      d.statut,
      d.type,
      d.client,
      d.vehicule,
      d.ville_depart ?? "",
      d.destination ?? "",
      d.montant ?? "",
      d.caution ?? "",
      d.caution_retenue,
      new Date(d.created_at).toLocaleDateString("fr-FR"),
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";")
      )
      .join("\n");

    const bom = "﻿";
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `demandes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  }

  return (
    <Button
      variant="admin-ghost"
      size="sm"
      onClick={handleExport}
      disabled={exporting || demandes.length === 0}
    >
      Exporter CSV
    </Button>
  );
}
