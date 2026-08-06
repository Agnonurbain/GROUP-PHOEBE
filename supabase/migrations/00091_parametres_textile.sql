-- ─────────────────────────────────────────────────────────────────────────────
-- 00091 — La marge revendeur, pilotable
--
-- L'exploitant annonce une marge au revendeur qu'il fournit. Sa note vocale en
-- donne un chiffre, mais les deux transcriptions ne s'accordent pas — « 40 % ou
-- 50 % » d'un côté, « 80 % […] 50 % » de l'autre. Le seul point d'accord est
-- 50 %, et c'est la valeur qu'il a tranchée le 05/08/2026.
--
-- ─── Pourquoi en base plutôt que dans le code ────────────────────────────────
-- Une marge se négocie et se révise : elle suit le marché, pas un déploiement.
-- La figer dans le code obligerait à passer par un développeur pour la changer,
-- et le repli codé finirait par mentir.
--
-- ─── Pourquoi elle n'apparaît JAMAIS sur le site public ──────────────────────
-- Annoncer une marge revient à annoncer un prix : on donne le prix d'achat au
-- centime près à qui sait faire une règle de trois. Or ce service n'affiche
-- aucun prix, par décision de l'exploitant (00087). La valeur sert à CELUI QUI
-- CHIFFRE, dans l'écran d'administration, et nulle part ailleurs.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.parametres_textile (
  -- Singleton, comme les autres tables de paramètres du dépôt : une seule
  -- ligne, dont l'existence est garantie par la contrainte sur `id`.
  id boolean primary key default true check (id),

  -- En pourcentage du prix d'achat. `numeric` et non `int` : une marge de
  -- 47,5 % doit pouvoir s'écrire sans arrondi.
  marge_revendeur_pct numeric(5,2) not null default 50
    check (marge_revendeur_pct >= 0 and marge_revendeur_pct <= 500),

  updated_at timestamptz not null default now()
);

insert into public.parametres_textile (id) values (true) on conflict (id) do nothing;

comment on table public.parametres_textile is
  'Paramètres du module textile. Singleton : une seule ligne, id = true.';

comment on column public.parametres_textile.marge_revendeur_pct is
  'Marge appliquée au tarif de gros, en %. Ne s''affiche JAMAIS côté public : annoncer une marge revient à annoncer un prix, ce que ce service ne fait pas (00087). Elle sert à celui qui chiffre, dans l''administration.';

alter table public.parametres_textile enable row level security;

-- Lecture : le personnel. Le public n'a rien à en savoir — et sans policy de
-- lecture publique, la clé anon ne peut pas la lire même en tapant l'API REST.
create policy "parametres_textile_select_staff"
  on public.parametres_textile for select using (public.is_staff());

-- Écriture : propriétaire seul. Une marge détermine un montant facturé, et la
-- règle du dépôt vaut ici comme partout — cf. `__tests__/prix-proprietaire.test.ts`.
create policy "parametres_textile_update_proprietaire"
  on public.parametres_textile for update
  using (public.is_proprietaire()) with check (public.is_proprietaire());
