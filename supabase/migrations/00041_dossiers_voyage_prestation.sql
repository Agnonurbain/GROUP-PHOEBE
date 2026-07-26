-- GROUP PHOEBE — Assistance : prestation & montant estimé sur les dossiers visa
-- Jusqu'ici, la prestation choisie (visa étude / tourisme / affaires) et le
-- montant estimé n'étaient portés que par la notification push admin. On les
-- persiste sur le dossier pour que l'équipe retrouve l'info et facture juste.

alter table public.dossiers_voyage
  add column if not exists prestation text,
  add column if not exists montant_estime numeric(14,2);
