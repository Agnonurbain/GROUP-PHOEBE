"use client";

import { useState } from "react";
import { mettreAJourPositionGps } from "@/app/actions/vehicules";

type Props = {
  vehiculeId: string;
  latitude: number | null;
  longitude: number | null;
};

export function GpsCapture({ vehiculeId, latitude, longitude }: Props) {
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [lat, setLat] = useState(latitude);
  const [lng, setLng] = useState(longitude);

  async function handleCapture() {
    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas disponible sur ce navigateur.");
      return;
    }

    setCapturing(true);
    setError(null);
    setSuccess(false);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const newLat = pos.coords.latitude;
        const newLng = pos.coords.longitude;
        setLat(newLat);
        setLng(newLng);

        const result = await mettreAJourPositionGps(vehiculeId, newLat, newLng);
        if (result.error) {
          setError(result.error);
        } else {
          setSuccess(true);
          setTimeout(() => setSuccess(false), 3000);
        }
        setCapturing(false);
      },
      (err) => {
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Permission de géolocalisation refusée."
            : err.code === err.TIMEOUT
              ? "La demande de position a expiré."
              : "Impossible d'obtenir la position."
        );
        setCapturing(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-phoebe-anthracite">
            Position GPS
          </p>
          {lat != null && lng != null ? (
            <p className="mt-0.5 text-xs text-phoebe-anthracite/70 font-mono">
              {lat.toFixed(6)}, {lng.toFixed(6)}
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-phoebe-anthracite/70">
              Aucune position enregistrée
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={handleCapture}
          disabled={capturing}
          className="shrink-0 rounded-xl bg-phoebe-green px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-phoebe-green-deep hover:shadow-md disabled:opacity-50"
        >
          {capturing ? "Capture..." : "Capturer la position"}
        </button>
      </div>

      {error && (
        <p className="text-xs text-error">{error}</p>
      )}
      {success && (
        <p className="text-xs text-phoebe-green">Position mise à jour</p>
      )}
    </div>
  );
}
