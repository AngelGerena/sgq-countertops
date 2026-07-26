import { useContent } from '../../lib/SiteContentProvider';

export default function Hero() {
  const { t } = useContent();
  return (
    <section className="hero" id="top">
      <div className="hero-photo" aria-hidden="true" />
      <div className="hero-scrim" aria-hidden="true" />
      <div className="hero-rule" aria-hidden="true" />

      <div className="hero-in">
        {/* three columns on desktop, one on mobile */}
        <div className="hero-row">
          <div className="hero-side left">
            <span className="kicker">{t('hero.kicker', 'Central Florida', 'Centro de Florida')}</span>
            <span className="h-part">{t('hero.headline_a', 'Measured', 'Medido')}<br />
              {t('hero.headline_b', 'twice.', 'dos veces.')}</span>
          </div>

          <img className="crest" src="/images/sgq-logo-full.png" width="280"
               alt="Santiago's Granite and Quartz" />

          <div className="hero-side right">
            <span className="kicker">{t('hero.kicker_b', 'Since 2000', 'Desde el 2000')}</span>
            <span className="h-part">{t('hero.headline_c', 'Installed', 'Instalado')}<br />
              {t('hero.headline_d', 'once.', 'una vez.')}</span>
          </div>
        </div>

        {/* single-block headline, mobile only — the split reads badly stacked */}
        <h1 className="hero-h1-stacked">
          {t('hero.headline', 'Measured twice. Installed once.',
                              'Medido dos veces. Instalado una vez.')}
        </h1>

        <p className="lede">
          {t('hero.subhead',
            'Twenty-five years fabricating and installing stone across Central Florida.',
            'Veinticinco años fabricando e instalando piedra en el Centro de Florida.')}
        </p>

        <div className="hero-cta">
          <a className="btn gold" href="#quote">
            {t('hero.cta', 'Get a free estimate', 'Solicite un estimado gratis')}
          </a>
          <a className="btn ghost-light" href="#work">
            {t('hero.cta_secondary', 'See the work', 'Ver trabajos')}
          </a>
        </div>
      </div>
    </section>
  );
}
