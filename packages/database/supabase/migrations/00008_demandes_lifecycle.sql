-- 00008: Cycle de vie complet des demandes transport
-- Statut en_cours, état des lieux, expiration 24h, non-présentation, avis RLS

-- 1. Ajouter le statut "en_cours" (véhicule pris en charge, état des lieux départ fait)
do $$
declare
  cname text;
begin
  select conname into cname
    from pg_constraint
    where conrelid = 'demandes_transport'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%statut%'
      and pg_get_constraintdef(oid) not ilike '%statut_verification%';
  if cname is not null then
    execute format('alter table demandes_transport drop constraint %I', cname);
  end if;
end $$;

alter table demandes_transport add constraint demandes_transport_statut_check
  check (statut in (
    'en_attente_paiement', 'en_attente_validation',
    'acceptee', 'en_cours',
    'refusee', 'annulee', 'terminee'
  ));

-- 2. Colonnes état des lieux
alter table demandes_transport
  add column if not exists kilometrage_depart integer,
  add column if not exists kilometrage_retour integer,
  add column if not exists carburant_depart text
    check (carburant_depart in ('vide', 'quart', 'demi', 'trois_quarts', 'plein')),
  add column if not exists carburant_retour text
    check (carburant_retour in ('vide', 'quart', 'demi', 'trois_quarts', 'plein')),
  add column if not exists caution_retenue boolean not null default false;

-- 3. RLS sur avis_transport
alter table avis_transport enable row level security;

create policy "avis_select_public" on avis_transport
  for select using (true);

create policy "avis_insert_client" on avis_transport
  for insert with check (
    exists (
      select 1 from demandes_transport dt
      where dt.id = demande_id
        and dt.client_id = auth.uid()
        and dt.statut = 'terminee'
    )
  );

-- Un seul avis par demande
alter table avis_transport
  add constraint avis_transport_demande_unique unique (demande_id);

-- 4. Fonction d'expiration : non-réponse propriétaire > 24h
create or replace function expirer_demandes_sans_reponse()
returns integer as $$
declare
  nb integer := 0;
  r record;
begin
  for r in
    select dt.id, dt.vehicule_id, dt.chauffeur_id, dt.periode
    from demandes_transport dt
    where dt.statut = 'en_attente_validation'
      and dt.updated_at < now() - interval '24 hours'
    for update skip locked
  loop
    -- Libérer le créneau véhicule
    if r.vehicule_id is not null and r.periode is not null then
      delete from disponibilites_vehicule
        where vehicule_id = r.vehicule_id
          and type = 'reservation'
          and periode = r.periode;
    end if;

    -- Libérer le créneau chauffeur
    if r.chauffeur_id is not null and r.periode is not null then
      delete from disponibilites_chauffeur
        where chauffeur_id = r.chauffeur_id
          and periode = r.periode;
    end if;

    -- Marquer paiement remboursement_requis
    update paiements
      set statut = 'remboursement_requis'
      where reference_table = 'demandes_transport'
        and reference_id = r.id
        and statut = 'capture';

    -- Annuler la demande
    update demandes_transport
      set statut = 'annulee', updated_at = now()
      where id = r.id;

    nb := nb + 1;
  end loop;
  return nb;
end;
$$ language plpgsql security definer;

-- 5. Fonction d'expiration : non-présentation client
-- (acceptée et la date de début de période est dépassée de 4h)
create or replace function expirer_non_presentations()
returns integer as $$
declare
  nb integer := 0;
  r record;
begin
  for r in
    select dt.id, dt.vehicule_id, dt.chauffeur_id, dt.periode, dt.caution
    from demandes_transport dt
    where dt.statut = 'acceptee'
      and dt.periode is not null
      and lower(dt.periode::tstzrange) < now() - interval '4 hours'
    for update skip locked
  loop
    if r.vehicule_id is not null and r.periode is not null then
      delete from disponibilites_vehicule
        where vehicule_id = r.vehicule_id
          and type = 'reservation'
          and periode = r.periode;
    end if;

    if r.chauffeur_id is not null and r.periode is not null then
      delete from disponibilites_chauffeur
        where chauffeur_id = r.chauffeur_id
          and periode = r.periode;
    end if;

    -- Non-présentation : caution retenue, montant remboursé
    -- On marque remboursement_requis — le montant à rembourser = montant (sans caution)
    update paiements
      set statut = 'remboursement_requis'
      where reference_table = 'demandes_transport'
        and reference_id = r.id
        and statut = 'capture';

    update demandes_transport
      set statut = 'annulee',
          caution_retenue = true,
          updated_at = now()
      where id = r.id;

    -- Remettre le véhicule en disponible
    if r.vehicule_id is not null then
      update vehicules set statut = 'disponible', updated_at = now()
        where id = r.vehicule_id and statut = 'reserve';
    end if;

    nb := nb + 1;
  end loop;
  return nb;
end;
$$ language plpgsql security definer;

-- 6. pg_cron (filet de sécurité, comme pour expirer_reservations_abandonnees)
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'expirer-demandes-sans-reponse',
      '*/15 * * * *',
      'select expirer_demandes_sans_reponse()'
    );
    perform cron.schedule(
      'expirer-non-presentations',
      '*/30 * * * *',
      'select expirer_non_presentations()'
    );
  end if;
end $$;
