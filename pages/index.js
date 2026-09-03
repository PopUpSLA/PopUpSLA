import Head from 'next/head';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';

const FALLBACK_CONTENT = {
  mission_text:
    "Soutenons Leur Avenir organise des soirées gastronomiques pour financer la recherche sur la sclérose latérale amyotrophique, en partenariat avec SLA Québec. Trois ami·e·s, une cuisine empruntée pour une soirée, et une salle qui répond présent.",
  photos: [],
};

const FALLBACK_EDITIONS = [
  {
    id: 'fallback-1',
    titre: 'Édition 1 — 29 août 2026',
    lignes: [
      { label: 'Date', valeur: '29 août 2026' },
      { label: 'Restaurant', valeur: 'Madame B, Sherbrooke' },
      { label: 'Invités', valeur: '63' },
      { label: 'Services', valeur: '7' },
      { label: 'Montant amassé', valeur: '13 000 $+' },
    ],
  },
];

export async function getServerSideProps() {
  const [{ data: content }, { data: editions }, { data: partenaires }] = await Promise.all([
    supabase.from('site_content').select('mission_text, photos').eq('id', 1).maybeSingle(),
    supabase.from('editions').select('id, titre, lignes').order('ordre', { ascending: true }),
    supabase
      .from('sponsors_public')
      .select('id, nom, logo_url')
      .order('created_at', { ascending: true }),
  ]);

  return {
    props: {
      content: content || FALLBACK_CONTENT,
      editions: editions && editions.length ? editions : FALLBACK_EDITIONS,
      partenaires: partenaires || [],
    },
  };
}

export default function Home({ content, editions, partenaires }) {
  const photos = content.photos && content.photos.length ? content.photos : [];
  const missionText = content.mission_text || FALLBACK_CONTENT.mission_text;

  const galleryShapes = ['g-wide', 'g-tall', 'g-tall', 'g-wide', 'g-wide', 'g-tall'];
  const gallerySlots = Array.from({ length: 6 }, (_, i) => photos[i] || null);

  return (
    <>
      <Head>
        <title>Soutenons Leur Avenir — soirées gastronomiques pour la recherche sur la SLA</title>
        <meta
          name="description"
          content="Soirées gastronomiques au profit de la recherche sur la SLA, en partenariat avec SLA Québec."
        />
      </Head>

      <header className="site-header">
        <Link href="/" className="wordmark">
          Soutenons Leur <span>Avenir</span>
        </Link>
        <nav className="site-nav">
          <a href="#mission">Mission</a>
          <a href="#editions">Nos éditions</a>
          <Link href="/commandites">Devenir partenaire</Link>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <section className="hero hero-single" style={{ borderTop: 'none' }}>
        <div>
          <h1>Sept services, une salle pleine, un geste concret pour la recherche sur la SLA.</h1>
          <p className="lede">
            Soutenons Leur Avenir transforme une soirée gastronomique en financement direct pour
            la recherche sur la sclérose latérale amyotrophique, en partenariat avec SLA Québec.
          </p>
          <div className="cta-row">
            <Link href="/commandites" className="btn btn-primary">
              Devenir partenaire
            </Link>
            <a href="#mission" className="btn btn-ghost">
              Notre mission
            </a>
          </div>
        </div>
      </section>

      <section id="mission">
        <div className="wrap">
          <div className="section-head">
            <span className="kicker section-num">01</span>
            <h2>Notre mission</h2>
          </div>
          <p className="prose prose-lede">{missionText}</p>
        </div>
      </section>

      <section id="editions">
        <div className="wrap">
          <div className="section-head">
            <span className="kicker section-num">02</span>
            <h2>Nos éditions</h2>
            <p className="prose" style={{ marginTop: 12 }}>
              Faites glisser pour voir chaque édition.
            </p>
          </div>
          <div className="editions-scroll">
            {editions.map((edition) => (
              <div className="receipt edition-card" key={edition.id}>
                <div className="receipt-title">{edition.titre}</div>
                {(edition.lignes || []).map((ligne, i) => (
                  <div className="receipt-row" key={i}>
                    <span className="label">{ligne.label}</span>
                    <span className="value">{ligne.valeur}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="soiree">
        <div className="wrap">
          <div className="section-head">
            <span className="kicker section-num">03</span>
            <h2>La soirée en images</h2>
          </div>
          <div className="gallery">
            {gallerySlots.map((photo, i) =>
              photo ? (
                <img
                  key={i}
                  src={photo.url}
                  alt={photo.alt || 'Photo de la soirée Soutenons Leur Avenir'}
                  className={galleryShapes[i]}
                />
              ) : (
                <div key={i} className={`g-empty ${galleryShapes[i]}`}>
                  Photo à venir
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {partenaires.length > 0 && (
        <section id="partenaires">
          <div className="wrap">
            <div className="section-head">
              <span className="kicker section-num">04</span>
              <h2>Nos partenaires</h2>
              <p className="prose" style={{ marginTop: 12 }}>
                Merci aux entreprises qui rendent chaque édition possible.
              </p>
            </div>
            <div className="partners-wall">
              {partenaires.map((p) =>
                p.logo_url ? (
                  <img key={p.id} src={p.logo_url} alt={p.nom} className="partner-logo" title={p.nom} />
                ) : (
                  <div key={p.id} className="partner-name">
                    {p.nom}
                  </div>
                )
              )}
            </div>
          </div>
        </section>
      )}

      <section>
        <div className="wrap">
          <div className="section-head">
            <h2>Vous représentez une entreprise ?</h2>
            <p className="prose" style={{ marginTop: 12 }}>
              La prochaine édition se prépare. Les commandites financent directement le repas, le
              service et la salle, pour que chaque dollar récolté aille à la recherche.
            </p>
          </div>
          <Link href="/commandites" className="btn btn-primary">
            Devenir partenaire
          </Link>
        </div>
      </section>

      <footer className="site-footer" id="contact">
        <div className="wrap">
          <div>
            <div className="wordmark" style={{ color: 'var(--cream)' }}>
              Soutenons Leur <span style={{ color: '#e3b06b' }}>Avenir</span>
            </div>
            <p style={{ marginTop: 14, opacity: 0.85, maxWidth: '40ch' }}>
              Soutenons Leur Avenir — en partenariat avec SLA Québec.
            </p>
            <div className="fine">© {new Date().getFullYear()} Soutenons Leur Avenir</div>
          </div>
          <div>
            <p style={{ marginBottom: 8, opacity: 0.7 }}>Nous joindre</p>
            <a href="mailto:info@popupsla.ca">info@popupsla.ca</a>
          </div>
        </div>
      </footer>
    </>
  );
}
