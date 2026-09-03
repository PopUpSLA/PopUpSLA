import { useEffect, useState } from 'react';
import Head from 'next/head';
import AdminGuard from '../../components/AdminGuard';
import AdminTopbar from '../../components/AdminTopbar';
import { supabase } from '../../lib/supabaseClient';

function EditionsAdmin() {
  const [editions, setEditions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('editions').select('*').order('ordre', { ascending: true });
    setEditions(data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function addEdition() {
    setEditions((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        titre: 'Nouvelle édition',
        lignes: [{ label: 'Date', valeur: '' }],
        ordre: prev.length,
        isNew: true,
      },
    ]);
  }

  function updateTitre(index, titre) {
    setEditions((prev) => prev.map((e, i) => (i === index ? { ...e, titre } : e)));
  }

  function addLigne(index) {
    setEditions((prev) =>
      prev.map((e, i) =>
        i === index ? { ...e, lignes: [...(e.lignes || []), { label: '', valeur: '' }] } : e
      )
    );
  }

  function updateLigne(editionIndex, ligneIndex, field, value) {
    setEditions((prev) =>
      prev.map((e, i) => {
        if (i !== editionIndex) return e;
        const lignes = [...e.lignes];
        lignes[ligneIndex] = { ...lignes[ligneIndex], [field]: value };
        return { ...e, lignes };
      })
    );
  }

  function removeLigne(editionIndex, ligneIndex) {
    setEditions((prev) =>
      prev.map((e, i) =>
        i === editionIndex ? { ...e, lignes: e.lignes.filter((_, j) => j !== ligneIndex) } : e
      )
    );
  }

  function moveEdition(index, direction) {
    setEditions((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((e, i) => ({ ...e, ordre: i }));
    });
  }

  async function saveEdition(index) {
    const edition = editions[index];
    setSavingId(edition.id);

    const payload = {
      titre: edition.titre,
      lignes: edition.lignes,
      ordre: index,
      updated_at: new Date().toISOString(),
    };

    if (edition.isNew) {
      const { data, error } = await supabase.from('editions').insert(payload).select().single();
      if (!error && data) {
        setEditions((prev) => prev.map((e, i) => (i === index ? data : e)));
      }
    } else {
      await supabase.from('editions').update(payload).eq('id', edition.id);
    }

    setSavingId(null);
  }

  async function deleteEdition(index) {
    const edition = editions[index];
    if (!confirm(`Supprimer « ${edition.titre} » ?`)) return;
    if (!edition.isNew) {
      await supabase.from('editions').delete().eq('id', edition.id);
    }
    setEditions((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="admin-shell">
      <Head>
        <title>Éditions — admin Soutenons Leur Avenir</title>
      </Head>
      <AdminTopbar active="editions" />
      <main className="admin-main">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <h1 style={{ fontFamily: 'var(--serif)' }}>Éditions</h1>
          <button className="btn btn-primary" onClick={addEdition}>
            + Ajouter une édition
          </button>
        </div>
        <p style={{ color: 'var(--ink-soft)', marginBottom: 24 }}>
          Chaque édition apparaît comme une petite carte sur la page d'accueil. Vous choisissez
          librement les titres de chaque ligne — pas seulement invités ou services.
        </p>

        {loading ? (
          <p>Chargement…</p>
        ) : (
          editions.map((edition, editionIndex) => (
            <div className="admin-card" key={edition.id}>
              <div className="form-field full" style={{ marginBottom: 16 }}>
                <label>Titre de l'édition</label>
                <input
                  value={edition.titre}
                  onChange={(e) => updateTitre(editionIndex, e.target.value)}
                  placeholder="Ex. Édition 2 — printemps 2027"
                />
              </div>

              <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--ink-soft)' }}>
                Lignes affichées sur la carte
              </label>
              {(edition.lignes || []).map((ligne, ligneIndex) => (
                <div
                  key={ligneIndex}
                  style={{ display: 'flex', gap: 10, marginTop: 10, alignItems: 'center' }}
                >
                  <input
                    placeholder="Titre (ex. Bénévoles)"
                    value={ligne.label}
                    onChange={(e) =>
                      updateLigne(editionIndex, ligneIndex, 'label', e.target.value)
                    }
                    style={{
                      flex: 1,
                      padding: '9px 12px',
                      border: '1px solid var(--line)',
                      borderRadius: 'var(--radius)',
                    }}
                  />
                  <input
                    placeholder="Valeur (ex. 12)"
                    value={ligne.valeur}
                    onChange={(e) =>
                      updateLigne(editionIndex, ligneIndex, 'valeur', e.target.value)
                    }
                    style={{
                      flex: 1,
                      padding: '9px 12px',
                      border: '1px solid var(--line)',
                      borderRadius: 'var(--radius)',
                    }}
                  />
                  <button
                    className="btn-small danger"
                    onClick={() => removeLigne(editionIndex, ligneIndex)}
                  >
                    Retirer
                  </button>
                </div>
              ))}
              <button
                className="btn-small"
                style={{ marginTop: 12 }}
                onClick={() => addLigne(editionIndex)}
              >
                + Ajouter une ligne
              </button>

              <div className="form-actions" style={{ marginTop: 24 }}>
                <button
                  className="btn btn-primary"
                  onClick={() => saveEdition(editionIndex)}
                  disabled={savingId === edition.id}
                >
                  {savingId === edition.id ? 'Enregistrement…' : 'Enregistrer'}
                </button>
                <button
                  className="btn-small"
                  onClick={() => moveEdition(editionIndex, -1)}
                  disabled={editionIndex === 0}
                >
                  ↑ Monter
                </button>
                <button
                  className="btn-small"
                  onClick={() => moveEdition(editionIndex, 1)}
                  disabled={editionIndex === editions.length - 1}
                >
                  ↓ Descendre
                </button>
                <button className="btn-small danger" onClick={() => deleteEdition(editionIndex)}>
                  Supprimer l'édition
                </button>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <AdminGuard>
      <EditionsAdmin />
    </AdminGuard>
  );
}
