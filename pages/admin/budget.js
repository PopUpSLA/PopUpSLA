import { useEffect, useState } from 'react';
import Head from 'next/head';
import AdminGuard from '../../components/AdminGuard';
import AdminTopbar from '../../components/AdminTopbar';
import { supabase } from '../../lib/supabaseClient';

const EMPTY_LIGNE = { id: null, type: 'depense', categorie: '', description: '', montant: '', date: '' };

function BudgetAdmin() {
  const [editions, setEditions] = useState([]);
  const [editionId, setEditionId] = useState('');
  const [loading, setLoading] = useState(true);

  const [revenuBillets, setRevenuBillets] = useState(0);
  const [revenuCommandites, setRevenuCommandites] = useState(0);
  const [commanditesGenerales, setCommanditesGenerales] = useState(0);
  const [lignes, setLignes] = useState([]);

  const [form, setForm] = useState(EMPTY_LIGNE);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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

  async function loadData(id) {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const [{ data: participants }, { data: sponsorsEdition }, { data: sponsorsGeneraux }, { data: budgetLignes }] =
      await Promise.all([
        supabase.from('participants').select('montant_paye').eq('edition_id', id),
        supabase
          .from('sponsors')
          .select('montant_recu')
          .eq('edition_id', id)
          .eq('type_commandite', 'argent'),
        supabase
          .from('sponsors')
          .select('montant_recu')
          .is('edition_id', null)
          .eq('type_commandite', 'argent'),
        supabase.from('budget_lignes').select('*').eq('edition_id', id).order('date', { ascending: false }),
      ]);

    const totalBillets = (participants || []).reduce((s, p) => s + (Number(p.montant_paye) || 0), 0);
    const totalCommandites = (sponsorsEdition || []).reduce((s, sp) => s + (Number(sp.montant_recu) || 0), 0);
    const totalGeneral = (sponsorsGeneraux || []).reduce((s, sp) => s + (Number(sp.montant_recu) || 0), 0);

    setRevenuBillets(totalBillets);
    setRevenuCommandites(totalCommandites);
    setCommanditesGenerales(totalGeneral);
    setLignes(budgetLignes || []);
    setLoading(false);
  }

  useEffect(() => {
    loadData(editionId);
  }, [editionId]);

  function openNew(type) {
    setForm({ ...EMPTY_LIGNE, type });
    setError('');
    setShowForm(true);
  }

  function openEdit(ligne) {
    setForm({ ...ligne, montant: ligne.montant ?? '' });
    setError('');
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!editionId) return;
    setSaving(true);
    setError('');

    const payload = {
      edition_id: editionId,
      type: form.type,
      categorie: form.categorie,
      description: form.description,
      montant: form.montant === '' ? 0 : Number(form.montant),
      date: form.date || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = form.id
      ? await supabase.from('budget_lignes').update(payload).eq('id', form.id)
      : await supabase.from('budget_lignes').insert(payload);

    setSaving(false);

    if (error) {
      setError("Erreur lors de l'enregistrement : " + error.message);
      return;
    }

    setShowForm(false);
    setForm(EMPTY_LIGNE);
    loadData(editionId);
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer cette ligne ?')) return;
    await supabase.from('budget_lignes').delete().eq('id', id);
    loadData(editionId);
  }

  const revenusManuels = lignes.filter((l) => l.type === 'revenu');
  const depenses = lignes.filter((l) => l.type === 'depense');

  const totalRevenusManuels = revenusManuels.reduce((s, l) => s + (Number(l.montant) || 0), 0);
  const totalDepenses = depenses.reduce((s, l) => s + (Number(l.montant) || 0), 0);
  const totalRevenus = revenuBillets + revenuCommandites + totalRevenusManuels;
  const net = totalRevenus - totalDepenses;

  return (
    <div className="admin-shell">
      <Head>
        <title>Budget — admin Soutenons Leur Avenir</title>
      </Head>
      <AdminTopbar active="budget" />
      <main className="admin-main">
        <h1 style={{ fontFamily: 'var(--serif)', marginBottom: 20 }}>Budget</h1>

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

        {editionId && !loading && (
          <>
            <div
              className="admin-card"
              style={{ background: 'var(--ink)', color: 'var(--cream)', textAlign: 'center', padding: '36px 24px' }}
            >
              <div style={{ fontSize: '0.85rem', opacity: 0.75, marginBottom: 6 }}>Net pour la cause</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '2.4rem', color: '#e3b06b' }}>
                {net.toLocaleString('fr-CA')} $
              </div>
              <div style={{ fontSize: '0.85rem', opacity: 0.75, marginTop: 6 }}>
                {totalRevenus.toLocaleString('fr-CA')} $ de revenus − {totalDepenses.toLocaleString('fr-CA')} $ de
                dépenses
              </div>
            </div>

            <div className="form-grid" style={{ marginBottom: 24 }}>
              <div className="admin-card" style={{ marginBottom: 0 }}>
                <h2 style={{ marginBottom: 8 }}>Billets vendus</h2>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '1.6rem' }}>
                  {revenuBillets.toLocaleString('fr-CA')} $
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--ink-soft)', marginTop: 6 }}>
                  Somme des montants payés dans Participants pour cette édition.
                </p>
              </div>
              <div className="admin-card" style={{ marginBottom: 0 }}>
                <h2 style={{ marginBottom: 8 }}>Commandites en argent</h2>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '1.6rem' }}>
                  {revenuCommandites.toLocaleString('fr-CA')} $
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--ink-soft)', marginTop: 6 }}>
                  Commanditaires de type « argent » liés à cette édition, montant reçu.
                  {commanditesGenerales > 0 && (
                    <> {commanditesGenerales.toLocaleString('fr-CA')} $ de plus ne sont liés à aucune édition.</>
                  )}
                </p>
              </div>
            </div>

            {showForm && (
              <div className="admin-card">
                <h2>{form.id ? 'Modifier' : 'Nouvelle'} ligne — {form.type === 'revenu' ? 'revenu' : 'dépense'}</h2>
                <form onSubmit={handleSubmit}>
                  <div className="form-grid">
                    <div className="form-field">
                      <label>Catégorie</label>
                      <input
                        placeholder={form.type === 'revenu' ? 'Ex. Encan silencieux' : 'Ex. Traiteur'}
                        value={form.categorie}
                        onChange={(e) => setForm({ ...form, categorie: e.target.value })}
                      />
                    </div>
                    <div className="form-field">
                      <label>Montant ($)</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        required
                        value={form.montant}
                        onChange={(e) => setForm({ ...form, montant: e.target.value })}
                      />
                    </div>
                    <div className="form-field">
                      <label>Date</label>
                      <input
                        type="date"
                        value={form.date || ''}
                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                      />
                    </div>
                    <div className="form-field full">
                      <label>Description</label>
                      <textarea
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
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
                        setForm(EMPTY_LIGNE);
                        setError('');
                      }}
                    >
                      Annuler
                    </button>
                  </div>
                  {error && <div className="error-text" style={{ marginTop: 12 }}>{error}</div>}
                </form>
              </div>
            )}

            <div className="form-grid">
              <div className="admin-card" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h2 style={{ marginBottom: 0 }}>Autres revenus</h2>
                  <button className="btn-small" onClick={() => openNew('revenu')}>
                    + Ajouter
                  </button>
                </div>
                {revenusManuels.length === 0 ? (
                  <p style={{ color: 'var(--ink-soft)', fontSize: '0.88rem' }}>
                    Ex. recettes de l'encan silencieux le soir même, dons additionnels.
                  </p>
                ) : (
                  <table className="data-table">
                    <tbody>
                      {revenusManuels.map((l) => (
                        <tr key={l.id}>
                          <td>
                            {l.categorie && <strong>{l.categorie}</strong>}
                            {l.description && <div style={{ fontSize: '0.82rem', color: 'var(--ink-soft)' }}>{l.description}</div>}
                          </td>
                          <td>{Number(l.montant).toLocaleString('fr-CA')} $</td>
                          <td style={{ display: 'flex', gap: 6 }}>
                            <button className="btn-small" onClick={() => openEdit(l)}>
                              Modifier
                            </button>
                            <button className="btn-small danger" onClick={() => handleDelete(l.id)}>
                              Suppr.
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="admin-card" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h2 style={{ marginBottom: 0 }}>Dépenses</h2>
                  <button className="btn-small" onClick={() => openNew('depense')}>
                    + Ajouter
                  </button>
                </div>
                {depenses.length === 0 ? (
                  <p style={{ color: 'var(--ink-soft)', fontSize: '0.88rem' }}>
                    Ex. traiteur, location de salle, décor, impression du menu.
                  </p>
                ) : (
                  <table className="data-table">
                    <tbody>
                      {depenses.map((l) => (
                        <tr key={l.id}>
                          <td>
                            {l.categorie && <strong>{l.categorie}</strong>}
                            {l.description && <div style={{ fontSize: '0.82rem', color: 'var(--ink-soft)' }}>{l.description}</div>}
                          </td>
                          <td>{Number(l.montant).toLocaleString('fr-CA')} $</td>
                          <td style={{ display: 'flex', gap: 6 }}>
                            <button className="btn-small" onClick={() => openEdit(l)}>
                              Modifier
                            </button>
                            <button className="btn-small danger" onClick={() => handleDelete(l.id)}>
                              Suppr.
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <AdminGuard>
      <BudgetAdmin />
    </AdminGuard>
  );
}
