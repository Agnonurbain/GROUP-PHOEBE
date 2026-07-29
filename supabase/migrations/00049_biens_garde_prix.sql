-- `biens.prix` : écriture réservée au propriétaire, garde en base.
-- Créée le 2026-07-29.
--
-- Même trou que celui fermé en 00047 pour les montants de demandes_immobilier,
-- sur le champ le plus exposé du module : `biens_staff_manage` est
-- `for all using (is_staff())`, donc un opérateur pouvait modifier le prix
-- affiché d'un bien par un simple PATCH REST avec la clé anon. Côté
-- application, `creerBien`/`modifierBien` l'autorisaient également.
--
-- Répartition identique à 00047 :
--   · service_role (server actions) → garde applicative (CHAMPS_PRIX +
--     requireProprietaireAvecId, verrouillés par prix-proprietaire.test.ts)
--   · anon / authenticated (REST direct) → le trigger ci-dessous
--
-- SECURITY INVOKER volontaire : en security definer, `current_user` vaudrait le
-- propriétaire de la fonction et la garde bloquerait aussi les server actions.
create or replace function public.garde_prix_biens()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  if tg_op = 'INSERT' or new.prix is distinct from old.prix then
    if not public.is_proprietaire() then
      raise exception 'Seul le proprietaire peut fixer le prix d''un bien'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists garde_prix on public.biens;

create trigger garde_prix
  before insert or update on public.biens
  for each row
  execute function public.garde_prix_biens();
