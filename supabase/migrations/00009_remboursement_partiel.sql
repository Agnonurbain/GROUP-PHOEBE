-- 00009: Ajouter le statut remboursement_partiel aux paiements
-- Cas d'usage : caution remboursée (remboursement partiel Stripe), montant location conservé

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
  check (statut in ('en_attente', 'capture', 'echoue', 'rembourse', 'remboursement_requis', 'remboursement_partiel'));
