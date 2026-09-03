import { useEffect, useState } from 'react';
import Head from 'next/head';
import AdminGuard from '../../components/AdminGuard';
import AdminTopbar from '../../components/AdminTopbar';
import { supabase } from '../../lib/supabaseClient';

const EMPTY_FORM = {
  id: null,
  nom: '',
  courriel: '',
  telephone: '',
  nombre_places: 1,
  montant_paye: '',
  restrictions_alimentaires: '',
  notes: '',
};

function ParticipantsAdmin() {
  const [editions, setEditions] = useState([]);
  const [editionId, setEditionId] = useState('');
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(new Set());

  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [sendError, setSendError] = useState('');

  useEffect(() => {
    async function loadEditions() {
      const { data } = await supabase
        .from('editions')
        .select('id, titre')
        .order('ordre', { ascending: true });
      setEditions(data || []);
      if (data && data.length && !editionId) {
        setEditionId(data[data.length - 1].id);
      }
    }
    loadEditions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadParticipants(id) {
    if (!id) {
      setParticipants([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('participants')
      .select('*')
      .eq('edition_id', id)
      .order('created_at', { ascending: false });
    setParticipants(data || []);
    setSelected(new Set());
    setLoading(false);
  }

  useEffect(() => {
    loadParticipants(editionId);
  }, [editionId]);

  function openNew() {
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(p) {
    setForm({
      ...p,
      montant_paye: p.montant_paye ?? '',
      nombre_places: p.nombre_places ?? 1,
    });
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!editionId) return;
    setSaving(true);

    const payload = {
      edition_id: editionId,
      nom: form.nom,
      courriel: form.courriel,
      telephone: form.telephone,
      nombre_places: form.nombre_places === '' ? 1 : Number(form.nombre_places),
      montant_paye: form.montant_paye === '' ? null : Number(form.montant_paye),
      restrictions_alimentaires: form.restrictions_alimentaires,
      notes: form.notes,
      updated_at: new Date().toISOString(),
    };

    if (form.id) {
      await supabase.from('participants').update(payload).eq('id', form.id);
    } else {
      await supabase.from('participants').insert(payload);
    }

    setSaving(false);
    setShowForm(false);
    setForm(EMPTY_FORM);
    loadParticipants(editionId);
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer ce participant ?')) return;
    await supabase.from('participants').delete().eq('id', id);
    loadParticipants(editionId);
  }

  function toggleSelected(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === participants.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(participants.map((p) => p.id)));
    }
  }

  async function handleSendEmail(e) {
    e.preventDefault();
    setSending(true);
    setSendResult(null);
    setSendError('');

    const recipients = participants
      .filter((p) => selected.has(p.id))
      .map((p) => ({ nom: p.nom, courriel: p.courriel }));

    const {
      data: { session },
    } = await supabase.auth.getSession();

    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ subject: emailSubject, message: emailMessage, recipients }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSendError(data.error || "Erreur lors de l'envoi.");
      } else {
        setSendResult(data);
      }
    } catch (err) {
      setSendError(err.message);
    }

    setSending(false);
  }

  return (
    <div className="admin-shell">
      <Head>
        <title>Participants — admin Soutenons Leur Avenir</title>
      </Head>
      <AdminTopbar active="participants" />
      <main className="admin-main">
        <h1 style={{ fontFamily: 'var(--serif)', marginBottom: 20 }}>Participants</h1>

        <div className="admin-card">
          <label style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--ink-soft)' }}>
            Édition
          </label>
          <select
            value={editionId}
            onChange={(e) => setEditionId(e.target.value)}
            style={{
              display: 'block',
              marginTop: 8,
              padding: '10px 12px',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius)',
              minWidth: 280,
            }}
          >
            {editions.length === 0 && <option>Aucune édition — créez-en une d'abord</option>}
            {editions.map((ed) => (
              <option key={ed.id} value={ed.id}>
                {ed.titre}
              </option>
            ))}
          </select>
        </div>

        {editionId && (
          <>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                margin: '20px 0',
              }}
            >
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem' }}>
                {participants.length} participant{participants.length !== 1 ? 's' : ''}
              </h2>
              <button className="btn btn-primary" onClick={openNew}>
                + Ajouter un participant
              </button>
            </div>

            {showForm && (
              <div className="admin-card">
                <h2>{form.id ? 'Modifier' : 'Nouveau'} participant</h2>
                <form onSubmit={handleSubmit}>
                  <div className="form-grid">
                    <div className="form-field">
                      <label>Nom</label>
                      <input
                        required
                        value={form.nom}
                        onChange={(e) => setForm({ ...form, nom: e.target.value })}
                      />
                    </div>
                    <div className="form-field">
                      <label>Courriel</label>
                      <input
                        type="email"
                        value={form.courriel}
                        onChange={(e) => setForm({ ...form, courriel: e.target.value })}
                      />
                    </div>
                    <div className="form-field">
                      <label>Téléphone</label>
                      <input
                        value={form.telephone}
                        onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                      />
                    </div>
                    <div className="form-field">
                      <label>Nombre de places</label>
                      <input
                        type="number"
                        min="1"
                        value={form.nombre_places}
                        onChange={(e) => setForm({ ...form, nombre_places: e.target.value })}
                      />
                    </div>
                    <div className="form-field">
                      <label>Montant payé ($)</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={form.montant_paye}
                        onChange={(e) => setForm({ ...form, montant_paye: e.target.value })}
                      />
                    </div>
                    <div className="form-field">
                      <label>Restrictions alimentaires</label>
                      <input
                        placeholder="Ex. végétarien, allergie aux noix"
                        value={form.restrictions_alimentaires}
                        onChange={(e) =>
                          setForm({ ...form, restrictions_alimentaires: e.target.value })
                        }
                      />
                    </div>
                    <div className="form-field full">
                      <label>Notes</label>
                      <textarea
                        value={form.notes}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? 'Enregistrement…' : 'Enregistrer'}
                    </button>
                    <button
                      type="button"
                      className="btn-small"
                      onClick={() => {
                        setShowForm(false);
                        setForm(EMPTY_FORM);
                      }}
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="admin-card">
              {loading ? (
                <p>Chargement…</p>
              ) : participants.length === 0 ? (
                <p style={{ color: 'var(--ink-soft)' }}>Aucun participant pour cette édition.</p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          checked={selected.size === participants.length}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      <th>Nom</th>
                      <th>Courriel</th>
                      <th>Places</th>
                      <th>Payé</th>
                      <th>Restrictions</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selected.has(p.id)}
                            onChange={() => toggleSelected(p.id)}
                          />
                        </td>
                        <td>{p.nom}</td>
                        <td>{p.courriel || '—'}</td>
                        <td>{p.nombre_places}</td>
                        <td>{p.montant_paye != null ? `${p.montant_paye} $` : '—'}</td>
                        <td>{p.restrictions_alimentaires || '—'}</td>
                        <td style={{ display: 'flex', gap: 8 }}>
                          <button className="btn-small" onClick={() => openEdit(p)}>
                            Modifier
                          </button>
                          <button className="btn-small danger" onClick={() => handleDelete(p.id)}>
                            Suppr.
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {selected.size > 0 && (
              <div className="admin-card">
                <h2>
                  Envoyer un courriel à {selected.size} participant{selected.size !== 1 ? 's' : ''}
                </h2>
                <p style={{ color: 'var(--ink-soft)', fontSize: '0.88rem', marginBottom: 14 }}>
                  Utilisez {'{{prenom}}'} ou {'{{nom}}'} dans le sujet ou le message pour
                  personnaliser chaque courriel.
                </p>
                <form onSubmit={handleSendEmail}>
                  <div className="form-field full" style={{ marginBottom: 14 }}>
                    <label>Sujet</label>
                    <input
                      required
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Ex. Merci d'avoir été des nôtres, {{prenom}} !"
                    />
                  </div>
                  <div className="form-field full">
                    <label>Message</label>
                    <textarea
                      required
                      rows={6}
                      value={emailMessage}
                      onChange={(e) => setEmailMessage(e.target.value)}
                      placeholder="Bonjour {{prenom}},&#10;&#10;..."
                    />
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={sending}>
                      {sending ? 'Envoi en cours…' : `Envoyer à ${selected.size}`}
                    </button>
                  </div>
                </form>

                {sendError && <div className="error-text" style={{ marginTop: 12 }}>{sendError}</div>}

                {sendResult && (
                  <div style={{ marginTop: 16, fontSize: '0.9rem' }}>
                    <strong>
                      {sendResult.sentCount} / {sendResult.total} courriels envoyés avec succès.
                    </strong>
                    <ul style={{ marginTop: 8, paddingLeft: 18 }}>
                      {sendResult.results
                        .filter((r) => !r.ok)
                        .map((r, i) => (
                          <li key={i} style={{ color: '#a13d3d' }}>
                            {r.nom} — {r.error}
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <AdminGuard>
      <ParticipantsAdmin />
    </AdminGuard>
  );
}
