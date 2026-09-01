import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import AdminGuard from '../../components/AdminGuard';
import AdminTopbar from '../../components/AdminTopbar';
import { supabase } from '../../lib/supabaseClient';

function AdminDashboard() {
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('sponsors')
        .select('statut, montant_promis, montant_recu');
      setSponsors(data || []);
      setLoading(false);
    }
    load();
  }, []);

  const totalPromis = sponsors.reduce((sum, s) => sum + (Number(s.montant_promis) || 0), 0);
  const totalRecu = sponsors.reduce((sum, s) => sum + (Number(s.montant_recu) || 0), 0);
  const parStatut = sponsors.reduce((acc, s) => {
    acc[s.statut] = (acc[s.statut] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="admin-shell">
      <Head>
        <title>Aperçu — admin Pop-Up SLA</title>
      </Head>
      <AdminTopbar active="dashboard" />
      <main className="admin-main">
        <h1 style={{ fontFamily: 'var(--serif)', marginBottom: 24 }}>Aperçu</h1>

        {loading ? (
          <p>Chargement…</p>
        ) : (
          <>
            <div className="form-grid" style={{ marginBottom: 24 }}>
              <div className="admin-card">
                <h2 style={{ marginBottom: 8 }}>Commandites promises</h2>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '2rem' }}>
                  {totalPromis.toLocaleString('fr-CA')} $
                </div>
              </div>
              <div className="admin-card">
                <h2 style={{ marginBottom: 8 }}>Reçu à ce jour</h2>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '2rem' }}>
                  {totalRecu.toLocaleString('fr-CA')} $
                </div>
              </div>
            </div>

            <div className="admin-card">
              <h2>Commanditaires par statut</h2>
              {sponsors.length === 0 ? (
                <p style={{ color: 'var(--ink-soft)' }}>
                  Aucun commanditaire encore. Ajoutez-en un dans l'onglet Commandites.
                </p>
              ) : (
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                  {Object.entries(parStatut).map(([statut, count]) => (
                    <div key={statut}>
                      <div style={{ fontFamily: 'var(--serif)', fontSize: '1.6rem' }}>{count}</div>
                      <div style={{ color: 'var(--ink-soft)', fontSize: '0.88rem' }}>{statut}</div>
                    </div>
                  ))}
                </div>
              )}
              <div className="form-actions">
                <Link href="/admin/commandites" className="btn-small">
                  Gérer les commandites →
                </Link>
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
      <AdminDashboard />
    </AdminGuard>
  );
}
