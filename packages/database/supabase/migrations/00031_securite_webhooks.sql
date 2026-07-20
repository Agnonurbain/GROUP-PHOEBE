-- 1. Idempotency key tracking for webhooks (prevents duplicate processing)
create table if not exists webhook_idempotency (
  idempotency_key text primary key,
  processed_at timestamptz not null default now()
);

-- Auto-clean old entries after 7 days
create index if not exists idx_webhook_idempotency_processed_at
  on webhook_idempotency (processed_at);

-- 2. Spatial index for GeoJSON zone lookups
create index if not exists idx_zones_tarifaires_geojson
  on zones_tarifaires using gin (geojson jsonb_path_ops);
