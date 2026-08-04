-- ─────────────────────────────────────────────────────────────────────────────
-- 00083 — Les heures d'ouverture quittent la table du transport
--
-- `jours_ouvres`, `heure_ouverture` et `heure_fermeture` ont été posés en 00075
-- sur `parametres_transport`, pour décompter les délais du cycle transport en
-- heures ouvrées. C'était le seul usage à l'époque, et le nom passait encore.
--
-- Depuis 00081, les rendez-vous de dépôt d'un dossier d'assistance lisent les
-- mêmes colonnes : ce sont les mêmes murs et les mêmes horaires. Partager était
-- le bon choix — deux calendriers auraient fini par diverger. Mais le nom, lui,
-- est devenu faux : ces horaires n'ont rien de propre au transport, et un
-- lecteur qui cherche « les jours d'ouverture de GROUP PHOEBE » n'a aucune
-- raison de les chercher là.
--
-- Un nom qui ment finit par produire un doublon : le prochain qui aura besoin
-- des horaires pour un troisième usage ne les trouvera pas et en créera
-- d'autres. On déplace donc, pendant que les lecteurs se comptent sur une main.
--
-- Ce qui RESTE sur `parametres_transport` : les trois délais et leur mode de
-- décompte. Ceux-là sont bien spécifiques au transport.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.parametres_ouverture (
  id boolean primary key default true check (id),

  -- 1 = lundi … 7 = dimanche. Lundi-samedi, usage courant à Abidjan.
  jours_ouvres smallint[] not null default '{1,2,3,4,5,6}',
  heure_ouverture time not null default '08:00',
  heure_fermeture time not null default '18:00',

  updated_at timestamptz not null default now(),

  -- L'ouverture précède la fermeture, sinon aucune plage n'existe : un délai en
  -- heures ouvrées ne s'épuiserait jamais et l'agenda ne proposerait rien.
  constraint parametres_ouverture_horaires_check check (heure_ouverture < heure_fermeture)
);

comment on table public.parametres_ouverture is
  'Jours et heures d''ouverture de GROUP PHOEBE. Partagés par le décompte des délais transport en heures ouvrées (00075) et par les créneaux de rendez-vous (00081) : un seul calendrier pour toute la maison.';

comment on column public.parametres_ouverture.jours_ouvres is
  'Jours d''ouverture, 1 = lundi … 7 = dimanche. Vide, ou horaires inversés, rend un décompte en heures ouvrées insoluble : le code retombe alors sur un calcul calendaire plutôt que de ne jamais expirer.';

-- Reprendre les valeurs en place, et non les valeurs par défaut : la ligne
-- existante peut avoir été réglée depuis /admin/tarifs.
insert into public.parametres_ouverture (id, jours_ouvres, heure_ouverture, heure_fermeture)
select true, jours_ouvres, heure_ouverture, heure_fermeture
  from public.parametres_transport
 where id
on conflict (id) do nothing;

-- Filet : si `parametres_transport` était vide, la ligne singleton doit exister
-- quand même, sinon toute lecture retomberait sur le repli codé en dur.
insert into public.parametres_ouverture (id) values (true) on conflict (id) do nothing;

alter table public.parametres_ouverture enable row level security;

-- Lecture publique : les créneaux de rendez-vous sont affichés avant connexion,
-- et le délai de négociation est annoncé dans le formulaire de demande de prix.
create policy "parametres_ouverture_select_public"
  on public.parametres_ouverture for select using (true);

-- Ces horaires décident d'une rétention de caution — un retrait « en retard »
-- se mesure en heures ouvrées. Propriétaire seul, comme tout ce qui porte à
-- conséquence financière dans ce projet.
create policy "parametres_ouverture_manage_proprietaire"
  on public.parametres_ouverture for all
  using (public.is_proprietaire()) with check (public.is_proprietaire());

-- ─── Retrait des colonnes déplacées ──────────────────────────────────────────
-- Après la copie : les laisser en place produirait exactement le doublon que
-- cette migration existe pour éviter.

alter table public.parametres_transport
  drop constraint if exists parametres_transport_horaires_check;

alter table public.parametres_transport
  drop column if exists jours_ouvres,
  drop column if exists heure_ouverture,
  drop column if exists heure_fermeture;

comment on table public.parametres_transport is
  'Délais du cycle de vie d''une demande de transport, pilotables depuis /admin/tarifs. Les heures d''ouverture ne sont plus ici : elles valent pour toute la maison et vivent sur parametres_ouverture (00083).';
