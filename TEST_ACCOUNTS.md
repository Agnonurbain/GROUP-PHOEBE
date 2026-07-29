# Comptes de test

| Nom | Identifiant | Mot de passe | Role | Mode |
|---|---|---|---|---|
| Urbain N'DA | agnon.urbain@gmail.com | *(Google OAuth)* | client | Google |
| Christian | christian29@gmail.com | `TestPhoebe2025!` | client | Email |
| David | +2250508090666 | `TestPhoebe2026!` | client | Téléphone |
| Opérateur | operateur@test.phoebe.ci | `TestPhoebe2025!` | operateur | Email+Phone |
| Propriétaire | proprietaire@test.phoebe.ci | `TestPhoebe2025!` | proprietaire | Email+Phone |
| Awa Koné | agent.cocody@test.phoebe.ci | `TestPhoebe2025!` | agent_immobilier | Email+Phone |
| Ibrahim Traoré | agent.marcory@test.phoebe.ci | `TestPhoebe2025!` | agent_immobilier | Email+Phone |
| Fatou Diallo | agent.yopougon@test.phoebe.ci | `TestPhoebe2025!` | agent_immobilier | Email+Phone |

## Agents immobiliers

Créés le 2026-07-29. Sans au moins un agent, **aucune visite n'est programmable** :
`visites.agent_id` est NOT NULL et le formulaire exige un agent sur la demande.

| Agent | Zone de couverture | Biens du catalogue concernés |
|---|---|---|
| Awa Koné | `Cocody` | Cocody, Abidjan (6) + Cocody Angré, Abidjan (2) |
| Ibrahim Traoré | `Marcory` | Marcory, Abidjan (2) + Zone 4, Marcory (2) |
| Fatou Diallo | `Yopougon` | Yopougon, Abidjan (2) |

Zones volontairement **disjointes** : `autoAssignAgent()` retient le premier agent
dont la zone est contenue dans la localisation, sans ordre défini — des zones qui
se recouvrent rendraient l'affectation automatique non déterministe.

L'affectation automatique ne joue qu'à la **création** d'un bien. Les 30 biens
déjà en base ont `agent_id` à null : sur une demande les concernant, il faut
passer par « Affecter » dans `/admin/demandes-immobilier` (la liste déroulante est
désormais alimentée).

## OTP de test

- Numéro : `+2250508090666` → Code OTP : `123456` (configuré dans Supabase, valide jusqu'au 31 juillet 2026)
