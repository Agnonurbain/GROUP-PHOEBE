-- Add etat (neuf/occasion) column to vehicules for purchase flow
ALTER TABLE public.vehicules
  ADD COLUMN etat text NOT NULL DEFAULT 'occasion'
  CHECK (etat IN ('neuf', 'occasion'));
