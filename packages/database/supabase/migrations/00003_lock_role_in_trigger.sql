-- Correction sécurité : le trigger ne doit jamais lire le rôle depuis
-- raw_user_meta_data, sinon un appel direct à signUp() pourrait injecter
-- un rôle arbitraire. Le rôle est toujours 'client' à la création ;
-- les comptes internes sont promus via une UPDATE séparée (service role).

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, role, nom, telephone, date_naissance)
  values (
    new.id,
    'client',
    coalesce(new.raw_user_meta_data->>'nom', ''),
    coalesce(new.phone, ''),
    case
      when new.raw_user_meta_data->>'date_naissance' is not null
      then (new.raw_user_meta_data->>'date_naissance')::date
      else null
    end
  );
  return new;
end;
$$ language plpgsql security definer;
