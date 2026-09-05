import { supabaseAdmin } from '../../lib/supabaseAdmin';

// Cette route reçoit les nouvelles commandes Zeffy (relayées par Zapier) et crée
// automatiquement un participant dans Supabase. Elle est protégée par un secret
// partagé plutôt que par une session admin, puisque Zapier ne peut pas se
// "connecter" comme un administrateur — voir ZEFFY_WEBHOOK_SECRET dans le README.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const secretAttendu = process.env.ZEFFY_WEBHOOK_SECRET;
  const secretRecu = req.query.secret;

  if (!secretAttendu) {
    return res.status(500).json({ error: "ZEFFY_WEBHOOK_SECRET n'est pas configuré sur le serveur." });
  }
  if (secretRecu !== secretAttendu) {
    return res.status(401).json({ error: 'Secret invalide ou manquant.' });
  }

  const {
    edition_id,
    nom,
    courriel,
    telephone,
    montant_paye,
    nombre_places,
    restrictions_alimentaires,
  } = req.body || {};

  if (!edition_id) {
    return res.status(400).json({ error: "edition_id est requis — voir le README pour le trouver." });
  }
  if (!nom) {
    return res.status(400).json({ error: 'nom est requis.' });
  }

  const { data, error } = await supabaseAdmin
    .from('participants')
    .insert({
      edition_id,
      nom,
      courriel: courriel || null,
      telephone: telephone || null,
      montant_paye: montant_paye ? Number(montant_paye) : null,
      nombre_places: nombre_places ? Number(nombre_places) : 1,
      restrictions_alimentaires: restrictions_alimentaires || null,
      notes: 'Ajouté automatiquement via Zeffy',
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ success: true, participant: data });
}
