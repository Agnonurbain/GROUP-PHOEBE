-- GROUP PHOEBE — Coordonnées et réseaux sociaux pilotables
--
-- Le site publiait des coordonnées FICTIVES : « info@groupphoebe.com » et
-- « +225 01 02 03 04 05 » dans le pied de page, la page contact et les données
-- structurées, plus un « 07 07 00 00 00 » dans le lien de négociation WhatsApp.
-- Elles vivent désormais en base, éditables par le propriétaire.
--
-- Table singleton : une seule ligne, garantie par `id boolean primary key
-- default true check (id)`.

create table if not exists public.parametres_contact (
  id boolean primary key default true check (id),

  -- Coordonnées
  telephone text,
  email text,
  adresse text,
  horaires text,

  -- Réseaux sociaux (URL complètes) et WhatsApp (numéro au format wa.me)
  whatsapp text,
  facebook text,
  instagram text,
  linkedin text,
  tiktok text,
  youtube text,

  updated_at timestamptz not null default now()
);

-- Seed : UNIQUEMENT ce qui est confirmé. Tout le reste reste NULL — un champ
-- vide n'affiche rien, ce qui vaut mieux qu'une fausse coordonnée publique.
--   • Le numéro est celui déjà utilisé par le bouton WhatsApp flottant et le
--     contrat PDF, confirmé par le propriétaire.
--   • La ville est confirmée par le contrat PDF et les données structurées.
insert into public.parametres_contact (id, telephone, whatsapp, adresse)
values (true, '+225 07 78 63 19 83', '2250778631983', 'Abidjan, Côte d''Ivoire')
on conflict (id) do nothing;

-- RLS : lecture publique (le pied de page les affiche), écriture propriétaire.
alter table public.parametres_contact enable row level security;

create policy "parametres_contact_select_public"
  on public.parametres_contact for select
  using (true);

create policy "parametres_contact_proprietaire_manage"
  on public.parametres_contact for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'proprietaire'
    )
  )
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'proprietaire'
    )
  );
