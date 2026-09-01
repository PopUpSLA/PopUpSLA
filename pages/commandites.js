import Head from 'next/head';
import Link from 'next/link';

const TIERS = [
  {
    nom: 'Ami de la table',
    montant: '250 $',
    avantages: ['Nom sur la page des commanditaires', 'Remerciement pendant la soirée'],
  },
  {
    nom: 'Soutien',
    montant: '750 $',
    avantages: [
      'Logo sur le menu imprimé de la soirée',
      'Mention sur les réseaux sociaux',
      '1 place à la soirée',
    ],
  },
  {
    nom: 'Bienfaiteur',
    montant: '1 500 $',
    avantages: [
      'Logo affiché sur place',
      '2 places à la soirée',
      'Mention dans toutes les communications',
    ],
  },
  {
    nom: 'Présentateur de la soirée',
    montant: '3 000 $ et plus',
    avantages: [
      "Nom associé à l'édition (« présentée par »)",
      'Table réservée pour votre équipe',
      'Visibilité complète : site, menu, réseaux, soirée',
    ],
  },
];

export default function Commandites() {
  return (
    <>
      <Head>
        <title>Devenir commanditaire — Pop-Up SLA</title>
        <meta
          name="description"
          content="Paliers de commandite pour la prochaine édition de Pop-Up SLA, au profit de SLA Québec."
        />
      </Head>

      <header className="site-header">
        <Link href="/" className="wordmark">
          Pop-Up <span>SLA</span>
        </Link>
        <nav className="site-nav">
          <Link href="/#mission">Mission</Link>
          <Link href="/#soiree">La soirée</Link>
          <a href="#paliers">Commandites</a>
          <a href="#discuter">Contact</a>
        </nav>
      </header>

      <section className="hero" style={{ borderTop: 'none', gridTemplateColumns: '1fr' }}>
        <div style={{ maxWidth: 680 }}>
          <h1>Votre entreprise peut porter la prochaine édition.</h1>
          <p className="lede">
            Les commandites couvrent le coût de la soirée — repas, service, salle — pour que chaque
            dollar amassé auprès des invités aille directement à la recherche sur la SLA, en
            partenariat avec SLA Québec.
          </p>
        </div>
      </section>

      <section id="paliers">
        <div className="wrap">
          <div className="section-head">
            <h2>Paliers de commandite</h2>
            <p className="prose" style={{ marginTop: 12 }}>
              Un aperçu pour la prochaine édition — les détails exacts (date, lieu, nombre de
              places) suivront avec chaque commanditaire confirmé.
            </p>
          </div>
          <div className="tiers">
            {TIERS.map((tier, i) => (
              <div className="tier" key={tier.nom}>
                <div className="tier-index">Palier {i + 1}</div>
                <h3>{tier.nom}</h3>
                <div className="tier-amount">{tier.montant}</div>
                <ul>
                  {tier.avantages.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="discuter">
        <div className="wrap">
          <div className="section-head">
            <h2>Discutons de votre implication</h2>
            <p className="prose" style={{ marginTop: 12 }}>
              Chaque commandite peut être ajustée selon vos objectifs de visibilité. Écrivez-nous et
              nous vous revenons rapidement.
            </p>
          </div>
          <a
            className="btn btn-primary"
            href="mailto:info@popupsla.ca?subject=Commandite%20Pop-Up%20SLA"
          >
            Écrire à info@popupsla.ca
          </a>
        </div>
      </section>

      <footer className="site-footer">
        <div className="wrap">
          <div>
            <div className="wordmark" style={{ color: 'var(--cream)' }}>
              Pop-Up <span style={{ color: '#e3b06b' }}>SLA</span>
            </div>
            <p style={{ marginTop: 14, opacity: 0.85, maxWidth: '40ch' }}>
              Soutenons Leur Avenir — en partenariat avec SLA Québec.
            </p>
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
