import Head from 'next/head';
import Link from 'next/link';
import { useEffect } from 'react';
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

// Additionne toutes les lignes de type "montant/amassé" trouvées dans les éditions,
// pour afficher un total qui se met à jour automatiquement à chaque nouvelle édition ajoutée.
function calculerTotalAmasse(editions) {
  let total = 0;
  editions.forEach((edition) => {
    (edition.lignes || []).forEach((ligne) => {
      if (/montant|amass/i.test(ligne.label || '')) {
        const digits = (ligne.valeur || '').replace(/[^\d]/g, '');
        if (digits) total += parseInt(digits, 10);
      }
    });
  });
  return total;
}

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
  const totalAmasse = calculerTotalAmasse(editions);

  const galleryShapes = ['g-wide', 'g-tall', 'g-tall', 'g-wide', 'g-wide', 'g-tall'];
  const gallerySlots = Array.from({ length: 6 }, (_, i) => photos[i] || null);

  // Anime légèrement les éléments marqués .reveal quand ils entrent dans l'écran.
  // Sans JS, ces éléments restent simplement visibles normalement (voir globals.css).
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const els = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('play-in');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [editions.length, partenaires.length, photos.length]);

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
        <div className="wrap mission-grid">
          <div>
            <div className="section-head">
              <span className="kicker section-num">01</span>
              <h2>Notre mission</h2>
            </div>
            <p className="prose prose-lede">{missionText}</p>
          </div>
          {totalAmasse > 0 && (
            <div className="impact-stat reveal">
              <div className="impact-number">{totalAmasse.toLocaleString('fr-CA')} $</div>
              <div className="impact-label">amassés à ce jour pour la recherche sur la SLA</div>
            </div>
          )}
        </div>
      </section>

      <section id="editions">
        <div className="wrap">
          <div className="section-head">
            <span className="kicker section-num">02</span>
            <h2>Nos éditions</h2>
            <p className="prose editions-hint" style={{ marginTop: 12 }}>
              Faites glisser pour voir chaque édition <span className="hint-arrow">→</span>
            </p>
          </div>
          <div className="editions-scroll">
            {editions.map((edition, i) => (
              <div
                className="receipt edition-card reveal"
                key={edition.id}
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <div className="receipt-title">{edition.titre}</div>
                {(edition.lignes || []).map((ligne, j) => (
                  <div className="receipt-row" key={j}>
                    <span className="label">{ligne.label}</span>
                    <span className="value">{ligne.valeur}</span>
                  </div>
                ))}
              </div>
            ))}
            <Link
              href="/commandites"
              className="edition-card next-edition-card reveal"
              style={{ animationDelay: `${editions.length * 90}ms` }}
            >
              <div className="next-edition-plus">+</div>
              <div className="next-edition-text">
                La prochaine édition se prépare.
                <br />
                Devenez partenaire
              </div>
            </Link>
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
              {partenaires.map((p, i) =>
                p.logo_url ? (
                  <img
                    key={p.id}
                    src={p.logo_url}
                    alt={p.nom}
                    className="partner-logo reveal"
                    title={p.nom}
                    style={{ animationDelay: `${i * 60}ms` }}
                  />
                ) : (
                  <div
                    key={p.id}
                    className="partner-name reveal"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
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
