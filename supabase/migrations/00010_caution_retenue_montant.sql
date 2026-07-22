-- 00010: caution_retenue passe de boolean à integer (montant retenu en FCFA)
-- Permet la retenue partielle : 0 = libérée, valeur = montant retenu

alter table demandes_transport
  alter column caution_retenue drop default,
  alter column caution_retenue drop not null,
  alter column caution_retenue type integer using (case when caution_retenue then coalesce(caution::integer, 0) else 0 end),
  alter column caution_retenue set default 0,
  alter column caution_retenue set not null;
