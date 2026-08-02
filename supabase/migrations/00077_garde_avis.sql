-- ─────────────────────────────────────────────────────────────────────────────
-- 00077 — Un avis ne se dépose que sur SA prestation, et une fois terminée
--
-- La policy d'insertion des avis annonçait « sur une réservation terminée le
-- concernant ». Elle vérifiait en réalité deux choses seulement : que
-- `client_id` vaut `auth.uid()`, et que ce compte a le rôle client. Ni que la
-- prestation appartient à ce client, ni qu'elle est terminée.
--
-- Comme `avis` porte un `unique (reference_table, reference_id)`, la
-- conséquence dépassait le faux avis : le PREMIER à écrire sur un identifiant
-- occupe la place définitivement. N'importe quel client pouvait donc noter la
-- prestation d'un autre, ou simplement empêcher le vrai client de s'exprimer.
--
-- Le paramètre `delai_apres_terme_jours` (00059) décrivait une fenêtre que
-- personne n'appliquait. Il devient la règle.
--
-- ─── Ce que « terminée » veut dire, service par service ──────────────────────
--
-- Les cinq services ne finissent pas de la même façon, et le point de départ du
-- délai est le plus tardif entre la fin réelle du service et le moment où il a
-- été marqué terminé. Sinon une clôture tardive de notre part rognerait la
-- fenêtre du client — on lui ferait payer notre propre retard, comme le ferait
-- un décompte calendaire sur un retrait en agence fermée.
--
--   • demandes_transport  statut « terminee »   fin = upper(periode)
--   • demandes_immobilier statut « finalisee »  fin = updated_at
--   • dossiers_voyage     statut « finalise »   fin = updated_at
--   • demandes_billet     statut « emise »      fin = updated_at
--   • expeditions         statut « livree »     fin = livree_at
--
-- Pour le billet, l'avis porte sur NOTRE service — trouver et émettre le
-- billet — pas sur le vol. La fin est donc l'émission, pas le départ : sinon un
-- vol dans six mois interdirait tout avis pendant six mois.
-- ─────────────────────────────────────────────────────────────────────────────

-- Renvoie NULL quand l'avis est autorisé, sinon un code de refus. Un seul
-- endroit décide : la policy s'en sert pour trancher, l'application pour
-- expliquer. Deux implémentations divergeraient tôt ou tard.
create or replace function public.avis_refus_motif(
  p_reference_table text,
  p_reference_id uuid
)
returns text
language plpgsql
security definer
set search_path = ''
stable
as $$
declare
  v_client uuid;
  v_statut text;
  v_fin timestamptz;
  v_delai int;
begin
  if auth.uid() is null then
    return 'non_connecte';
  end if;

  -- `greatest` avec un NULL renvoie l'autre opérande : une prestation sans date
  -- de fin métier retombe donc naturellement sur `updated_at`.
  if p_reference_table = 'demandes_transport' then
    select client_id, statut, greatest(upper(periode), updated_at)
      into v_client, v_statut, v_fin
      from public.demandes_transport where id = p_reference_id;
    if v_statut is distinct from 'terminee' then v_statut := null; end if;

  elsif p_reference_table = 'demandes_immobilier' then
    select client_id, statut, updated_at
      into v_client, v_statut, v_fin
      from public.demandes_immobilier where id = p_reference_id;
    if v_statut is distinct from 'finalisee' then v_statut := null; end if;

  elsif p_reference_table = 'dossiers_voyage' then
    select client_id, statut, updated_at
      into v_client, v_statut, v_fin
      from public.dossiers_voyage where id = p_reference_id;
    if v_statut is distinct from 'finalise' then v_statut := null; end if;

  elsif p_reference_table = 'demandes_billet' then
    select client_id, statut, updated_at
      into v_client, v_statut, v_fin
      from public.demandes_billet where id = p_reference_id;
    if v_statut is distinct from 'emise' then v_statut := null; end if;

  elsif p_reference_table = 'expeditions' then
    select client_id, statut, greatest(livree_at, updated_at)
      into v_client, v_statut, v_fin
      from public.expeditions where id = p_reference_id;
    if v_statut is distinct from 'livree' then v_statut := null; end if;

  else
    return 'service_inconnu';
  end if;

  -- Introuvable et « pas la vôtre » renvoient le même code : distinguer les
  -- deux dirait à un curieux quels identifiants existent.
  if v_client is null or v_client <> auth.uid() then
    return 'introuvable';
  end if;

  if v_statut is null then
    return 'non_terminee';
  end if;

  select delai_apres_terme_jours into v_delai from public.parametres_avis where id;
  -- Paramètre illisible : on n'invente pas de fenêtre, mais on n'ouvre pas non
  -- plus en grand — 30 jours est la valeur d'origine de la colonne.
  v_delai := coalesce(v_delai, 30);

  if v_fin is null or now() > v_fin + make_interval(days => v_delai) then
    return 'delai_depasse';
  end if;

  return null;
end;
$$;

comment on function public.avis_refus_motif(text, uuid) is
  'NULL si le client connecté peut déposer un avis sur cette prestation, sinon le code du refus : non_connecte, service_inconnu, introuvable, non_terminee, delai_depasse. Source unique de la règle — la policy RLS et l''application s''y réfèrent toutes deux.';

-- La garde est ici, pas dans le code applicatif : `soumettreAvis` insère avec
-- le client de l'utilisateur, donc la policy s'applique réellement. L'écran ne
-- fait que traduire le motif en phrase.
drop policy if exists "avis_insert_client" on public.avis;
create policy "avis_insert_client" on public.avis for insert
  with check (
    client_id = auth.uid()
    and exists (
      select 1 from public.users
      where id = auth.uid() and role = 'client'
    )
    and public.avis_refus_motif(reference_table, reference_id) is null
  );

-- `moderation_obligatoire` disparaît. La colonne décrivait le comportement sans
-- pouvoir le changer — un avis naît « en_attente » et la policy de lecture
-- publique ne montre que « publie ». La passer à faux n'aurait rien fait, et la
-- brancher aurait offert un interrupteur pour publier sans relecture : ce n'est
-- pas un réglage qu'on veut à portée de main. `delai_apres_terme_jours`, lui,
-- sert enfin à quelque chose.
alter table public.parametres_avis drop column if exists moderation_obligatoire;

comment on table public.parametres_avis is
  'Paramétrage du module avis. Singleton : une seule ligne, id = true. La modération n''est pas optionnelle : elle tient à la policy de lecture publique, qui ne montre que les avis publiés.';
