-- Pop-Up SLA — migration : participants par édition
-- À coller dans Supabase > SQL Editor > Run.

create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid references editions(id) on delete cascade,
  nom text not null,
  courriel text,
  telephone text,
  nombre_places int default 1,
  montant_paye numeric,
  restrictions_alimentaires text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists participants_edition_idx on participants(edition_id);

alter table participants enable row level security;

create policy "Accès complet réservé aux admins connectés (participants)"
  on participants for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

grant select, insert, update, delete on public.participants to authenticated;
