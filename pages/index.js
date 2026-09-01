import Head from 'next/head';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';

const FALLBACK_CONTENT = {
  mission_text:
    "Pop-Up SLA (Soutenons Leur Avenir) organise des soirées gastronomiques pour financer la recherche sur la sclérose latérale amyotrophique, en partenariat avec SLA Québec. Trois ami·e·s, une cuisine empruntée pour une soirée, et une salle qui répond présent.",
  stats: {
    date: '29 août 2026',
    lieu: 'Restaurant Madame B, Sherbrooke',
    invites: 63,
    montant: '13 000 $+',
    services: 7,
  },
  photos: [],
};

export async function getServerSideProps() {
  const { data } = await supabase
    .from('site_content')
    .select('mission_text, stats, photos')
    .eq('id', 1)
    .maybeSingle();

  return {
    props: {
      content: data || FALLBACK_CONTENT,
    },
  };
}

export default function Home({ content }) {
  const stats = content.stats || FALLBACK_CONTENT.stats;
  const photos = content.photos && content.photos.length ? content.photos : [];
  const missionText = content.mission_text || FALLBACK_CONTENT.mission_text;

  const galleryShapes = ['g-wide', 'g-tall', 'g-tall', 'g-wide', 'g-wide', 'g-tall'];
  const gallerySlots = Array.from({ length: 6 }, (_, i) => photos[i] || null);

  return (
    <>
      <Head>
        <title>Pop-Up SLA — Soutenons Leur Avenir</title>
        <meta
          name="description"
          content="Soirées gastronomiques au profit de la recherche sur la SLA, en partenariat avec SLA Québec."
        />
      </Head>

      <header className="site-header">
        <Link href="/" className="wordmark">
          Pop-Up <span>SLA</span>
        </Link>
        <nav className="site-nav">
          <a href="#mission">Mission</a>
          <a href="#soiree">La soirée</a>
          <Link href="/commandites">Commandites</Link>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <section className="hero" style={{ borderTop: 'none' }}>
        <div>
          <h1>Sept services, une salle pleine, un geste concret pour la recherche sur la SLA.</h1>
          <p className="lede">
            Pop-Up SLA transforme une soirée gastronomique en financement direct pour la recherche
            sur la sclérose latérale amyotrophique, en partenariat avec SLA Québec.
          </p>
          <div className="cta-row">
            <Link href="/commandites" className="btn btn-primary">
              Devenir commanditaire
            </Link>
            <a href="#mission" className="btn btn-ghost">
              Notre mission
            </a>
          </div>
        </div>

        <div className="receipt">
          <div className="receipt-title">Édition 1 — {stats.date}</div>
          <div className="receipt-row">
            <span className="label">Restaurant</span>
            <span className="value">{stats.lieu}</span>
          </div>
          <div className="receipt-row">
            <span className="label">Invités</span>
            <span className="value">{stats.invites}</span>
          </div>
          <div className="receipt-row">
            <span className="label">Services</span>
            <span className="value">{stats.services}</span>
          </div>
          <div className="receipt-row">
            <span className="label">Amassé pour SLA Québec</span>
            <span className="value">{stats.montant}</span>
          </div>
        </div>
      </section>

      <section id="mission">
        <div className="wrap">
          <div className="section-head">
            <h2>Notre mission</h2>
          </div>
          <p className="prose">{missionText}</p>
        </div>
      </section>

      <section id="soiree">
        <div className="wrap">
          <div className="section-head">
            <span className="kicker">
              {stats.date} · {stats.lieu}
            </span>
            <h2>La soirée en images</h2>
          </div>
          <div className="gallery">
            {gallerySlots.map((photo, i) =>
              photo ? (
                <img
                  key={i}
                  src={photo.url}
                  alt={photo.alt || 'Photo de la soirée Pop-Up SLA'}
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
            Voir les paliers de commandite
          </Link>
        </div>
      </section>

      <footer className="site-footer" id="contact">
        <div className="wrap">
          <div>
            <div className="wordmark" style={{ color: 'var(--cream)' }}>
              Pop-Up <span style={{ color: '#e3b06b' }}>SLA</span>
            </div>
            <p style={{ marginTop: 14, opacity: 0.85, maxWidth: '40ch' }}>
              Soutenons Leur Avenir — en partenariat avec SLA Québec.
            </p>
            <div className="fine">© {new Date().getFullYear()} Pop-Up SLA</div>
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
