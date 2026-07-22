-- Add CGV acceptance column to demandes_transport
ALTER TABLE demandes_transport ADD COLUMN IF NOT EXISTS accepte_cgv boolean NOT NULL DEFAULT false;
