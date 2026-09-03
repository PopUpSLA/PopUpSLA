-- Pop-Up SLA — migration : éditions à lignes personnalisables
-- À coller dans Supabase > SQL Editor > Run. Ne touche pas aux tables existantes.

create table if not exists editions (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  lignes jsonb default '[]'::jsonb,  -- ex: [{"label": "Invités", "valeur": "63"}, ...]
  ordre int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table editions enable row level security;

create policy "Lecture publique des éditions"
  on editions for select
  using (true);

create policy "Écriture réservée aux admins connectés (éditions)"
  on editions for insert
  with check (auth.role() = 'authenticated');

create policy "Modification réservée aux admins connectés (éditions)"
  on editions for update
  using (auth.role() = 'authenticated');

create policy "Suppression réservée aux admins connectés (éditions)"
  on editions for delete
  using (auth.role() = 'authenticated');

grant select on public.editions to anon, authenticated;
grant insert, update, delete on public.editions to authenticated;

-- Édition 1, déjà remplie avec vos vraies données — modifiable ensuite dans /admin/editions
insert into editions (titre, lignes, ordre)
values (
  'Édition 1 — 29 août 2026',
  '[
    {"label": "Date", "valeur": "29 août 2026"},
    {"label": "Restaurant", "valeur": "Madame B, Sherbrooke"},
    {"label": "Invités", "valeur": "63"},
    {"label": "Services", "valeur": "7"},
    {"label": "Montant amassé", "valeur": "13 000 $+"}
  ]'::jsonb,
  1
);
