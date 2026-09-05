import { createClient } from '@supabase/supabase-js';

// ATTENTION : ce client utilise la clé "service_role", qui contourne
// complètement les règles de sécurité (RLS). Ne JAMAIS l'importer dans un
// composant ou une page qui s'exécute dans le navigateur — uniquement dans
// des routes API (pages/api/...), qui tournent sur le serveur.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
