-- ─────────────────────────────────────────────────────────────────────────────
-- 00074 — Délais du cycle transport, pilotables
--
-- Trois délais vivaient dans `lib/constants.ts`, donc modifiables seulement par
-- un déploiement. Les trois alimentent les crons d'expiration, et l'un d'eux
-- **retient une caution** — un paramètre qui coûte de l'argent au client n'a
-- rien à faire dans une constante de code.
--
-- Le délai de négociation change de valeur au passage. 30 minutes suppose une
-- équipe devant l'écran en permanence : une demande arrivée à 17 h 50 expirait
-- avant que quiconque l'ait vue, et le client recevait un refus qu'il n'avait
-- pas mérité — alors que le véhicule lui était réservé pendant ce temps.
--
-- 4 heures est le compromis retenu : une demande du matin trouve sa réponse le
-- matin, une demande de 16 h survit jusqu'à 20 h, et un véhicule n'est jamais
-- immobilisé plus d'une demi-journée par une demande abandonnée. Ce n'est pas
-- une vérité : c'est un point de départ défendable, que l'écran permet
-- d'ajuster avec de vrais chiffres.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.parametres_transport (
  id boolean primary key default true check (id),

  -- Fenêtre laissée à l'équipe pour répondre à une demande de prix. Le véhicule
  -- est réservé pendant ce temps : l'allonger sécurise la réponse, l'écourter
  -- libère l'actif plus vite.
  delai_negociation_heures numeric(5,2) not null default 4
    check (delai_negociation_heures > 0 and delai_negociation_heures <= 168),

  -- Une demande acceptée que le client ne confirme pas.
  delai_sans_reponse_heures numeric(5,2) not null default 2
    check (delai_sans_reponse_heures > 0 and delai_sans_reponse_heures <= 168),

  -- Retard au retrait au-delà duquel la réservation est annulée ET LA CAUTION
  -- RETENUE. Le plus lourd des trois pour le client : le raccourcir sans
  -- prévenir transformerait un retard ordinaire en pénalité.
  delai_non_presentation_heures numeric(5,2) not null default 4
    check (delai_non_presentation_heures > 0 and delai_non_presentation_heures <= 168),

  updated_at timestamptz not null default now()
);

comment on table public.parametres_transport is
  'Délais du cycle de vie d''une demande de transport, pilotables depuis /admin/tarifs. Bornés à 168 h (une semaine) : au-delà, un véhicule resterait immobilisé si longtemps que l''expiration ne protégerait plus rien.';

comment on column public.parametres_transport.delai_negociation_heures is
  'Fenêtre de réponse à une demande de prix. Le véhicule est réservé pendant ce délai. Valeur d''origine : 30 minutes — trop court pour une équipe qui n''est pas devant l''écran en continu.';

comment on column public.parametres_transport.delai_non_presentation_heures is
  'Retard au retrait au-delà duquel la caution est retenue. Toute modification a une conséquence financière directe pour le client.';

insert into public.parametres_transport (id) values (true) on conflict (id) do nothing;

alter table public.parametres_transport enable row level security;

-- Lecture publique : le délai de négociation est annoncé au client dans le
-- formulaire de demande de prix, il ne peut pas être secret.
create policy "parametres_transport_select_public"
  on public.parametres_transport for select
  using (true);

-- Un délai qui décide d'une rétention de caution engage financièrement :
-- propriétaire seul, comme tout ce qui porte un montant dans ce projet.
create policy "parametres_transport_manage_proprietaire"
  on public.parametres_transport for all
  using (public.is_proprietaire())
  with check (public.is_proprietaire());
