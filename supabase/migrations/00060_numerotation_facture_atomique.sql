-- ─────────────────────────────────────────────────────────────────────────────
-- 00060 — Numérotation atomique des factures, une facture par paiement
--
-- La numérotation lisait `numero_suivant` puis l'incrémentait dans un UPDATE
-- séparé. Deux paiements confirmés en parallèle — le cas nominal d'un panier
-- multi-véhicules, dont chaque ligne est un paiement distinct capturé dans la
-- même transaction prestataire — obtenaient le même numéro. `factures.numero`
-- étant unique, le second insert échouait, et l'erreur était avalée par le
-- try/catch du webhook (à raison : une facture ratée ne doit pas faire échouer
-- l'encaissement). Résultat : facture manquante, en silence.
--
-- L'incrément vit désormais dans un seul UPDATE ... RETURNING, dont le verrou
-- de ligne sérialise les appels concurrents.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.prochain_numero_facture()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reserve int;
  v_prefixe text;
begin
  update public.parametres_facturation
     set numero_suivant = numero_suivant + 1,
         updated_at = now()
   where id
  returning numero_suivant - 1, prefixe_facture
    into v_reserve, v_prefixe;

  if v_reserve is null then
    raise exception 'parametres_facturation : ligne singleton absente';
  end if;

  return v_prefixe || '-' || extract(year from now())::int
         || '-' || lpad(v_reserve::text, 4, '0');
end;
$$;

comment on function public.prochain_numero_facture() is
  'Réserve et renvoie le prochain numéro de facture. Atomique : l''UPDATE ... RETURNING verrouille la ligne singleton, deux appels concurrents ne peuvent pas obtenir le même numéro.';

-- Réservé au serveur. Un numéro réservé n'est jamais rendu : exposer la
-- fonction à la clé anon permettrait de faire avancer la numérotation à volonté.
revoke execute on function public.prochain_numero_facture() from public;
revoke execute on function public.prochain_numero_facture() from anon;
revoke execute on function public.prochain_numero_facture() from authenticated;
grant execute on function public.prochain_numero_facture() to service_role;

-- Un paiement ne donne qu'une facture. La double génération est déjà écartée en
-- amont (un paiement déjà capturé n'est pas retraité), mais un webhook rejoué
-- sur un chemin qu'on n'a pas prévu produirait deux factures pour un seul
-- encaissement — une incohérence comptable qu'aucun code applicatif ne rattrape.
create unique index if not exists factures_paiement_unique
  on public.factures (paiement_id);
