-- ─────────────────────────────────────────────────────────────────────────────
-- 00082 — Écrire à l'équipe au sujet d'un dossier
--
-- « Au cas où ils veulent avoir plus de renseignements, il faut qu'il y ait
--   l'option écrire à l'équipe. » (v3)
--
-- Un client qui a soumis un dossier n'avait aucun moyen de poser une question
-- dessus. Le formulaire de contact général existe, mais il ne sait pas de quel
-- dossier on parle : l'équipe recevait « j'ai une question sur mon visa » sans
-- rien pour le raccrocher.
--
-- ─── Pourquoi les deux sens ──────────────────────────────────────────────────
-- Le retour ne demande que le sens client → équipe. Mais une question sans
-- canal de réponse est un cul-de-sac : l'équipe lirait dans le back-office et
-- répondrait par téléphone, hors de toute trace. La table porte donc l'auteur,
-- ce qui suffit à faire un fil dans les deux sens — et le client retrouve ce
-- qu'on lui a répondu la semaine dernière.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.messages_dossier (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.dossiers_voyage(id) on delete cascade,
  auteur_id uuid not null references public.users(id) on delete cascade,

  -- Qui parle, figé à l'écriture. Le déduire du rôle courant afficherait
  -- « équipe » sur un ancien message si le client devenait opérateur un jour.
  auteur_role text not null check (auteur_role in ('client', 'equipe')),

  message text not null check (length(trim(message)) between 1 and 4000),

  created_at timestamptz not null default now()
);

create index if not exists messages_dossier_fil
  on public.messages_dossier (dossier_id, created_at);

comment on table public.messages_dossier is
  'Fil de discussion attaché à un dossier d''assistance. Le client pose sa question, l''équipe répond — et la réponse reste consultable, contrairement à un appel.';

comment on column public.messages_dossier.auteur_role is
  'Figé à l''écriture : déduire du rôle courant réétiquetterait les anciens messages si la personne changeait de rôle.';

alter table public.messages_dossier enable row level security;

-- Le client lit le fil de SES dossiers ; le staff lit tout.
create policy "messages_dossier_select"
  on public.messages_dossier for select
  using (
    public.is_staff()
    or exists (
      select 1 from public.dossiers_voyage
      where id = dossier_id and client_id = auth.uid()
    )
  );

-- On n'écrit qu'en son propre nom, et le client seulement sur son dossier.
create policy "messages_dossier_insert"
  on public.messages_dossier for insert
  with check (
    auteur_id = auth.uid()
    and (
      (auteur_role = 'equipe' and public.is_staff())
      or (
        auteur_role = 'client'
        and exists (
          select 1 from public.dossiers_voyage
          where id = dossier_id and client_id = auth.uid()
        )
      )
    )
  );

-- Un message envoyé ne se réécrit pas : c'est une trace, pas un brouillon.
-- Aucune policy UPDATE ni DELETE — le staff passe par la clé de service si une
-- suppression devient nécessaire, et cela laisse une trace dans l'audit.
