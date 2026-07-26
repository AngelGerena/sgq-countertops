import { Link } from 'react-router-dom';
import { useContent } from '../lib/SiteContentProvider';

export default function Home() {
  const { t, lang, setLang } = useContent();

  return (
    <div className="site">
      <header className="site-head">
        <div className="brand">Santiago's Granite &amp; Quartz</div>
        <div className="lang-toggle" role="group" aria-label="Language">
          <button aria-pressed={lang === 'en'} onClick={() => setLang('en')}>EN</button>
          <button aria-pressed={lang === 'es'} onClick={() => setLang('es')}>ES</button>
        </div>
      </header>

      <section className="hero">
        <h1>{t('hero.headline', 'Measured twice. Installed once.', 'Medido dos veces. Instalado una vez.')}</h1>
        <p>{t('hero.subhead',
          'Granite and quartz countertops, and the cabinets underneath them. Twenty-five years in Central Florida.',
          'Encimeras de granito y cuarzo, y los gabinetes debajo. Veinticinco años en Florida Central.')}</p>
        <a className="btn gold" href="#contact">
          {t('hero.cta', 'Get a free estimate', 'Solicite un estimado gratis')}
        </a>
      </section>

      <section className="band">
        <h2>{t('about.title', 'Built by the man who does the work', 'Hecho por quien hace el trabajo')}</h2>
        <p>{t('about.body',
          'Cesar Santiago has been fabricating and installing stone for over twenty-five years.',
          'Cesar Santiago lleva más de veinticinco años fabricando e instalando piedra.')}</p>
      </section>

      <footer className="site-foot">
        <p>{t('footer.tagline', 'Volusia, Seminole, Orange and surrounding.', 'Volusia, Seminole, Orange y alrededores.')}</p>
        <Link to="/admin" className="admin-link">Portal</Link>
      </footer>
    </div>
  );
}
