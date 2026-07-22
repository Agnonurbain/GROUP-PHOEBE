-- Add GeoJSON polygon column to zones_tarifaires
ALTER TABLE zones_tarifaires
  ADD COLUMN IF NOT EXISTS geojson jsonb;

COMMENT ON COLUMN zones_tarifaires.geojson IS 'GeoJSON Polygon/MultiPolygon defining the zone boundary';
