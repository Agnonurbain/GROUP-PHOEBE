-- Documents obligatoires pour le voyageur : certificat fièvre jaune et
-- autorisation parentale pour les mineurs. Créée le 2026-07-30.
--
-- Ces colonnes sont des déclarations du client. L'équipe les vérifie depuis
-- /admin/billets — comme la validité du passeport.

alter table public.demandes_billet
  add column if not exists certificat_fievre_jaune boolean not null default false,
  add column if not exists certificat_fievre_jaune_valide boolean default null,
  add column if not exists mineur_autorisation_parentale boolean not null default false,
  add column if not exists mineur_autorisation_verifie boolean default null;

comment on column public.demandes_billet.certificat_fievre_jaune is
  'Le voyageur declare disposer d un certificat de vaccination fievre jaune valide. Obligatoire pour entrer en CI et dans la plupart des destinations depuis la CI.';

comment on column public.demandes_billet.certificat_fievre_jaune_valide is
  'Verification par l equipe : null = non verifie, true = conforme, false = a regulariser.';

comment on column public.demandes_billet.mineur_autorisation_parentale is
  'Le client declare disposer de l autorisation parentale pour tout mineur voyageant sans ses deux parents.';

comment on column public.demandes_billet.mineur_autorisation_verifie is
  'Verification par l equipe : null = non verifie, true = conforme, false = a regulariser.';
