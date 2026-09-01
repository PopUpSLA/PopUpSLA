import { useEffect, useState } from 'react';
import Head from 'next/head';
import AdminGuard from '../../components/AdminGuard';
import AdminTopbar from '../../components/AdminTopbar';
import { supabase } from '../../lib/supabaseClient';

const DEFAULT_STATS = { date: '', lieu: '', invites: '', montant: '', services: '' };

function ContentAdmin() {
  const [missionText, setMissionText] = useState('');
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('site_content')
        .select('mission_text, stats, photos')
        .eq('id', 1)
        .maybeSingle();
      if (data) {
        setMissionText(data.mission_text || '');
        setStats({ ...DEFAULT_STATS, ...(data.stats || {}) });
        setPhotos(data.photos || []);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    setError('');
    const { error } = await supabase.from('site_content').upsert({
      id: 1,
      mission_text: missionText,
      stats,
      photos,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) {
      setError("Erreur lors de l'enregistrement : " + error.message);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');

    const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
    const { error: uploadError } = await supabase.storage.from('photos').upload(path, file);

    if (uploadError) {
      setError("Erreur lors de l'envoi de la photo : " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from('photos').getPublicUrl(path);
    setPhotos((prev) => [...prev, { url: publicUrlData.publicUrl, alt: '', path }]);
    setUploading(false);
    e.target.value = '';
  }

  async function removePhoto(index) {
    const photo = photos[index];
    if (photo?.path) {
      await supabase.storage.from('photos').remove([photo.path]);
    }
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  if (loading) {
    return (
      <div className="admin-shell">
        <AdminTopbar active="content" />
        <div className="admin-loading">Chargement du contenu…</div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <Head>
        <title>Contenu du site — admin Pop-Up SLA</title>
      </Head>
      <AdminTopbar active="content" />
      <main className="admin-main">
        <h1 style={{ fontFamily: 'var(--serif)', marginBottom: 24 }}>Contenu du site</h1>

        <div className="admin-card">
          <h2>Mission</h2>
          <div className="form-field full">
            <label>Texte affiché sur la page d'accueil</label>
            <textarea
              rows={6}
              value={missionText}
              onChange={(e) => setMissionText(e.target.value)}
            />
          </div>
        </div>

        <div className="admin-card">
          <h2>Statistiques de l'édition en vedette</h2>
          <div className="form-grid">
            <div className="form-field">
              <label>Date</label>
              <input
                placeholder="29 août 2026"
                value={stats.date}
                onChange={(e) => setStats({ ...stats, date: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Restaurant / lieu</label>
              <input
                placeholder="Restaurant Madame B, Sherbrooke"
                value={stats.lieu}
                onChange={(e) => setStats({ ...stats, lieu: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Invités</label>
              <input
                placeholder="63"
                value={stats.invites}
                onChange={(e) => setStats({ ...stats, invites: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Services</label>
              <input
                placeholder="7"
                value={stats.services}
                onChange={(e) => setStats({ ...stats, services: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Montant amassé</label>
              <input
                placeholder="13 000 $+"
                value={stats.montant}
                onChange={(e) => setStats({ ...stats, montant: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="admin-card">
          <h2>Photos de la soirée</h2>
          <p style={{ color: 'var(--ink-soft)', fontSize: '0.92rem' }}>
            Les 6 premières photos apparaissent dans la galerie de la page d'accueil.
          </p>
          <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} />
          {uploading && <p style={{ fontSize: '0.88rem' }}>Envoi en cours…</p>}
          <div className="photo-grid">
            {photos.map((photo, i) => (
              <div className="photo-item" key={photo.path || photo.url}>
                <img src={photo.url} alt={photo.alt || ''} />
                <button className="remove-photo" onClick={() => removePhoto(i)} title="Retirer">
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {error && <div className="error-text" style={{ marginBottom: 12 }}>{error}</div>}

        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Enregistrement…' : 'Enregistrer les changements'}
        </button>
        {saved && <span style={{ marginLeft: 14, color: 'var(--ink-soft)' }}>Enregistré ✓</span>}
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <AdminGuard>
      <ContentAdmin />
    </AdminGuard>
  );
}
