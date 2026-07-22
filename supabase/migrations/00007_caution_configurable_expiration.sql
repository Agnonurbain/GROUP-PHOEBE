-- 00007: Caution configurable, expiration, remboursement tardif

-- Statut remboursement_requis : paiement encaissé mais demande déjà expirée
-- (webhook arrivé après le délai d'expiration de 30 min).
-- L'inline CHECK de 00001 génère un nom automatique — on le supprime par lookup.
do $$
declare
  cname text;
begin
  select conname into cname
    from pg_constraint
    where conrelid = 'paiements'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%statut%';
  if cname is not null then
    execute format('alter table paiements drop constraint %I', cname);
  end if;
end $$;
alter table paiements add constraint paiements_statut_check
  check (statut in ('en_attente', 'capture', 'echoue', 'rembourse', 'remboursement_requis'));

-- Caution configurable : null = utilise le défaut global (30%)
alter table vehicules
  add column if not exists taux_caution numeric(3,2)
  check (taux_caution > 0 and taux_caution < 1);

comment on column vehicules.taux_caution is
  'Taux de caution (0.01–0.99). NULL = défaut global 0.30.';

-- Fonction d'expiration côté Postgres.
-- Le nettoyage primaire est applicatif (appelé avant chaque réservation
-- et chaque vérification de disponibilité). Cette fonction + pg_cron
-- sont un filet de sécurité supplémentaire pour les périodes orphelines
-- quand aucun utilisateur ne déclenche d'action.
create or replace function expirer_reservations_abandonnees()
returns integer as $$
declare
  nb integer := 0;
  r record;
begin
  for r in
    select
      dt.id,
      dt.vehicule_id,
      dt.chauffeur_id,
      dt.periode
    from demandes_transport dt
    where dt.statut = 'en_attente_paiement'
      and dt.created_at < now() - interval '30 minutes'
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

    update paiements
      set statut = 'echoue'
      where reference_table = 'demandes_transport'
        and reference_id = r.id
        and statut = 'en_attente';

    update demandes_transport
      set statut = 'annulee',
          updated_at = now()
      where id = r.id;

    nb := nb + 1;
  end loop;

  return nb;
end;
$$ language plpgsql security definer;

-- pg_cron (filet de sécurité, pas la ligne de défense principale).
-- Si pg_cron n'est pas activé, ce bloc est un no-op silencieux —
-- le nettoyage applicatif couvre seul le cas.
-- Pour activer pg_cron sur Supabase : Dashboard → Database → Extensions.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'expirer-reservations-abandonnees',
      '*/5 * * * *',
      'select expirer_reservations_abandonnees()'
    );
    raise notice 'pg_cron: job expirer-reservations-abandonnees planifié toutes les 5 minutes.';
  else
    raise notice 'pg_cron non activé — le nettoyage applicatif est la seule ligne de défense. Activer pg_cron via Dashboard → Database → Extensions pour un filet de sécurité supplémentaire.';
  end if;
end $$;
