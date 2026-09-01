-- Pop-Up SLA — schéma Supabase
-- À exécuter dans l'éditeur SQL de votre projet Supabase (Database > SQL editor)

-- ============ Contenu du site vitrine (mission, stats, photos) ============
create table if not exists site_content (
  id int primary key default 1,
  mission_text text,
  stats jsonb default '{}'::jsonb,
  photos jsonb default '[]'::jsonb,
  updated_at timestamptz default now(),
  constraint site_content_singleton check (id = 1)
);

insert into site_content (id, mission_text, stats, photos)
values (
  1,
  'Pop-Up SLA (Soutenons Leur Avenir) organise des soirées gastronomiques pour financer la recherche sur la sclérose latérale amyotrophique, en partenariat avec SLA Québec.',
  '{"date": "29 août 2026", "lieu": "Restaurant Madame B, Sherbrooke", "invites": "63", "services": "7", "montant": "13 000 $+"}'::jsonb,
  '[]'::jsonb
)
on conflict (id) do nothing;

alter table site_content enable row level security;

create policy "Lecture publique du contenu"
  on site_content for select
  using (true);

create policy "Écriture réservée aux admins connectés"
  on site_content for insert
  with check (auth.role() = 'authenticated');

create policy "Modification réservée aux admins connectés"
  on site_content for update
  using (auth.role() = 'authenticated');

-- ============ Commanditaires ============
create table if not exists sponsors (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  contact_nom text,
  contact_email text,
  contact_tel text,
  palier text,
  montant_promis numeric,
  montant_recu numeric,
  statut text default 'prospect',
  livrables text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table sponsors enable row level security;

create policy "Accès complet réservé aux admins connectés"
  on sponsors for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ============ Stockage des photos ============
-- À faire manuellement dans Supabase : Storage > New bucket > nom "photos" > Public bucket = activé.
-- Ensuite, exécutez les politiques ci-dessous (adaptez si l'interface les a déjà créées).

insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

create policy "Lecture publique des photos"
  on storage.objects for select
  using (bucket_id = 'photos');

create policy "Envoi de photos réservé aux admins connectés"
  on storage.objects for insert
  with check (bucket_id = 'photos' and auth.role() = 'authenticated');

create policy "Suppression de photos réservée aux admins connectés"
  on storage.objects for delete
  using (bucket_id = 'photos' and auth.role() = 'authenticated');
