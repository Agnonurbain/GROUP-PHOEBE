"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { sauvegarderGeojson } from "@/app/actions/tarifs";

type Coord = [number, number];

const CI_BOUNDS = { minLng: -8.6, maxLng: -2.5, minLat: 4.3, maxLat: 10.8 };

function projectToCanvas(
  lng: number,
  lat: number,
  width: number,
  height: number
) {
  const x =
    ((lng - CI_BOUNDS.minLng) / (CI_BOUNDS.maxLng - CI_BOUNDS.minLng)) * width;
  const y =
    ((CI_BOUNDS.maxLat - lat) / (CI_BOUNDS.maxLat - CI_BOUNDS.minLat)) * height;
  return { x, y };
}

function drawPolygon(
  ctx: CanvasRenderingContext2D,
  coords: Coord[][],
  width: number,
  height: number,
  color: string
) {
  for (const ring of coords) {
    ctx.beginPath();
    ring.forEach(([lng, lat], i) => {
      const { x, y } = projectToCanvas(lng, lat, width, height);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = color + "40";
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function CanvasPreview({
  geojson,
}: {
  geojson: Record<string, unknown> | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = "#f8f9fa";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 0.5;
    for (let lng = -8; lng <= -3; lng++) {
      const { x } = projectToCanvas(lng, 0, w, h);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let lat = 5; lat <= 10; lat++) {
      const { y } = projectToCanvas(0, lat, w, h);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    if (!geojson) return;

    const color = "#39A044";
    if (geojson.type === "Polygon") {
      drawPolygon(
        ctx,
        geojson.coordinates as Coord[][],
        w,
        h,
        color
      );
    } else if (geojson.type === "MultiPolygon") {
      for (const polygon of geojson.coordinates as Coord[][][]) {
        drawPolygon(ctx, polygon, w, h, color);
      }
    }
  }, [geojson]);

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={260}
      className="rounded-lg border border-phoebe-pearl"
    />
  );
}

export function GeojsonEditor({
  zoneId,
  zoneName,
  initialGeojson,
}: {
  zoneId: string;
  zoneName: string;
  initialGeojson: Record<string, unknown> | null;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(
    initialGeojson ? JSON.stringify(initialGeojson, null, 2) : ""
  );
  const [parsed, setParsed] = useState<Record<string, unknown> | null>(
    initialGeojson
  );
  const [parseError, setParseError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{
    error?: string;
    success?: boolean;
  } | null>(null);

  const validate = useCallback((value: string) => {
    if (!value.trim()) {
      setParsed(null);
      setParseError(null);
      return;
    }
    try {
      const obj = JSON.parse(value);
      if (obj.type !== "Polygon" && obj.type !== "MultiPolygon") {
        setParseError("Le type doit être \"Polygon\" ou \"MultiPolygon\".");
        setParsed(null);
        return;
      }
      if (!Array.isArray(obj.coordinates) || obj.coordinates.length === 0) {
        setParseError("Les coordonnées sont manquantes.");
        setParsed(null);
        return;
      }
      setParsed(obj);
      setParseError(null);
    } catch {
      setParseError("JSON invalide.");
      setParsed(null);
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setResult(null);
    const res = await sauvegarderGeojson(zoneId, parsed);
    setResult(res);
    setSaving(false);
  };

  const handleClear = async () => {
    setSaving(true);
    setResult(null);
    setText("");
    setParsed(null);
    setParseError(null);
    const res = await sauvegarderGeojson(zoneId, null);
    setResult(res);
    setSaving(false);
  };

  const hasGeojson = !!initialGeojson;

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs font-medium text-phoebe-green transition-colors hover:text-phoebe-green-deep"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
          <line x1="8" y1="2" x2="8" y2="18" />
          <line x1="16" y1="6" x2="16" y2="22" />
        </svg>
        {hasGeojson ? "Modifier le polygone" : "Définir le polygone"}
        {hasGeojson && (
          <span className="rounded-full bg-phoebe-green/10 px-1.5 py-0.5 text-[10px] text-phoebe-green-deep">
            défini
          </span>
        )}
      </button>

      {open && (
        <div className="mt-3 space-y-3 rounded-xl border border-phoebe-pearl bg-phoebe-pearl/10 p-4">
          <p className="text-[11px] text-phoebe-anthracite/50">
            Collez un GeoJSON de type Polygon ou MultiPolygon pour la zone «{" "}
            {zoneName} ». Coordonnées en [longitude, latitude].
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                validate(e.target.value);
              }}
              rows={10}
              spellCheck={false}
              placeholder='{"type": "Polygon", "coordinates": [[[lng, lat], ...]]}'
              className="flex-1 rounded-lg border border-phoebe-anthracite/12 bg-white p-3 font-mono text-[11px] text-phoebe-anthracite transition-colors focus:border-phoebe-green focus:outline-none focus:ring-2 focus:ring-phoebe-green/15"
            />

            <div className="flex flex-col items-center gap-2">
              <p className="text-[10px] font-medium uppercase tracking-wider text-phoebe-anthracite/40">
                Aperçu
              </p>
              <CanvasPreview geojson={parsed} />
            </div>
          </div>

          {parseError && (
            <p className="text-xs text-error">{parseError}</p>
          )}

          {result?.error && (
            <p className="text-xs text-error">{result.error}</p>
          )}
          {result?.success && (
            <p className="text-xs text-phoebe-green-deep">
              Polygone enregistré.
            </p>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !!parseError || !text.trim()}
              className="rounded-lg bg-phoebe-green px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-phoebe-green-deep disabled:opacity-40"
            >
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
            {hasGeojson && (
              <button
                onClick={handleClear}
                disabled={saving}
                className="rounded-lg border border-error/30 px-3 py-1.5 text-xs font-medium text-error transition-colors hover:bg-error/10 disabled:opacity-40"
              >
                Supprimer le polygone
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg border border-phoebe-anthracite/15 px-3 py-1.5 text-xs text-phoebe-anthracite/60 transition-colors hover:bg-phoebe-pearl"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
