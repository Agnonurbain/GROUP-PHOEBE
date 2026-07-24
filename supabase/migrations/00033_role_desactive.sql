-- Ajoute le rôle 'desactive' à la contrainte CHECK de users.role
-- nécessaire pour le soft-delete des comptes internes (désactiver, pas supprimer)

alter table users drop constraint users_role_check;

alter table users add constraint users_role_check
  check (role in ('client', 'operateur', 'proprietaire', 'livreur', 'agent_immobilier', 'desactive'));
