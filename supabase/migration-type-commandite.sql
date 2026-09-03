-- Pop-Up SLA — migration : type de commandite (argent / nourriture / encan silencieux)
-- À coller dans Supabase > SQL Editor > Run.

alter table sponsors add column if not exists type_commandite text default 'argent';
alter table sponsors add column if not exists description_don text;
