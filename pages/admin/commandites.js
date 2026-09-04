import { useEffect, useState } from 'react';
import Head from 'next/head';
import AdminGuard from '../../components/AdminGuard';
import AdminTopbar from '../../components/AdminTopbar';
import { supabase } from '../../lib/supabaseClient';

const STATUTS = ['prospect', 'confirmé', 'payé', 'décliné'];

const TYPES_COMMANDITE = [
  { value: 'argent', label: 'Argent', montantLabel: 'Montant' },
  { value: 'nourriture', label: 'Nourriture', montantLabel: 'Valeur estimée' },
  { value: 'encan_silencieux', label: "Don pour l'encan silencieux", montantLabel: 'Valeur estimée' },
];

function typeInfo(value) {
  return TYPES_COMMANDITE.find((t) => t.value === value) || TYPES_COMMANDITE[0];
}

const EMPTY_FORM = {
  id: null,
  nom: '',
  contact_nom: '',
  contact_email: '',
  contact_tel: '',
  palier: '',
  type_commandite: 'argent',
  description_don: '',
  montant_promis: '',
  montant_recu: '',
  statut: 'prospect',
  livrables: '',
  notes: '',
  logo_url: '',
  edition_id: '',
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
  const [editions, setEditions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [formError, setFormError] = useState('');

  async function load() {
    setLoading(true);
    const [{ data: sponsorsData }, { data: editionsData }] = await Promise.all([
      supabase.from('sponsors').select('*').order('created_at', { ascending: false }),
      supabase.from('editions').select('id, titre').order('ordre', { ascending: true }),
    ]);
    setSponsors(sponsorsData || []);
    setEditions(editionsData || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function openNew(defaultType) {
    setForm({ ...EMPTY_FORM, type_commandite: defaultType || 'argent' });
    setFormError('');
    setShowForm(true);
  }

  function openEdit(sponsor) {
    setForm({
      ...sponsor,
      montant_promis: sponsor.montant_promis ?? '',
      montant_recu: sponsor.montant_recu ?? '',
      logo_url: sponsor.logo_url ?? '',
      type_commandite: sponsor.type_commandite || 'argent',
      description_don: sponsor.description_don || '',
      edition_id: sponsor.edition_id || '',
    });
    setFormError('');
    setShowForm(true);
  }

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    setFormError('');

    const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
    const { error: uploadError } = await supabase.storage.from('logos').upload(path, file);

    if (uploadError) {
      setFormError("Erreur lors de l'envoi du logo : " + uploadError.message);
      setUploadingLogo(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from('logos').getPublicUrl(path);
    setForm((prev) => ({ ...prev, logo_url: publicUrlData.publicUrl }));
    setUploadingLogo(false);
    e.target.value = '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setFormError('');

    const payload = {
      nom: form.nom,
      contact_nom: form.contact_nom,
      contact_email: form.contact_email,
      contact_tel: form.contact_tel,
      palier: form.palier,
      type_commandite: form.type_commandite,
      description_don: form.description_don,
      montant_promis: form.montant_promis === '' ? null : Number(form.montant_promis),
      montant_recu: form.montant_recu === '' ? null : Number(form.montant_recu),
      statut: form.statut,
      livrables: form.livrables,
      notes: form.notes,
      logo_url: form.logo_url || null,
      edition_id: form.edition_id || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = form.id
      ? await supabase.from('sponsors').update(payload).eq('id', form.id)
      : await supabase.from('sponsors').insert(payload);

    setSaving(false);

    if (error) {
      setFormError("Erreur lors de l'enregistrement : " + error.message);
      return;
    }

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
        <title>Commandites — admin Soutenons Leur Avenir</title>
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
          <button className="btn btn-primary" onClick={() => openNew()}>
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
                  <label>Type de commandite</label>
                  <select
                    value={form.type_commandite}
                    onChange={(e) => setForm({ ...form, type_commandite: e.target.value })}
                  >
                    {TYPES_COMMANDITE.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
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
                  <label>Édition liée (pour le budget — facultatif)</label>
                  <select
                    value={form.edition_id}
                    onChange={(e) => setForm({ ...form, edition_id: e.target.value })}
                  >
                    <option value="">Aucune / toutes éditions</option>
                    {editions.map((ed) => (
                      <option key={ed.id} value={ed.id}>
                        {ed.titre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label>Nom du contact</label>
                  <input
                    value={form.contact_nom}
                    onChange={(e) => setForm({ ...form, contact_nom: e.target.value })}
                  />
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
                  <label>{typeInfo(form.type_commandite).montantLabel} promis ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.montant_promis}
                    onChange={(e) => setForm({ ...form, montant_promis: e.target.value })}
                  />
                </div>
                <div className="form-field">
                  <label>{typeInfo(form.type_commandite).montantLabel} reçu ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.montant_recu}
                    onChange={(e) => setForm({ ...form, montant_recu: e.target.value })}
                  />
                </div>
                {form.type_commandite !== 'argent' && (
                  <div className="form-field full">
                    <label>Description du don</label>
                    <textarea
                      placeholder={
                        form.type_commandite === 'nourriture'
                          ? 'Ex. 40 portions de saumon fumé pour le service 2'
                          : 'Ex. Certificat cadeau spa, valeur 200 $'
                      }
                      value={form.description_don}
                      onChange={(e) => setForm({ ...form, description_don: e.target.value })}
                    />
                  </div>
                )}
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
                <div className="form-field full">
                  <label>Logo (affiché publiquement sur le mur des partenaires une fois le statut confirmé ou payé)</label>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploadingLogo} />
                  {uploadingLogo && <p style={{ fontSize: '0.85rem', marginTop: 6 }}>Envoi en cours…</p>}
                  {form.logo_url && (
                    <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img
                        src={form.logo_url}
                        alt=""
                        style={{ height: 48, border: '1px solid var(--line)', borderRadius: 'var(--radius)' }}
                      />
                      <button
                        type="button"
                        className="btn-small"
                        onClick={() => setForm((prev) => ({ ...prev, logo_url: '' }))}
                      >
                        Retirer
                      </button>
                    </div>
                  )}
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
                    setFormError('');
                  }}
                >
                  Annuler
                </button>
              </div>
              {formError && <div className="error-text" style={{ marginTop: 12 }}>{formError}</div>}
            </form>
          </div>
        )}

        {loading ? (
          <p>Chargement…</p>
        ) : (
          TYPES_COMMANDITE.map((type) => {
            const groupe = sponsors.filter(
              (s) => (s.type_commandite || 'argent') === type.value
            );
            return (
              <div className="admin-card" key={type.value}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 14,
                  }}
                >
                  <h2 style={{ marginBottom: 0 }}>
                    {type.label} · {groupe.length}
                  </h2>
                  <button className="btn-small" onClick={() => openNew(type.value)}>
                    + Ajouter
                  </button>
                </div>

                {groupe.length === 0 ? (
                  <p style={{ color: 'var(--ink-soft)' }}>Aucun commanditaire dans cette section.</p>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Entreprise</th>
                        <th>Contact</th>
                        <th>Palier</th>
                        {type.value !== 'argent' && <th>Description du don</th>}
                        <th>{type.montantLabel} promis</th>
                        <th>{type.montantLabel} reçu</th>
                        <th>Statut</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupe.map((s) => (
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
                          {type.value !== 'argent' && <td>{s.description_don || '—'}</td>}
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
            );
          })
        )}
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
