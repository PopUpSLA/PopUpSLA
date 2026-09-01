import { useEffect, useState } from 'react';
import Head from 'next/head';
import AdminGuard from '../../components/AdminGuard';
import AdminTopbar from '../../components/AdminTopbar';
import { supabase } from '../../lib/supabaseClient';

const STATUTS = ['prospect', 'confirmé', 'payé', 'décliné'];

const EMPTY_FORM = {
  id: null,
  nom: '',
  contact_nom: '',
  contact_email: '',
  contact_tel: '',
  palier: '',
  montant_promis: '',
  montant_recu: '',
  statut: 'prospect',
  livrables: '',
  notes: '',
};

function statusClass(statut) {
  const map = {
    prospect: 'status-prospect',
    confirmé: 'status-confirme',
    payé: 'status-paye',
    décliné: 'status-decline',
  };
  return map[statut] || 'status-prospect';
}

function SponsorsAdmin() {
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('sponsors')
      .select('*')
      .order('created_at', { ascending: false });
    setSponsors(data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function openNew() {
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(sponsor) {
    setForm({
      ...sponsor,
      montant_promis: sponsor.montant_promis ?? '',
      montant_recu: sponsor.montant_recu ?? '',
    });
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      nom: form.nom,
      contact_nom: form.contact_nom,
      contact_email: form.contact_email,
      contact_tel: form.contact_tel,
      palier: form.palier,
      montant_promis: form.montant_promis === '' ? null : Number(form.montant_promis),
      montant_recu: form.montant_recu === '' ? null : Number(form.montant_recu),
      statut: form.statut,
      livrables: form.livrables,
      notes: form.notes,
      updated_at: new Date().toISOString(),
    };

    if (form.id) {
      await supabase.from('sponsors').update(payload).eq('id', form.id);
    } else {
      await supabase.from('sponsors').insert(payload);
    }

    setSaving(false);
    setShowForm(false);
    setForm(EMPTY_FORM);
    load();
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer ce commanditaire ?')) return;
    await supabase.from('sponsors').delete().eq('id', id);
    load();
  }

  return (
    <div className="admin-shell">
      <Head>
        <title>Commandites — admin Pop-Up SLA</title>
      </Head>
      <AdminTopbar active="sponsors" />
      <main className="admin-main">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <h1 style={{ fontFamily: 'var(--serif)' }}>Commandites</h1>
          <button className="btn btn-primary" onClick={openNew}>
            + Ajouter un commanditaire
          </button>
        </div>

        {showForm && (
          <div className="admin-card">
            <h2>{form.id ? 'Modifier' : 'Nouveau'} commanditaire</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-field">
                  <label>Nom de l'entreprise</label>
                  <input
                    required
                    value={form.nom}
                    onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  />
                </div>
                <div className="form-field">
                  <label>Palier</label>
                  <input
                    placeholder="Ex. Bienfaiteur"
                    value={form.palier}
                    onChange={(e) => setForm({ ...form, palier: e.target.value })}
                  />
                </div>
                <div className="form-field">
                  <label>Nom du contact</label>
                  <input
                    value={form.contact_nom}
                    onChange={(e) => setForm({ ...form, contact_nom: e.target.value })}
                  />
                </div>
                <div className="form-field">
                  <label>Statut</label>
                  <select
                    value={form.statut}
                    onChange={(e) => setForm({ ...form, statut: e.target.value })}
                  >
                    {STATUTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label>Courriel du contact</label>
                  <input
                    type="email"
                    value={form.contact_email}
                    onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                  />
                </div>
                <div className="form-field">
                  <label>Téléphone</label>
                  <input
                    value={form.contact_tel}
                    onChange={(e) => setForm({ ...form, contact_tel: e.target.value })}
                  />
                </div>
                <div className="form-field">
                  <label>Montant promis ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.montant_promis}
                    onChange={(e) => setForm({ ...form, montant_promis: e.target.value })}
                  />
                </div>
                <div className="form-field">
                  <label>Montant reçu ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.montant_recu}
                    onChange={(e) => setForm({ ...form, montant_recu: e.target.value })}
                  />
                </div>
                <div className="form-field full">
                  <label>Livrables (ce qu'on leur doit)</label>
                  <textarea
                    placeholder="Ex. logo sur menu, 2 places réservées, mention Instagram"
                    value={form.livrables}
                    onChange={(e) => setForm({ ...form, livrables: e.target.value })}
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
          ) : sponsors.length === 0 ? (
            <p style={{ color: 'var(--ink-soft)' }}>Aucun commanditaire pour le moment.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Entreprise</th>
                  <th>Contact</th>
                  <th>Palier</th>
                  <th>Promis</th>
                  <th>Reçu</th>
                  <th>Statut</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sponsors.map((s) => (
                  <tr key={s.id}>
                    <td>{s.nom}</td>
                    <td>
                      {s.contact_nom}
                      {s.contact_email && (
                        <>
                          <br />
                          <a href={`mailto:${s.contact_email}`}>{s.contact_email}</a>
                        </>
                      )}
                    </td>
                    <td>{s.palier}</td>
                    <td>{s.montant_promis != null ? `${s.montant_promis} $` : '—'}</td>
                    <td>{s.montant_recu != null ? `${s.montant_recu} $` : '—'}</td>
                    <td>
                      <span className={`status-pill ${statusClass(s.statut)}`}>{s.statut}</span>
                    </td>
                    <td style={{ display: 'flex', gap: 8 }}>
                      <button className="btn-small" onClick={() => openEdit(s)}>
                        Modifier
                      </button>
                      <button className="btn-small danger" onClick={() => handleDelete(s.id)}>
                        Suppr.
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <AdminGuard>
      <SponsorsAdmin />
    </AdminGuard>
  );
}
