import { useContent } from '../../lib/SiteContentProvider';

export default function Hero() {
  const { t } = useContent();
  return (
    <section className="hero" id="top">
      {/* Browser picks the file that fits the viewport, so large displays get a
          sharp source instead of an upscaled one. */}
      <picture className="hero-photo">
        <source
          media="(max-width: 640px)"
          srcSet="/images/hero-tall-700.jpg 700w, /images/hero-tall-1100.jpg 1100w"
          sizes="100vw"
        />
        <img
          src="/images/hero-wide-1600.jpg"
          srcSet="/images/hero-wide-1200.jpg 1200w, /images/hero-wide-1600.jpg 1600w, /images/hero-wide-2048.jpg 2048w"
          sizes="100vw"
          alt=""
          decoding="async"
          fetchPriority="high"
        />
      </picture>

      <div className="hero-scrim" aria-hidden="true" />
      <div className="hero-rule" aria-hidden="true" />

      <div className="hero-in">
        <div className="hero-row">
          <div className="hero-side left">
            <span className="kicker">{t('hero.kicker', 'Central Florida', 'Centro de Florida')}</span>
            <span className="h-part">
              {t('hero.headline_a', 'Measured', 'Medido')}<br />
              {t('hero.headline_b', 'twice.', 'dos veces.')}
            </span>
          </div>

          <picture className="crest-wrap">
            <source
              type="image/webp"
              srcSet="/images/crest-280.webp 280w, /images/crest-420.webp 420w, /images/crest-560.webp 560w"
              sizes="(max-width: 640px) 56vw, 22vw"
            />
            <img
              className="crest"
              src="/images/crest-420.png"
              srcSet="/images/crest-280.png 280w, /images/crest-420.png 420w, /images/crest-560.png 560w"
              sizes="(max-width: 640px) 56vw, 22vw"
              width="991" height="1249"
              alt="Santiago's Granite and Quartz"
            />
          </picture>

          <div className="hero-side right">
            <span className="kicker">{t('hero.kicker_b', 'Since 2000', 'Desde el 2000')}</span>
            <span className="h-part">
              {t('hero.headline_c', 'Installed', 'Instalado')}<br />
              {t('hero.headline_d', 'once.', 'una vez.')}
            </span>
          </div>
        </div>

        {/* single-block headline, phones only */}
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
