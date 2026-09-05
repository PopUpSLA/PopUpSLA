-- Pop-Up SLA — migration : titre et texte d'introduction éditables depuis l'admin
-- À coller dans Supabase > SQL Editor > Run.

alter table site_content add column if not exists hero_titre text;
alter table site_content add column if not exists hero_lede text;

update site_content set
  hero_titre = coalesce(hero_titre, 'Sept services, une salle pleine, un geste concret pour la recherche sur la SLA.'),
  hero_lede = coalesce(hero_lede, 'Soutenons Leur Avenir transforme une soirée gastronomique en financement direct pour la recherche sur la sclérose latérale amyotrophique, en partenariat avec SLA Québec.')
where id = 1;
