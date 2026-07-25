-- GROUP PHOEBE — Livraison Phase 3
-- RLS sur expeditions + expedition_statut_historique, et journalisation
-- automatique de l'historique des statuts (pour le suivi public).

-- ============================================================
-- 1. Historique automatique des statuts
-- ============================================================
-- Enregistre une ligne à la création de l'expédition (statut initial) puis à
-- chaque changement de statut. Fonctionne aussi pour les écritures service-role.

create or replace function public.log_expedition_statut()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (tg_op = 'INSERT') then
    insert into public.expedition_statut_historique (expedition_id, statut)
    values (new.id, new.statut);
  elsif (tg_op = 'UPDATE' and new.statut is distinct from old.statut) then
    insert into public.expedition_statut_historique (expedition_id, statut)
    values (new.id, new.statut);
  end if;
  return new;
end;
$$;

drop trigger if exists expedition_statut_log on public.expeditions;
create trigger expedition_statut_log
  after insert or update on public.expeditions
  for each row execute function public.log_expedition_statut();

-- ============================================================
-- 2. RLS — expeditions
-- ============================================================
alter table public.expeditions enable row level security;

-- Le client lit ses propres expéditions (Mes commandes).
create policy "expeditions_select_own"
  on public.expeditions for select
  using (client_id = auth.uid());

-- Le staff lit et gère toutes les expéditions.
create policy "expeditions_select_staff"
  on public.expeditions for select
  using (public.is_staff());

create policy "expeditions_manage_staff"
  on public.expeditions for all
  using (public.is_staff())
  with check (public.is_staff());

-- ============================================================
-- 3. RLS — expedition_statut_historique
-- ============================================================
alter table public.expedition_statut_historique enable row level security;

-- Le client lit l'historique de ses propres expéditions.
create policy "exp_hist_select_own"
  on public.expedition_statut_historique for select
  using (
    exists (
      select 1 from public.expeditions e
      where e.id = expedition_id
        and e.client_id = auth.uid()
    )
  );

-- Le staff lit tout l'historique.
create policy "exp_hist_select_staff"
  on public.expedition_statut_historique for select
  using (public.is_staff());
