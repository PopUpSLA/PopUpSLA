-- Pop-Up SLA — prospects de commandite suggérés (Sherbrooke / Estrie)
-- Recherchés et sélectionnés en fonction du profil de l'événement (souper gastronomique).
-- À coller dans Supabase > SQL Editor > Run. Ils apparaîtront comme "prospect" dans
-- /admin/commandites, prêts à être contactés — modifiez ou supprimez librement.

insert into sponsors (nom, type_commandite, statut, notes) values
(
  'Caisses Desjardins de Sherbrooke',
  'argent',
  'prospect',
  $$Plusieurs caisses locales ont un processus formel de demande de commandite communautaire avec formulaire dédié (ex. Caisse Desjardins du Nord de Sherbrooke, Caisse des Deux-Rivières de Sherbrooke). Contact identifié pour la Caisse du Nord de Sherbrooke : Marie-Josée Fleury, conseillère en communication, 819 566-0050 poste 7235137. À vérifier laquelle correspond à votre secteur avant de soumettre une demande.$$
),
(
  $$Vignoble de l'Orpailleur$$,
  'nourriture',
  'prospect',
  $$Vignoble pionnier de Dunham, connu pour son vin de glace — bon candidat pour un don de bouteilles pour l'encan silencieux ou un accord mets-vins pour la soirée.$$
),
(
  $$Le Cep d'Argent$$,
  'nourriture',
  'prospect',
  $$Vignoble de Magog, méthode champenoise — pourrait convenir pour un accord avec un vin mousseux ou un don pour l'encan.$$
),
(
  'Cidrerie Milton',
  'nourriture',
  'prospect',
  $$Cidrerie reconnue des Cantons-de-l'Est avec bistro sur place — don de cidre possible pour l'encan ou pour le service.$$
),
(
  'Boquébière',
  'nourriture',
  'prospect',
  $$Microbrasserie locale de Sherbrooke — pourrait fournir des bières pour un accord mets-bière ou un don pour l'encan.$$
),
(
  'Café Massawippi',
  'nourriture',
  'prospect',
  $$Traiteur établi depuis plus de 20 ans en Estrie, met en valeur les produits régionaux — pourrait offrir un certificat cadeau pour l'encan silencieux.$$
),
(
  'Réception 108',
  'nourriture',
  'prospect',
  $$Traiteur sherbrookois établi depuis plus de 30 ans, dessert notamment l'Université de Sherbrooke — bon contact pour une future édition ou un don pour l'encan.$$
),
(
  'La Fine Bouche',
  'nourriture',
  'prospect',
  $$Traiteur sherbrookois qui met de l'avant des valeurs écologiques — pourrait bien s'aligner avec l'image de l'organisme.$$
);
