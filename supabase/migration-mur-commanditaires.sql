-- Pop-Up SLA — migration : logos de commanditaires + mur public sécuritaire
-- À coller dans Supabase > SQL Editor > Run.

alter table sponsors add column if not exists logo_url text;

-- Bucket de stockage pour les logos (séparé des photos de la soirée)
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

create policy "Lecture publique des logos"
  on storage.objects for select
  using (bucket_id = 'logos');

create policy "Envoi de logos réservé aux admins connectés"
  on storage.objects for insert
  with check (bucket_id = 'logos' and auth.role() = 'authenticated');

create policy "Suppression de logos réservée aux admins connectés"
  on storage.objects for delete
  using (bucket_id = 'logos' and auth.role() = 'authenticated');

-- Vue publique : expose SEULEMENT le nom et le logo des commanditaires
-- confirmés ou payés — jamais les montants, courriels, téléphones ou notes.
-- La table sponsors elle-même reste entièrement privée (RLS admins seulement).
create or replace view public.sponsors_public as
select id, nom, palier, logo_url, created_at
from public.sponsors
where statut in ('confirmé', 'payé');

grant select on public.sponsors_public to anon, authenticated;
