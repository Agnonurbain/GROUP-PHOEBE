-- RLS sur les 10 tables qui en étaient dépourvues.
-- Créée le 2026-07-29.
--
-- Constat : ces tables portaient `GRANT ALL TO anon` (défaut Supabase pour le
-- schéma public) sans RLS ni policy. Toute personne détenant la clé anon —
-- publique par construction, présente dans le bundle navigateur — pouvait les
-- lire ET les modifier. Le plus grave : `audit_log`, dont la piste était
-- effaçable, et `visites`, dont les créneaux clients étaient annulables.
--
-- Principe retenu, table par table :
--   · lecture staff pour les données d'exploitation ;
--   · lecture de sa propre ligne pour ce qui appartient à un utilisateur ;
--   · aucune policy quand seul `service_role` doit écrire (il ignore la RLS).
--
-- Les chemins applicatifs ont été relevés un par un avant d'écrire ces
-- policies : les lectures via la session utilisateur (donc soumises à la RLS)
-- sont `fetchAgents` sur agents_immobiliers, les deux pages véhicule sur
-- chauffeurs, /admin/audit sur audit_log, et les notifications admin sur
-- notifications_log. Tout le reste passe par `service_role`.

-- ── agents_immobiliers ───────────────────────────────────────────────────────
-- Lue par fetchAgents() avec la session : /admin/biens/nouveau et /admin/biens/[id].
-- Ces pages sont accessibles à un agent_immobilier, que is_staff() ne couvre
-- pas — sans le second terme, la liste des agents s'afficherait vide pour lui.
alter table public.agents_immobiliers enable row level security;

create policy "agents_immobiliers_select_staff"
  on public.agents_immobiliers for select
  using (public.is_staff() or public.own_role() = 'agent_immobilier');

create policy "agents_immobiliers_proprietaire_manage"
  on public.agents_immobiliers for all
  using (public.is_proprietaire())
  with check (public.is_proprietaire());

-- ── visites ──────────────────────────────────────────────────────────────────
-- Écrites uniquement par les server actions (service_role). La lecture par le
-- client de ses propres visites est ouverte dès maintenant : elle est correcte
-- sur le fond et l'UI côté client s'y appuiera.
alter table public.visites enable row level security;

create policy "visites_select_own"
  on public.visites for select
  using (
    client_id = auth.uid()
    or public.is_staff()
    or public.own_role() = 'agent_immobilier'
  );

create policy "visites_staff_manage"
  on public.visites for all
  using (public.is_staff())
  with check (public.is_staff());

-- ── audit_log ────────────────────────────────────────────────────────────────
-- Lecture staff (page /admin/audit, session utilisateur). Volontairement
-- AUCUNE policy d'écriture : seul `service_role` insère, via logAudit(). Sans
-- policy insert/update/delete, la piste devient inaltérable depuis l'API REST.
alter table public.audit_log enable row level security;

create policy "audit_log_select_staff"
  on public.audit_log for select
  using (public.is_staff());

-- ── notifications_log ────────────────────────────────────────────────────────
-- Chacun lit et marque comme lues ses propres notifications ; l'écriture
-- initiale revient à service_role (notifierClient, notifieurs admin).
alter table public.notifications_log enable row level security;

create policy "notifications_log_select_own"
  on public.notifications_log for select
  using (user_id = auth.uid());

create policy "notifications_log_update_own"
  on public.notifications_log for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ── chauffeurs ───────────────────────────────────────────────────────────────
-- Lue avec la session par /admin/vehicules/nouveau et /admin/vehicules/[id].
alter table public.chauffeurs enable row level security;

create policy "chauffeurs_select_staff"
  on public.chauffeurs for select
  using (public.is_staff());

create policy "chauffeurs_staff_manage"
  on public.chauffeurs for all
  using (public.is_staff())
  with check (public.is_staff());

-- ── livreurs ─────────────────────────────────────────────────────────────────
alter table public.livreurs enable row level security;

create policy "livreurs_select_staff"
  on public.livreurs for select
  using (public.is_staff());

create policy "livreurs_staff_manage"
  on public.livreurs for all
  using (public.is_staff())
  with check (public.is_staff());

-- ── agences ──────────────────────────────────────────────────────────────────
alter table public.agences enable row level security;

create policy "agences_select_staff"
  on public.agences for select
  using (public.is_staff());

create policy "agences_proprietaire_manage"
  on public.agences for all
  using (public.is_proprietaire())
  with check (public.is_proprietaire());

-- ── conducteurs_secondaires ──────────────────────────────────────────────────
-- Écrite par les server actions (service_role) lors d'une réservation.
alter table public.conducteurs_secondaires enable row level security;

create policy "conducteurs_secondaires_select_staff"
  on public.conducteurs_secondaires for select
  using (public.is_staff());

create policy "conducteurs_secondaires_staff_manage"
  on public.conducteurs_secondaires for all
  using (public.is_staff())
  with check (public.is_staff());

-- ── contrats_recurrents ──────────────────────────────────────────────────────
alter table public.contrats_recurrents enable row level security;

create policy "contrats_recurrents_select_staff"
  on public.contrats_recurrents for select
  using (public.is_staff());

create policy "contrats_recurrents_staff_manage"
  on public.contrats_recurrents for all
  using (public.is_staff())
  with check (public.is_staff());

-- ── webhook_idempotency ──────────────────────────────────────────────────────
-- Table de plomberie des webhooks de paiement : uniquement service_role.
-- RLS activée sans aucune policy = fermée à anon et authenticated. C'est
-- l'intention, pas un oubli : l'anti-rejeu ne doit pas être manipulable.
alter table public.webhook_idempotency enable row level security;
