-- Add rejection reason column to users table
alter table public.users add column if not exists motif_rejet text;
