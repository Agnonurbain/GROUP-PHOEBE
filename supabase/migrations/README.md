# Migrations

## La règle

**Tout changement de schéma passe par un fichier de migration versionné.**

Aucun `ALTER`, `CREATE POLICY` ou `CREATE TABLE` ne doit être exécuté depuis le
SQL Editor du dashboard Supabase sur la base de production.

Ce n'est pas une préférence de style. Voici ce que ça a réellement coûté.

## Pourquoi — l'incident du 24/07/2026

Deux migrations, `00033` et `00034`, avaient été appliquées directement en
production sans être versionnées. Le dépôt s'arrêtait à `00032`.

Un correctif de sécurité a alors été écrit et numéroté `00033` — le prochain
numéro libre **d'après le dépôt**. Or `00033` figurait déjà dans l'historique
distant.

Le piège : `supabase db push` compare des **numéros de version**, pas des
contenus. Il aurait considéré le correctif comme déjà appliqué et l'aurait
**sauté sans aucune erreur**. Le push aurait affiché un succès, et une
élévation de privilèges serait restée ouverte en production.

L'incident n'a été détecté que parce qu'une *autre* migration (`00034`)
manquait aussi, ce qui a fait échouer le push avec un message explicite. Sans
ce hasard, le correctif disparaissait en silence.

## Écrire une migration

```bash
# Prendre le numéro suivant en verifiant l'historique DISTANT, jamais
# seulement le contenu du repertoire local.
supabase migration list
```

Nommage : `NNNNN_description_courte.sql`, numéro sur 5 chiffres, strictement
supérieur au plus grand numéro **distant**.

```bash
supabase db push          # applique les migrations en attente
supabase migration list   # verifier l'alignement local/distant
```

## Récupérer une migration appliquée hors dépôt

Si `supabase db push` signale des versions distantes inconnues, **ne pas**
lancer le `supabase migration repair --status reverted` qu'il suggère : cela
marquerait la migration comme annulée alors qu'elle a réellement modifié le
schéma, et figerait l'incohérence.

Supabase conserve le SQL appliqué, instruction par instruction :

```bash
supabase db dump --schema supabase_migrations --data-only > historique.sql
```

La colonne `statements` de `supabase_migrations.schema_migrations` contient le
SQL exact de chaque version. Reconstituer les fichiers manquants à l'identique,
les committer, **puis seulement** renuméroter et appliquer les nouvelles.

## Points d'attention RLS

Deux pièges rencontrés sur ce projet, tous deux à l'origine de failles réelles
(cf. migration `00035`) :

**Les policies `PERMISSIVE` se combinent avec un OU.** Il suffit qu'une seule
accepte pour que l'`UPDATE` passe. Durcir une policy ne sert à rien si une
autre, plus permissive, subsiste sur la même commande. Toute colonne sensible
— `role` en premier lieu — doit être verrouillée dans **chaque** policy.

**Une policy `UPDATE` sans `WITH CHECK` réutilise son `USING`** pour valider la
nouvelle ligne. Si l'expression `USING` n'examine pas la ligne (par exemple
`is_staff()`, qui ne teste que `auth.uid()`), elle vaut `true` quelles que
soient les valeurs écrites : la policy n'encadre alors plus rien.

**Un trigger de garde ne doit pas être `SECURITY DEFINER`** s'il teste
`current_user` : dans ce contexte, `current_user` vaut le propriétaire de la
fonction et non l'appelant, et le trigger ne bloque jamais rien.

## Modèle de menace

`NEXT_PUBLIC_SUPABASE_ANON_KEY` est publique par conception et PostgREST est
exposé. Un utilisateur peut émettre des requêtes directes sur la base sans
jamais passer par les Server Actions.

Les contrôles d'autorisation présents dans les Server Actions ne protègent donc
**que** le chemin applicatif. La seule défense côté données est RLS.
