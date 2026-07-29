-- Contre-offre immobilière : statut dédié + garde base sur les montants.
-- Créée le 2026-07-29.
--
-- Pourquoi une garde en base alors que les server actions verrouillent déjà
-- l'écriture des montants au propriétaire : la policy
-- `demandes_immobilier_staff_manage` est `for all using (is_staff())`, donc au
-- niveau base un opérateur peut écrire n'importe quelle colonne de la table —
-- montant_offre inclus — en appelant directement l'API REST avec la clé anon,
-- qui est publique (présente dans le bundle navigateur). Le garde-fou
-- applicatif ne protège que ceux qui passent par les server actions.
--
-- Répartition des responsabilités après cette migration :
--   · chemin service_role (server actions)  → garde applicative
--     (requireProprietaireAvecId + prix-proprietaire.test.ts)
--   · chemin anon/authenticated (REST direct) → le trigger ci-dessous
--
-- Le trigger ne s'applique qu'aux rôles anon/authenticated : sans cela il
-- bloquerait les server actions elles-mêmes, qui écrivent avec la clé de
-- service (auth.uid() est nul dans ce contexte, donc is_proprietaire() y est
-- faux).

-- ── Helper : le rôle propriétaire, sans déclencher la RLS de public.users ────
-- Même motif que public.is_staff() (cf. 00013) : security definer pour éviter
-- la récursion des policies qui interrogent public.users.
create or replace function public.is_proprietaire()
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid()
      and role = 'proprietaire'
  );
$$;

-- ── Statut « contre_offre » ──────────────────────────────────────────────────
alter table public.demandes_immobilier
  drop constraint if exists demandes_immobilier_statut_check;

alter table public.demandes_immobilier
  add constraint demandes_immobilier_statut_check
  check (statut in (
    'en_attente', 'en_cours_traitement', 'visite_programmee',
    'offre_soumise', 'contre_offre', 'acceptee', 'refusee',
    'annulee', 'finalisee'
  ));

-- Un montant nul ou négatif n'a pas de sens et signalerait un bug côté app.
alter table public.demandes_immobilier
  drop constraint if exists demandes_immobilier_montant_contre_offre_positif;

alter table public.demandes_immobilier
  add constraint demandes_immobilier_montant_contre_offre_positif
  check (montant_contre_offre is null or montant_contre_offre > 0);

-- ── Garde : seuls le propriétaire et service_role écrivent un montant ───────
-- SECURITY INVOKER (défaut) : la garde a besoin du vrai `current_user`. En
-- security definer il vaudrait le propriétaire de la fonction (postgres), et la
-- garde bloquerait alors tous les chemins, server actions incluses.
-- Elle ne vise que les rôles PostgREST de bout de chaîne — anon et
-- authenticated, c'est-à-dire l'appel REST direct avec la clé publique. Tout
-- chemin privilégié (service_role pour les server actions, postgres pour les
-- migrations et le SQL Editor) passe : il est gardé ailleurs.
create or replace function public.garde_montants_demandes_immobilier()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  montant_modifie boolean;
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    montant_modifie := new.montant_offre is not null
                    or new.montant_contre_offre is not null;
  else
    montant_modifie := new.montant_offre is distinct from old.montant_offre
                    or new.montant_contre_offre is distinct from old.montant_contre_offre;
  end if;

  if montant_modifie and not public.is_proprietaire() then
    raise exception
      'Seul le proprietaire peut ecrire un montant sur demandes_immobilier'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists garde_montants on public.demandes_immobilier;

create trigger garde_montants
  before insert or update on public.demandes_immobilier
  for each row
  execute function public.garde_montants_demandes_immobilier();

-- ── parametres_immobilier : la policy portait déjà le nom « proprietaire » ──
-- mais vérifiait is_staff(). caution_visite est un montant : l'écriture
-- revient au propriétaire, comme le nom l'annonçait.
drop policy if exists "parametres_immobilier_proprietaire_manage" on public.parametres_immobilier;

create policy "parametres_immobilier_proprietaire_manage"
  on public.parametres_immobilier for all
  using (public.is_proprietaire())
  with check (public.is_proprietaire());
