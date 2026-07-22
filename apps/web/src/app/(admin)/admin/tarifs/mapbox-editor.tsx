"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import type { Map as MapType } from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import { sauvegarderGeojson } from "@/app/actions/tarifs";
import { Button } from "@/components/ui";

const CI_BOUNDS: [[number, number], [number, number]] = [
  [-8.6, 4.3],
  [-2.5, 10.8],
];

const GOLD = "#D38C37";

export function MapboxEditor({
  zoneId,
  zoneName,
  initialGeojson,
}: {
  zoneId: string;
  zoneName: string;
  initialGeojson: Record<string, unknown> | null;
}) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapType | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ error?: string; success?: boolean } | null>(null);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const initMap = useCallback(async () => {
    if (mapRef.current || !mapContainer.current || !token) return;

    await import("mapbox-gl/dist/mapbox-gl.css");
    const [{ default: mapboxgl }, { default: DrawCtor }] = await Promise.all([
      import("mapbox-gl"),
      import("@mapbox/mapbox-gl-draw"),
    ]);

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      bounds: CI_BOUNDS,
      fitBoundsOptions: { padding: 40 },
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    const draw = new DrawCtor({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true,
      },
      defaultMode: "draw_polygon",
      styles: [
        {
          id: "gl-draw-polygon-fill",
          type: "fill",
          filter: ["all", ["==", "$type", "Polygon"]],
          paint: {
            "fill-color": GOLD,
            "fill-outline-color": GOLD,
            "fill-opacity": 0.2,
          },
        },
        {
          id: "gl-draw-polygon-stroke-active",
          type: "line",
          filter: ["all", ["==", "$type", "Polygon"]],
          paint: {
            "line-color": GOLD,
            "line-width": 3,
            "line-dasharray": [6, 4],
            "line-opacity": 1,
          },
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
        },
        {
          id: "gl-draw-polygon-stroke-glow",
          type: "line",
          filter: ["all", ["==", "$type", "Polygon"]],
          paint: {
            "line-color": GOLD,
            "line-width": 8,
            "line-dasharray": [6, 4],
            "line-opacity": 0.3,
            "line-blur": 4,
          },
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
        },
        {
          id: "gl-draw-rectangle-fill",
          type: "fill",
          filter: ["all", ["==", "$type", "Polygon"]],
          paint: {
            "fill-color": GOLD,
            "fill-outline-color": GOLD,
            "fill-opacity": 0.15,
          },
        },
        {
          id: "gl-draw-circle-fill",
          type: "fill",
          filter: ["all", ["==", "$type", "Polygon"]],
          paint: {
            "fill-color": GOLD,
            "fill-outline-color": GOLD,
            "fill-opacity": 0.15,
          },
        },
        {
          id: "gl-draw-polygon-midpoint",
          type: "circle",
          filter: ["all", ["==", "$type", "Point"]],
          paint: {
            "circle-radius": 5,
            "circle-color": GOLD,
            "circle-opacity": 0.6,
          },
        },
      ],
    });

    map.addControl(draw, "top-left");

    map.on("load", () => {
      if (initialGeojson) {
        draw.set(initialGeojson as unknown as GeoJSON.FeatureCollection);
      }
      setLoaded(true);
    });

    mapRef.current = map;
    drawRef.current = draw;
  }, [token, initialGeojson]);

  useEffect(() => {
    if (open && !mapRef.current) {
      initMap();
    }
    return () => {
      if (!open && mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        drawRef.current = null;
        setLoaded(false);
      }
    };
  }, [open, initMap]);

  const handleSave = async () => {
    if (!drawRef.current) return;
    setSaving(true);
    setResult(null);
    const geojson = drawRef.current.getAll();
    if (!geojson.features?.length) {
      setResult({ error: "Dessinez au moins un polygone." });
      setSaving(false);
      return;
    }
    const feature = geojson.features[0];
    const res = await sauvegarderGeojson(zoneId, feature.geometry as unknown as Record<string, unknown>);
    setResult(res);
    setSaving(false);
  };

  const handleClear = async () => {
    if (!drawRef.current) return;
    drawRef.current.deleteAll();
    setSaving(true);
    setResult(null);
    const res = await sauvegarderGeojson(zoneId, null);
    setResult(res);
    setSaving(false);
  };

  const hasGeojson = !!initialGeojson;

  return (
    <div>
      <Button
        variant="admin-ghost"
        onClick={() => setOpen(!open)}
        className="border-0 text-phoebe-green hover:text-phoebe-green-deep"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      </Button>

      {open && (
        <div className="mt-3 space-y-3 rounded-xl border border-phoebe-pearl bg-phoebe-pearl/10 p-4">
          {!token ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
              <p className="text-sm font-medium text-amber-800">
                Clé Mapbox manquante
              </p>
              <p className="mt-1 text-xs text-amber-700">
                Définissez <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_MAPBOX_TOKEN</code> dans votre <code className="rounded bg-amber-100 px-1">.env.local</code>.
              </p>
            </div>
          ) : (
            <>
              <p className="text-[11px] text-phoebe-anthracite/50">
                Dessinez un polygone sur la carte pour définir la zone « {zoneName} ».
                Utilisez les outils en haut à gauche pour tracer ou supprimer.
              </p>

              <div
                ref={mapContainer}
                className="h-[400px] w-full overflow-hidden rounded-xl border border-phoebe-pearl"
              />

              {result?.error && <p className="text-xs text-error">{result.error}</p>}
              {result?.success && <p className="text-xs text-phoebe-green-deep">Polygone enregistré.</p>}

              <div className="flex gap-2">
                <Button
                  variant="admin"
                  size="sm"
                  onClick={handleSave}
                  disabled={saving || !loaded}
                >
                  {saving ? "Enregistrement…" : "Enregistrer"}
                </Button>
                {(hasGeojson || loaded) && (
                  <Button
                    variant="admin-ghost"
                    size="sm"
                    onClick={handleClear}
                    disabled={saving}
                    className="border-error/30 text-error hover:bg-error/10"
                  >
                    Supprimer le polygone
                  </Button>
                )}
                <Button variant="admin-ghost" size="sm" onClick={() => setOpen(false)}>
                  Fermer
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
