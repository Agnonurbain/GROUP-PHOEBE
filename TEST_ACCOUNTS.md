# Comptes de test

| Nom | Identifiant | Mot de passe | Role | Mode |
|---|---|---|---|---|
| Urbain N'DA | agnon.urbain@gmail.com | *(Google OAuth)* | client | Google |
| Christian | christian29@gmail.com | `TestPhoebe2025!` | client | Email |
| David | +2250508090666 | `TestPhoebe2026!` | client | Téléphone |
| Opérateur | operateur@test.phoebe.ci | `TestPhoebe2025!` | operateur | Email+Phone |
| Propriétaire | proprietaire@test.phoebe.ci | `TestPhoebe2025!` | proprietaire | Email+Phone |
| *10 agents immobiliers* | `agent.<zone>@test.phoebe.ci` | `TestPhoebe2025!` | agent_immobilier | Email+Phone |
| Moussa Diarra | livreur.abidjan@test.phoebe.ci | `TestPhoebe2025!` | livreur | Email |

## Livreur

Créé le 2026-07-31. Se connecte et atterrit sur **`/terrain/livreur`**, pas sur
l'espace client : la redirection suit le rôle (`accueilSelonRole`). Le back-office
lui répond `notFound()`, c'est voulu.

Zone de couverture **vide** — donc il dessert tout. C'est le bon défaut tant que
les couvertures ne sont pas réparties : un colis trouve toujours preneur. Capacité
à 10 colis en cours. Les deux se règlent depuis `/admin/livreurs`.

L'expédition de test `GP-UTTD8JA5` (Bingerville) lui est affectée, au statut
`prise_en_charge`.

## Agents immobiliers

Créés le 2026-07-29. Sans au moins un agent, **aucune visite n'est programmable** :
`visites.agent_id` est NOT NULL et le formulaire exige un agent sur la demande.
Ils se créent désormais depuis `/admin/comptes` (propriétaire seul), avec leur zone.

Mot de passe commun : `TestPhoebe2025!`

| Agent | Identifiant | Zone de couverture | Biens |
|---|---|---|---|
| Awa Koné | agent.cocody@… | `Cocody` | 10 |
| Ibrahim Traoré | agent.marcory@… | `Marcory` | 4 |
| Fatou Diallo | agent.yopougon@… | `Yopougon` | 2 |
| Koffi N'Guessan | agent.plateau@… | `Plateau, Abidjan` | 2 |
| Aya Bamba | agent.deuxplateaux@… | `II Plateaux` | 2 |
| Serge Kouassi | agent.riviera@… | `Riviera` | 2 |
| Mariam Ouattara | agent.treichville@… | `Treichville` | 2 |
| Yao Adjoua | agent.abobo@… | `Abobo` | 2 |
| Lucien Gbagbo | agent.bingerville@… | `Bingerville` | 2 |
| Nadège Assi | agent.bassam@… | `Grand-Bassam` | 2 |

**Les 30 biens du catalogue ont un agent.**

### Pourquoi ces libellés de zone précisément

`autoAssignAgent()` retient le premier agent dont la zone est **contenue** dans la
localisation du bien, sans ordre défini : deux zones qui correspondent au même bien
rendraient l'affectation non déterministe. Deux pièges contournés :

- **`Plateau, Abidjan` et non `Plateau`** — la chaîne « Plateau » est contenue dans
  « II Plateaux, Abidjan », un même bien aurait donc eu deux agents candidats. Le
  libellé complet lève l'ambiguïté.
- **Aucun agent « Angré »** — « Angré » est contenu dans « Cocody Angré, Abidjan »,
  et aucun sous-libellé ne permet de viser « Angré, Abidjan » sans attraper l'autre.
  Angré étant un quartier de Cocody, ses 2 biens sont rattachés à l'agent Cocody.

Vérifier toute nouvelle zone contre les localisations existantes avant de la créer :
si un bien correspond à deux zones, l'agent retenu est arbitraire.
