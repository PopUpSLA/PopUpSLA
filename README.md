# Pop-Up SLA — site vitrine + portail commandites

Un seul site Next.js avec deux zones :

- **Site public** (`/`, `/commandites`) — mission, photos de la soirée, statistiques de
  l'édition, paliers de commandite. Le texte de mission, les statistiques et les photos
  se modifient depuis l'admin, sans toucher au code.
- **Zone admin** (`/admin`, cachée, protégée par identifiants) — suivi des commanditaires
  (statut, montants promis/reçus, livrables) et éditeur de contenu du site public.

Stack : Next.js + Supabase (base de données, authentification, stockage des photos) + Vercel.
C'est le même trio que Maison Éphémère, pour rester dans un environnement que vous connaissez déjà.

## 1. Créer le projet Supabase

1. Sur [supabase.com](https://supabase.com), créez un nouveau projet (choisissez une région
   proche, ex. `ca-central-1` si disponible).
2. Dans **SQL editor**, collez le contenu de `supabase/schema.sql` et exécutez-le. Ça crée :
   - la table `site_content` (mission, stats, photos) avec une ligne de départ déjà remplie
     avec les infos de la première édition ;
   - la table `sponsors` (commandites) ;
   - le bucket de stockage `photos`, public en lecture.
3. Dans **Authentication > Users**, créez manuellement un compte pour chacun de vous trois
   (toi, Béatrice, Olivier) avec courriel + mot de passe. Il n'y a pas d'inscription publique —
   seuls les comptes que vous créez ici peuvent se connecter à `/admin`.
4. Dans **Project settings > API**, notez :
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2. Configurer le projet en local

```bash
cp .env.local.example .env.local
# remplir les deux valeurs avec celles notées à l'étape 1

npm install
npm run dev
```

Le site est sur `http://localhost:3000`, l'admin sur `http://localhost:3000/admin`.

## 3. Déployer sur Vercel

1. Poussez ce dossier sur un dépôt GitHub.
2. Sur [vercel.com](https://vercel.com), « Add New Project » → importez le dépôt.
3. Dans les **Environment Variables** du projet Vercel, ajoutez les deux mêmes variables
   que dans `.env.local`.
4. Déployez. Vercel vous donne une URL `.vercel.app` — un domaine personnalisé
   (ex. `popupsla.ca`) peut être ajouté ensuite dans **Settings > Domains**.

## Ce qui est éditable sans coder

Une fois connecté sur `/admin` :

- **Contenu du site** — texte de mission et photos (glisser une image l'ajoute à la galerie de la page d'accueil).
- **Éditions** — ajouter/modifier des éditions du souper, avec des lignes de statistiques
  entièrement personnalisables (pas seulement invités/services/montant).
- **Commandites** — ajouter/modifier/supprimer des commanditaires, suivre leur statut
  (prospect / confirmé / payé / décliné), les montants et les livrables promis.
- **Participants** — pour chaque édition, la liste des invités (courriel, téléphone, places,
  montant payé, restrictions alimentaires), avec envoi de courriels groupés directement
  depuis l'admin.

## Envoi de courriels aux participants (Resend)

Cette fonction a besoin de deux variables d'environnement supplémentaires sur Vercel,
**sans** le préfixe `NEXT_PUBLIC_` cette fois — elles doivent rester privées, contrairement
aux clés Supabase :

- `RESEND_API_KEY` — votre clé secrète Resend (resend.com > API Keys).
- `RESEND_FROM` — l'adresse d'expédition, ex. `Soutenons Leur Avenir <info@popupsla.ca>`.
  Sans cette variable, les courriels partent d'une adresse de test Resend
  (`onboarding@resend.dev`), qui fonctionne mais paraît moins professionnelle.

**Important :** tant qu'aucun domaine n'est vérifié dans Resend (Domains > Add domain),
Resend limite l'envoi à votre propre adresse de compte — les courriels aux invités
échoueront silencieusement en arrière-plan (visible dans le résumé d'envoi de l'admin).
Vérifier un domaine (via des enregistrements DNS chez votre fournisseur de domaine) débloque
l'envoi à n'importe quelle adresse.

## Migrations à exécuter en plus du schéma de départ

Si vous aviez déjà exécuté `supabase/schema.sql` avant cette mise à jour, exécutez aussi
dans l'ordre, dans SQL Editor :

1. `supabase/migration-editions.sql`
2. `supabase/migration-participants.sql`
3. `supabase/migration-mur-commanditaires.sql`
4. `supabase/migration-type-commandite.sql`
5. `supabase/migration-plan-salle-budget.sql`
6. `supabase/migration-hero-editable.sql`

## Vente de billets avec Zeffy (sans les frais Stripe)

Zeffy est gratuit à 100 % pour les OBNL (financé par des pourboires optionnels des
donateurs, pas de frais prélevés sur vos ventes). Le site ne remplace pas Zeffy pour la
vente de billets — Zeffy reste l'endroit où les gens achètent et paient. Ce qu'on a
ajouté, c'est un pont automatique : chaque nouvelle vente sur Zeffy crée automatiquement
le participant correspondant dans l'onglet Participants du site, via Zapier.

**Deux nouvelles variables d'environnement, privées (sans préfixe `NEXT_PUBLIC_`) :**

- `SUPABASE_SERVICE_ROLE_KEY` — dans Supabase, Project Settings > API Keys, la clé
  `service_role` (différente de la clé `anon` publique — celle-ci contourne toutes les
  règles de sécurité, donc elle ne doit **jamais** apparaître ailleurs que dans cette
  variable Vercel).
- `ZEFFY_WEBHOOK_SECRET` — n'importe quelle chaîne de caractères longue et aléatoire que
  vous inventez (ex. un mot de passe généré). Elle sert à vérifier que seul Zapier peut
  déclencher l'ajout automatique de participants.

**Pour brancher une campagne Zeffy à une édition :**

1. Dans Supabase, Table Editor > `editions`, copiez la valeur `id` (un long code) de
   l'édition concernée.
2. Créez votre billetterie comme d'habitude sur Zeffy.
3. Dans Zeffy, allez dans Settings > Organization > Integrations pour obtenir une clé API
   Zeffy (nécessaire pour Zapier).
4. Sur zapier.com, créez un nouveau Zap : déclencheur = Zeffy, événement "New Order" (ou
   "Get Order"). Connectez avec la clé API Zeffy de l'étape précédente.
5. Ajoutez une action "Webhooks by Zapier" > "POST". URL :
   ```
   https://votre-site.vercel.app/api/zeffy-webhook?secret=VOTRE_ZEFFY_WEBHOOK_SECRET
   ```
6. Dans le corps (body) de cette action, en format JSON, mappez les champs Zeffy vers :
   ```
   edition_id: (collez l'id copié à l'étape 1 — une valeur fixe, pas un champ Zeffy)
   nom: (champ nom/prénom de la commande Zeffy)
   courriel: (champ courriel de la commande Zeffy)
   montant_paye: (champ montant de la commande Zeffy)
   nombre_places: (champ quantité de billets, si disponible — sinon laissez vide, ça compte pour 1)
   ```
7. Testez le Zap avec une commande d'exemple, vérifiez que le participant apparaît dans
   `/admin/participants`, puis activez le Zap.

**Limite connue :** si Zapier renvoie deux fois le même événement (rare, en cas de
problème réseau), un doublon peut apparaître dans Participants — à vérifier
manuellement de temps en temps, rien d'automatique pour l'instant pour fusionner les
doublons.

## Ce qui reste dans le code (à ajuster vous-mêmes ou à redemander)

- Les **paliers de commandite publics** (`pages/commandites.js`, tableau `TIERS`) — les
  noms, montants et avantages sont des propositions de départ à valider entre vous trois
  avant de les partager à des commanditaires.
- Le courriel de contact (`info@popupsla.ca`) est un espace réservé — remplacez-le partout
  par une adresse que vous surveillez réellement, ou dites-le-moi et je fais le remplacement.

## Prochaines étapes possibles

- Ajouter un mur "Merci à nos commanditaires" public une fois les premiers logos confirmés.
- Suivi de conformité OBNL (rappels de déclaration annuelle) — mentionné dans notre échange
  précédent, pas encore construit.
- Export CSV des commandites pour la comptabilité.
