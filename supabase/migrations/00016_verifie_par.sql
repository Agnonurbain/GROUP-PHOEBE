-- Track which staff member handled the verification
alter table public.users add column if not exists verifie_par uuid references public.users(id);
