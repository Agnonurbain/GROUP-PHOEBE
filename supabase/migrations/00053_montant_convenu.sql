-- Le montant convenu devient un fait daté, plus un champ modifiable.
-- Créée le 2026-07-29.
--
-- Jusqu'ici, le prix sur lequel client et propriétaire s'étaient accordés vivait
-- dans `montant_contre_offre`, qui restait modifiable après l'acceptation. Un
-- UPDATE plus tard, la seule trace de l'accord disait autre chose, sans que rien
-- ne signale le changement. C'est un problème de preuve, indépendant de toute
-- pièce écrite : le registre des transactions s'appuie sur ce montant.
--
-- Deux mesures :
--   1. `montant_convenu` reçoit une copie du montant à l'acceptation ;
--   2. le trigger existant refuse toute écriture des montants dès lors que la
--      demande était déjà acceptée ou finalisée — pour TOUS les rôles, y compris
--      `service_role`. C'est le seul moyen que le gel en soit un : les server
--      actions écrivent avec la clé de service.

alter table public.demandes_immobilier
  add column if not exists montant_convenu numeric(14,2);

comment on column public.demandes_immobilier.montant_convenu is
  'Prix arrete a l''acceptation. Fige des que le statut passe a acceptee (cf. trigger garde_montants).';

alter table public.demandes_immobilier
  drop constraint if exists demandes_immobilier_montant_convenu_positif;

alter table public.demandes_immobilier
  add constraint demandes_immobilier_montant_convenu_positif
  check (montant_convenu is null or montant_convenu > 0);

-- ── Le trigger gagne le gel, en amont de la garde par rôle ──────────────────
create or replace function public.garde_montants_demandes_immobilier()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  montant_modifie boolean;
begin
  -- 1. Gel. La comparaison porte sur OLD.statut, pas NEW : l'UPDATE qui fait
  -- passer la demande à « acceptee » doit pouvoir écrire montant_convenu dans le
  -- même mouvement. Ce sont les écritures SUIVANTES qui sont refusées.
  if tg_op = 'UPDATE' and old.statut in ('acceptee', 'finalisee') then
    if new.montant_offre is distinct from old.montant_offre
       or new.montant_contre_offre is distinct from old.montant_contre_offre
       or new.montant_convenu is distinct from old.montant_convenu then
      raise exception
        'Les montants d''une demande % ne sont plus modifiables', old.statut
        using errcode = '42501';
    end if;
  end if;

  -- 2. Garde par rôle, inchangée : elle ne vise que les rôles PostgREST de bout
  -- de chaîne. Cf. 00047 pour le raisonnement (security invoker compris).
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    montant_modifie := new.montant_offre is not null
                    or new.montant_contre_offre is not null
                    or new.montant_convenu is not null;
  else
    montant_modifie := new.montant_offre is distinct from old.montant_offre
                    or new.montant_contre_offre is distinct from old.montant_contre_offre
                    or new.montant_convenu is distinct from old.montant_convenu;
  end if;

  if montant_modifie and not public.is_proprietaire() then
    raise exception
      'Seul le proprietaire peut ecrire un montant sur demandes_immobilier'
      using errcode = '42501';
  end if;

  return new;
end;
$$;
