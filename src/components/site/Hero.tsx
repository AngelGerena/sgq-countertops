import { useContent } from '../../lib/SiteContentProvider';

export default function Hero() {
  const { t } = useContent();
  return (
    <section className="hero" id="top">
      <svg className="hero-veins" viewBox="0 0 1200 620" preserveAspectRatio="none" aria-hidden="true">
        <g fill="none" stroke="#C9A227" strokeOpacity=".3">
          <path d="M-20 128 C 190 92, 320 210, 520 172 S 880 74, 1220 148" strokeWidth="1.1" />
          <path d="M-20 246 C 240 300, 400 176, 640 236 S 940 320, 1220 258" strokeWidth=".7" strokeOpacity=".2" />
          <path d="M-20 430 C 210 386, 386 500, 610 452 S 950 372, 1220 440" strokeWidth="1" />
          <path d="M140 -20 C 196 160, 118 300, 190 470 S 236 580, 208 640" strokeWidth=".6" strokeOpacity=".18" />
          <path d="M910 -20 C 962 150, 880 288, 946 452 S 1000 566, 968 640" strokeWidth=".6" strokeOpacity=".18" />
        </g>
      </svg>

      <div className="hero-in">
        <img className="crest" src="images/sgq-logo-full.png"
          alt="Santiago's Granite and Quartz" width="512" height="645" />

        <span className="kicker">
          {t('hero.kicker', 'Central Florida · Licensed & Insured',
                            'Centro de Florida · Con licencia y asegurado')}
        </span>

        <h1>{t('hero.headline', 'Measured twice. Installed once.',
                                'Medido dos veces. Instalado una vez.')}</h1>

        <p className="lede">
          {t('hero.subhead',
            'Twenty-five years fabricating and installing granite, quartz and custom cabinetry across Central Florida. Measured, cut and installed by the same hands.',
            'Veinticinco años fabricando e instalando granito, cuarzo y gabinetes a la medida en el Centro de Florida. Medido, cortado e instalado por las mismas manos.')}
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
