import { supabase } from '../../lib/supabaseClient';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM || 'Soutenons Leur Avenir <onboarding@resend.dev>';

function personalize(template, nom) {
  const prenom = (nom || '').trim().split(' ')[0] || '';
  return template
    .replaceAll('{{nom}}', nom || '')
    .replaceAll('{{prenom}}', prenom);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  if (!RESEND_API_KEY) {
    return res.status(500).json({
      error: "RESEND_API_KEY n'est pas configurée sur le serveur (variable d'environnement manquante).",
    });
  }

  // Vérifie que l'appel vient bien d'un admin connecté
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Non authentifié.' });
  }

  const { data: userData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !userData?.user) {
    return res.status(401).json({ error: 'Session invalide ou expirée.' });
  }

  const { subject, message, recipients } = req.body || {};

  if (!subject || !message || !Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({ error: 'subject, message et recipients sont requis.' });
  }

  const results = [];

  for (const recipient of recipients) {
    if (!recipient.courriel) {
      results.push({ nom: recipient.nom, ok: false, error: 'Aucun courriel enregistré.' });
      continue;
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: RESEND_FROM,
          to: recipient.courriel,
          subject: personalize(subject, recipient.nom),
          text: personalize(message, recipient.nom),
        }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        results.push({
          nom: recipient.nom,
          courriel: recipient.courriel,
          ok: false,
          error: errBody.message || `Erreur Resend (${response.status})`,
        });
      } else {
        results.push({ nom: recipient.nom, courriel: recipient.courriel, ok: true });
      }
    } catch (err) {
      results.push({ nom: recipient.nom, courriel: recipient.courriel, ok: false, error: err.message });
    }
  }

  const sentCount = results.filter((r) => r.ok).length;

  return res.status(200).json({ sentCount, total: recipients.length, results });
}
