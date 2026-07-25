-- Regroupe les paiements d'un meme panier (checkout multi-vehicules).
--
-- Avant : un panier de N vehicules creait N paiements, mais la session de
-- paiement (Stripe/CinetPay) etait facturee au total global et liee a un SEUL
-- paiement. Au retour du webhook, seule la 1re demande etait confirmee ; les
-- N-1 autres restaient en_attente_paiement et etaient annulees par le cron
-- d'expiration — alors que le client avait paye le total. Perte de reservation
-- et d'argent cote client.
--
-- commande_id relie les paiements d'une meme commande pour que la confirmation
-- (et l'echec) portent sur TOUT le groupe. Colonne nullable : les paiements
-- existants et les paiements isoles (negociation, achat) restent valides avec
-- commande_id null.

alter table public.paiements add column if not exists commande_id uuid;

create index if not exists idx_paiements_commande_id
  on public.paiements (commande_id)
  where commande_id is not null;
