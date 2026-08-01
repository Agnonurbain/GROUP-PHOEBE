-- ─────────────────────────────────────────────────────────────────────────────
-- 00071 — Pages légales éditables et politique d'indemnisation
--
-- Deux sujets que je ne pouvais pas trancher à la place de l'entreprise : le
-- contenu juridique et le montant d'une indemnisation. Une mention légale
-- inventée est pire qu'absente, et un plafond improvisé engagerait GROUP PHOEBE
-- sur une somme que personne n'a décidée.
--
-- La réponse n'est donc pas d'écrire ces valeurs, mais de bâtir de quoi les
-- saisir : les deux deviennent pilotables par le propriétaire, comme les tarifs
-- et la TVA le sont déjà.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. Pages légales ────────────────────────────────────────────────────────
-- Le contenu vivait dans un fichier TypeScript : le modifier demandait un
-- déploiement, et les [À COMPLÉTER] y seraient restés jusqu'à ce qu'un
-- développeur s'en occupe.

create table if not exists public.pages_legales (
  slug text primary key check (slug in ('mentions-legales', 'cgv', 'confidentialite')),
  titre text not null,
  chapeau text not null default '',
  -- [{ "titre": "...", "paragraphes": ["...", "..."] }]
  sections jsonb not null default '[]'::jsonb,
  -- Tant que la page n'est pas publiée, elle reste `noindex` et porte un
  -- bandeau : un brouillon indexé serait cité comme l'engagement de
  -- l'entreprise.
  publie boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_par uuid references public.users(id)
);

comment on table public.pages_legales is
  'Mentions légales, CGV et politique de confidentialité, éditables par le propriétaire. `publie` à false = brouillon : bandeau visible et noindex.';
comment on column public.pages_legales.sections is
  'Tableau de sections : [{ titre, paragraphes: [] }]. Le rendu ne fait aucune interprétation HTML — le texte est affiché tel quel.';

alter table public.pages_legales enable row level security;

-- Lecture publique : ce sont des pages du site.
create policy "pages_legales_select_public"
  on public.pages_legales for select
  using (true);

-- Écriture propriétaire seule : ces textes engagent l'entreprise.
create policy "pages_legales_manage_proprietaire"
  on public.pages_legales for all
  using (public.is_proprietaire())
  with check (public.is_proprietaire());

-- ─── 2. Politique d'indemnisation de la livraison ────────────────────────────
-- `valeur_declaree` était demandée au client sans rien promettre. Plutôt que de
-- la laisser décorative ou d'inventer un régime, les règles deviennent des
-- paramètres — et le texte affiché au client en découle.

create table if not exists public.parametres_livraison (
  id boolean primary key default true check (id),
  -- Aucune valeur par défaut « raisonnable » n'existe ici : 0 signifie
  -- explicitement « aucune indemnisation », ce qui est l'état actuel et doit
  -- être dit tel quel plutôt que suggéré par un chiffre arbitraire.
  indemnisation_active boolean not null default false,
  indemnisation_taux numeric(5,2) not null default 0 check (indemnisation_taux between 0 and 100),
  indemnisation_plafond numeric(12,2) not null default 0 check (indemnisation_plafond >= 0),
  indemnisation_conditions text not null default '',
  updated_at timestamptz not null default now()
);

comment on table public.parametres_livraison is
  'Régime d''indemnisation en cas de perte ou d''avarie. Tant que `indemnisation_active` est false, l''interface annonce clairement qu''aucune indemnisation ne s''attache à la valeur déclarée.';
comment on column public.parametres_livraison.indemnisation_taux is
  'Part de la valeur déclarée remboursée, en pourcentage. Bornée ensuite par le plafond.';
comment on column public.parametres_livraison.indemnisation_plafond is
  'Montant maximum indemnisé, quelle que soit la valeur déclarée. 0 = pas de plafond distinct du taux.';

insert into public.parametres_livraison (id) values (true) on conflict (id) do nothing;

alter table public.parametres_livraison enable row level security;

create policy "parametres_livraison_select_public"
  on public.parametres_livraison for select
  using (true);

-- Un montant d'indemnisation est un engagement financier : propriétaire seul,
-- comme tout ce qui porte un prix dans ce projet.
create policy "parametres_livraison_manage_proprietaire"
  on public.parametres_livraison for all
  using (public.is_proprietaire())
  with check (public.is_proprietaire());

-- ─── 3. Trace de l'indemnisation retenue ─────────────────────────────────────
-- Le montant est figé sur l'expédition au moment de la clôture : changer les
-- paramètres plus tard ne doit pas réécrire ce qui a été promis à un client.

alter table public.expeditions
  add column if not exists indemnisation_montant numeric(12,2);

comment on column public.expeditions.indemnisation_montant is
  'Indemnisation arrêtée à la clôture d''un échec définitif, calculée avec les paramètres en vigueur ce jour-là. Figée : une évolution ultérieure du barème ne réécrit pas un engagement pris.';

-- ─── 4. Reprise des brouillons ───────────────────────────────────────────────
-- Les textes rédigés en amont sont chargés tels quels, en brouillon. Les
-- [À COMPLÉTER] restent visibles : ils nomment ce que seule l'entreprise
-- détient, et la page ne se publie qu'une fois ces trous comblés.
insert into public.pages_legales (slug, titre, chapeau, sections, publie) values
  ('mentions-legales', 'Mentions légales', 'Informations relatives à l''éditeur du site GROUP PHOEBE et à son hébergement.', '[{"titre":"Éditeur du site","paragraphes":["GROUP PHOEBE, [À COMPLÉTER : forme juridique] au capital de [À COMPLÉTER] FCFA.","Siège social : [À COMPLÉTER : adresse complète], Abidjan, Côte d''Ivoire.","Registre du commerce (RCCM) : [À COMPLÉTER]. Numéro de compte contribuable : [À COMPLÉTER].","Directeur de la publication : [À COMPLÉTER : nom et qualité]."]},{"titre":"Contact","paragraphes":["Téléphone : +225 07 78 63 19 83.","Adresse électronique : [À COMPLÉTER]."]},{"titre":"Hébergement","paragraphes":["Le site est hébergé par [À COMPLÉTER : hébergeur et adresse].","Les données applicatives sont stockées chez [À COMPLÉTER : fournisseur et région d''hébergement]."]},{"titre":"Propriété intellectuelle","paragraphes":["L''ensemble des contenus du site — textes, photographies de véhicules et de biens, logos, marques — est la propriété de GROUP PHOEBE ou de ses partenaires, et protégé à ce titre.","Toute reproduction ou représentation, totale ou partielle, sans autorisation écrite préalable, est interdite."]}]'::jsonb, false),
  ('cgv', 'Conditions générales de vente', 'Conditions applicables aux prestations de GROUP PHOEBE : location et vente de véhicules, livraison de colis, intermédiation immobilière et assistance voyage.', '[{"titre":"1. Objet et acceptation","paragraphes":["Les présentes conditions régissent les prestations proposées par GROUP PHOEBE sur ce site.","Toute commande suppose leur acceptation préalable, recueillie explicitement au moment de la réservation."]},{"titre":"2. Prix et paiement","paragraphes":["Les prix sont indiqués en francs CFA, toutes taxes comprises. Le montant affiché avant validation est celui qui est facturé.","Les paiements sont acceptés par carte bancaire, Mobile Money, et — pour la livraison de colis — en espèces ou Mobile Money à la remise.","Une facture est émise pour chaque paiement encaissé et reste consultable depuis l''espace client."]},{"titre":"3. Location de véhicule","paragraphes":["La location est subordonnée à la présentation d''un permis de conduire en cours de validité et d''une pièce d''identité. Tout conducteur secondaire doit être déclaré et validé avant la prise du véhicule.","Une caution est demandée à la réservation. Son montant et les cas de retenue sont indiqués avant paiement.","Un état des lieux contradictoire est établi au départ et au retour. Il constitue la référence en cas de contestation et reste consultable depuis l''espace client.","[À COMPLÉTER : kilométrage inclus, carburant, franchise d''assurance, zone géographique autorisée.]"]},{"titre":"4. Annulation et remboursement","paragraphes":["Une réservation de véhicule peut être annulée sans frais jusqu''à 48 heures avant le départ. Passé ce délai, la caution est retenue.","Une livraison peut être annulée tant que le colis n''a pas été pris en charge. Au-delà, la course est engagée.","Les frais de visite immobilière ne sont pas remboursables : ils rémunèrent un déplacement effectué.","Tout remboursement dû est instruit par nos équipes et versé par le canal du paiement d''origine."]},{"titre":"5. Livraison de colis","paragraphes":["Les délais annoncés courent à compter de la prise en charge effective du colis.","La valeur déclarée est indicative et sert la priorité de manutention. Elle ne vaut pas assurance : [À COMPLÉTER : régime d''indemnisation retenu, plafond éventuel].","La remise donne lieu à une preuve — photographie et nom du réceptionnaire — consultable depuis l''espace client.","Les objets illicites, dangereux, périssables ou de valeur exceptionnelle sont exclus du service."]},{"titre":"6. Responsabilité","paragraphes":["GROUP PHOEBE est tenue d''une obligation de moyens dans l''exécution de ses prestations.","[À COMPLÉTER : limitations de responsabilité, force majeure, assurances souscrites.]"]},{"titre":"7. Réclamations et droit applicable","paragraphes":["Toute réclamation peut être adressée par téléphone ou par écrit ; elle fait l''objet d''une réponse sous [À COMPLÉTER] jours ouvrés.","Les présentes conditions sont régies par le droit ivoirien. À défaut d''accord amiable, les tribunaux d''Abidjan sont compétents."]}]'::jsonb, false),
  ('confidentialite', 'Politique de confidentialité', 'Quelles données nous collectons, pourquoi, combien de temps, et comment exercer vos droits.', '[{"titre":"Données collectées","paragraphes":["Identité et contact : nom, téléphone, adresse électronique, date de naissance.","Pièces justificatives : permis de conduire, pièce d''identité, et le cas échéant permis d''un conducteur secondaire. Elles sont stockées de façon privée et ne sont jamais accessibles publiquement.","Données de prestation : réservations, expéditions, adresses de retrait et de livraison, états des lieux, preuves de remise.","Données de paiement : nous ne conservons aucun numéro de carte. Les paiements sont traités par nos prestataires."]},{"titre":"Finalités","paragraphes":["Exécuter les prestations commandées et vous en tenir informé.","Satisfaire à nos obligations comptables et fiscales, notamment l''émission des factures.","Prévenir la fraude et sécuriser l''accès aux comptes."]},{"titre":"Durées de conservation","paragraphes":["[À COMPLÉTER : durée de conservation par catégorie de données, notamment les pièces d''identité et les documents comptables.]"]},{"titre":"Destinataires","paragraphes":["Les données sont accessibles aux seuls personnels de GROUP PHOEBE qui en ont besoin, ainsi qu''à nos prestataires techniques et de paiement, dans la limite de leur mission.","Elles ne sont ni vendues ni cédées à des tiers à des fins commerciales."]},{"titre":"Vos droits","paragraphes":["Vous disposez d''un droit d''accès, de rectification, d''effacement et d''opposition sur vos données.","Ces droits s''exercent auprès de [À COMPLÉTER : contact du responsable de traitement].","Vous pouvez également saisir l''Autorité de régulation des télécommunications de Côte d''Ivoire (ARTCI), autorité compétente en matière de protection des données personnelles."]},{"titre":"Cookies","paragraphes":["Le site dépose les cookies nécessaires à votre session et à vos préférences de langue.","[À COMPLÉTER : cookies de mesure d''audience éventuels et modalités de refus.]"]}]'::jsonb, false)
on conflict (slug) do nothing;
