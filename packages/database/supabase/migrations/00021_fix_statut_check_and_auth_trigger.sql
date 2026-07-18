-- Fix 1: Restore 'en_cours' in statut CHECK constraint (dropped by 00020)
alter table demandes_transport drop constraint if exists demandes_transport_statut_check;
alter table demandes_transport add constraint demandes_transport_statut_check
  check (statut in (
    'en_attente_paiement', 'en_attente_validation', 'acceptee',
    'en_cours', 'refusee', 'annulee', 'terminee', 'en_negociation'
  ));

-- Fix 2: Lock role to 'client' in auth trigger (00012 re-introduced role injection)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  delete from public.users where email = new.email and id != new.id;

  insert into public.users (id, role, nom, telephone, email, date_naissance)
  values (
    new.id,
    'client',
    coalesce(
      new.raw_user_meta_data->>'nom',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      ''
    ),
    case
      when new.phone is not null and new.phone != '' then new.phone
      else null
    end,
    new.email,
    case
      when new.raw_user_meta_data->>'date_naissance' is not null
      then (new.raw_user_meta_data->>'date_naissance')::date
      else null
    end
  )
  on conflict (id) do update set
    nom = excluded.nom,
    email = excluded.email,
    telephone = coalesce(excluded.telephone, public.users.telephone);
  return new;
end;
$$ language plpgsql security definer;
