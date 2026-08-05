-- ─────────────────────────────────────────────────────────────────────────────
-- 00089 — Le textile entre dans la garde des avis
--
-- `avis_refus_motif` (00077) énumère les services un par un et répond
-- `service_inconnu` pour tout le reste. Le textile est né en 00087, après elle :
-- une commande de pagne livrée affichait donc « Donner mon avis » à son client,
-- et l'insertion était refusée par la policy — un bouton qui ne pouvait pas
-- aboutir.
--
-- Un `else` qui refuse est le bon choix : ajouter un service ne doit pas ouvrir
-- silencieusement les avis sur une table qui n'a ni `client_id` ni statut
-- terminal. Le prix à payer est cette migration, et c'est le bon prix — mais
-- elle ne devait pas se faire attendre.
-- ─────────────────────────────────────────────────────────────────────────────

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

  -- Nouveau (00089). Le pagne se juge une fois reçu : `livree`, pas `confirmee`.
  -- Une commande confirmée n'est encore qu'une promesse.
  elsif p_reference_table = 'demandes_textile' then
    select client_id, statut, updated_at
      into v_client, v_statut, v_fin
      from public.demandes_textile where id = p_reference_id;
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
  'NULL si le client connecté peut déposer un avis sur cette prestation, sinon le code du refus : non_connecte, service_inconnu, introuvable, non_terminee, delai_depasse. Source unique de la règle — la policy RLS et l''application s''y réfèrent toutes deux. Six services couverts depuis 00089 (textile inclus).';
