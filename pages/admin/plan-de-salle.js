import { useEffect, useState } from 'react';
import Head from 'next/head';
import AdminGuard from '../../components/AdminGuard';
import AdminTopbar from '../../components/AdminTopbar';
import { supabase } from '../../lib/supabaseClient';

function PlanDeSalleAdmin() {
  const [editions, setEditions] = useState([]);
  const [editionId, setEditionId] = useState('');
  const [tables, setTables] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nouvelleTable, setNouvelleTable] = useState({ nom: '', capacite: 8 });
  const [addingTable, setAddingTable] = useState(false);
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
      setTables([]);
      setParticipants([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [{ data: tablesData }, { data: participantsData }] = await Promise.all([
      supabase.from('tables_salle').select('*').eq('edition_id', id).order('created_at'),
      supabase
        .from('participants')
        .select('id, nom, nombre_places, table_id')
        .eq('edition_id', id)
        .order('nom'),
    ]);
    setTables(tablesData || []);
    setParticipants(participantsData || []);
    setLoading(false);
  }

  useEffect(() => {
    loadData(editionId);
  }, [editionId]);

  async function handleAddTable(e) {
    e.preventDefault();
    if (!nouvelleTable.nom || !editionId) return;
    setAddingTable(true);
    setError('');

    const { error } = await supabase.from('tables_salle').insert({
      edition_id: editionId,
      nom: nouvelleTable.nom,
      capacite: Number(nouvelleTable.capacite) || 8,
    });

    setAddingTable(false);

    if (error) {
      setError("Erreur lors de l'ajout de la table : " + error.message);
      return;
    }

    setNouvelleTable({ nom: '', capacite: 8 });
    loadData(editionId);
  }

  async function handleDeleteTable(id) {
    if (!confirm('Supprimer cette table ? Les participants assignés deviendront non assignés.'))
      return;
    await supabase.from('tables_salle').delete().eq('id', id);
    loadData(editionId);
  }

  async function assignerTable(participantId, tableId) {
    await supabase
      .from('participants')
      .update({ table_id: tableId || null })
      .eq('id', participantId);
    loadData(editionId);
  }

  function placesOccupees(tableId) {
    return participants
      .filter((p) => p.table_id === tableId)
      .reduce((sum, p) => sum + (p.nombre_places || 1), 0);
  }

  const nonAssignes = participants.filter((p) => !p.table_id);

  return (
    <div className="admin-shell">
      <Head>
        <title>Plan de salle — admin Soutenons Leur Avenir</title>
      </Head>
      <AdminTopbar active="plan-de-salle" />
      <main className="admin-main">
        <h1 style={{ fontFamily: 'var(--serif)', marginBottom: 20 }}>Plan de salle</h1>

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
            <div className="admin-card">
              <h2>Ajouter une table</h2>
              <form
                onSubmit={handleAddTable}
                style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}
              >
                <div className="form-field">
                  <label>Nom de la table</label>
                  <input
                    placeholder="Ex. Table 1"
                    value={nouvelleTable.nom}
                    onChange={(e) => setNouvelleTable({ ...nouvelleTable, nom: e.target.value })}
                    required
                  />
                </div>
                <div className="form-field">
                  <label>Capacité</label>
                  <input
                    type="number"
                    min="1"
                    value={nouvelleTable.capacite}
                    onChange={(e) =>
                      setNouvelleTable({ ...nouvelleTable, capacite: e.target.value })
                    }
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={addingTable}>
                  {addingTable ? 'Ajout…' : '+ Ajouter'}
                </button>
              </form>
              {error && <div className="error-text" style={{ marginTop: 12 }}>{error}</div>}
            </div>

            {loading ? (
              <p>Chargement…</p>
            ) : (
              <>
                <div className="form-grid" style={{ marginBottom: 24 }}>
                  {tables.map((table) => {
                    const occupees = placesOccupees(table.id);
                    const complet = occupees >= table.capacite;
                    const depasse = occupees > table.capacite;
                    return (
                      <div className="admin-card" key={table.id} style={{ marginBottom: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 10,
                          }}
                        >
                          <h2 style={{ marginBottom: 0 }}>{table.nom}</h2>
                          <button className="btn-small danger" onClick={() => handleDeleteTable(table.id)}>
                            Suppr.
                          </button>
                        </div>
                        <p
                          style={{
                            fontSize: '0.88rem',
                            color: depasse ? '#a13d3d' : 'var(--ink-soft)',
                            fontWeight: depasse ? 600 : 400,
                            marginBottom: 12,
                          }}
                        >
                          {occupees} / {table.capacite} places {depasse ? '— surbooké' : complet ? '— complet' : ''}
                        </p>
                        {participants.filter((p) => p.table_id === table.id).length === 0 ? (
                          <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>Aucun participant assigné.</p>
                        ) : (
                          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {participants
                              .filter((p) => p.table_id === table.id)
                              .map((p) => (
                                <li
                                  key={p.id}
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '8px 0',
                                    borderTop: '1px solid var(--line-soft)',
                                    fontSize: '0.9rem',
                                  }}
                                >
                                  <span>
                                    {p.nom} ({p.nombre_places || 1})
                                  </span>
                                  <select
                                    value={p.table_id || ''}
                                    onChange={(e) => assignerTable(p.id, e.target.value)}
                                    style={{ fontSize: '0.82rem', padding: '4px 6px' }}
                                  >
                                    <option value="">— Non assigné —</option>
                                    {tables.map((t) => (
                                      <option key={t.id} value={t.id}>
                                        {t.nom}
                                      </option>
                                    ))}
                                  </select>
                                </li>
                              ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="admin-card">
                  <h2>
                    Non assignés · {nonAssignes.length} participant{nonAssignes.length !== 1 ? 's' : ''}
                  </h2>
                  {nonAssignes.length === 0 ? (
                    <p style={{ color: 'var(--ink-soft)' }}>Tout le monde est assigné à une table.</p>
                  ) : (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {nonAssignes.map((p) => (
                        <li
                          key={p.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '10px 0',
                            borderTop: '1px solid var(--line-soft)',
                          }}
                        >
                          <span>
                            {p.nom} ({p.nombre_places || 1} place{p.nombre_places > 1 ? 's' : ''})
                          </span>
                          <select
                            value=""
                            onChange={(e) => assignerTable(p.id, e.target.value)}
                            style={{ fontSize: '0.85rem', padding: '6px 8px' }}
                          >
                            <option value="">Assigner à…</option>
                            {tables.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.nom}
                              </option>
                            ))}
                          </select>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
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
      <PlanDeSalleAdmin />
    </AdminGuard>
  );
}
