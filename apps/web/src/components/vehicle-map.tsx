"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export function VehicleMap({
  latitude,
  longitude,
  localisation,
}: {
  latitude: number;
  longitude: number;
  localisation: string | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (ref.current && !mapRef.current) {
      const map = L.map(ref.current, {
        center: [latitude, longitude],
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      L.marker([latitude, longitude])
        .addTo(map)
        .bindPopup(localisation ?? "Véhicule");

      mapRef.current = map;
    }

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude, localisation]);

  return (
    <div className="overflow-hidden rounded-2xl border border-phoebe-pearl bg-white shadow-sm">
      <div className="p-5 pb-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/40">
          Localisation
        </h2>
        {localisation && (
          <p className="mt-1 text-sm text-phoebe-anthracite/70">{localisation}</p>
        )}
      </div>
      <div ref={ref} className="h-64 w-full" />
    </div>
  );
}
