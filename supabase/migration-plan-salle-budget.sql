-- Pop-Up SLA — migration : plan de salle + budget global
-- À coller dans Supabase > SQL Editor > Run.

-- ============ Plan de salle ============
create table if not exists tables_salle (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid references editions(id) on delete cascade,
  nom text not null,
  capacite int default 8,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists tables_salle_edition_idx on tables_salle(edition_id);

alter table tables_salle enable row level security;

create policy "Accès complet réservé aux admins connectés (tables_salle)"
  on tables_salle for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

grant select, insert, update, delete on public.tables_salle to authenticated;

alter table participants add column if not exists table_id uuid references tables_salle(id) on delete set null;

-- ============ Budget (revenus manuels + dépenses) ============
create table if not exists budget_lignes (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid references editions(id) on delete cascade,
  type text not null check (type in ('revenu', 'depense')),
  categorie text,
  description text,
  montant numeric not null default 0,
  date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists budget_lignes_edition_idx on budget_lignes(edition_id);

alter table budget_lignes enable row level security;

create policy "Accès complet réservé aux admins connectés (budget_lignes)"
  on budget_lignes for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

grant select, insert, update, delete on public.budget_lignes to authenticated;

-- ============ Lier une commandite en argent à une édition (optionnel) ============
alter table sponsors add column if not exists edition_id uuid references editions(id) on delete set null;
