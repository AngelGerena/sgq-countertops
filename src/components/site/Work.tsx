import { useContent } from '../../lib/SiteContentProvider';

/* Two real photos from Cesar's installs (the same job the hero uses) plus
   two material-style tiles, honestly labeled as materials — never fake jobs.
   Swap tiles for <img> entries as more licensed job photos land in `media`. */

export default function Work() {
  const { t } = useContent();
  return (
    <section className="band" id="work">
      <div className="band-in">
        <span className="eyebrow reveal">{t('work.eyebrow', 'The work', 'El trabajo')}</span>
        <h2 className="reveal">{t('work.title', 'Recent work', 'Trabajos recientes')}</h2>
        <p className="band-lede reveal">
          {t('work.intro',
            'Kitchens across Volusia, Seminole and Orange County. Every one measured, fabricated and installed by Cesar and his crew.',
            'Cocinas en los condados de Volusia, Seminole y Orange. Cada una medida, fabricada e instalada por Cesar y su equipo.')}
        </p>
        <div className="work-grid">
          <figure className="work-tile feature reveal">
            <img src="/images/hero-wide-1200.jpg" alt="Black quartz countertop with white veining and gold hardware"
              loading="lazy" decoding="async" />
            <figcaption>
              <span className="cap-town">{t('work.tile1.town', 'Deltona', 'Deltona')}</span>
              {t('work.tile1.cap', 'Black quartz · white veining · gold hardware', 'Cuarzo negro · vetas blancas · herrajes dorados')}
            </figcaption>
          </figure>
          <figure className="work-tile reveal">
            <img src="/images/hero-tall-700.jpg" alt="Black quartz backsplash and countertop installation detail"
              loading="lazy" decoding="async" />
            <figcaption>
              <span className="cap-town">{t('work.tile2.town', 'Full-height backsplash', 'Salpicadero completo')}</span>
              {t('work.tile2.cap', 'Countertop & matching backsplash', 'Encimera y salpicadero a juego')}
            </figcaption>
          </figure>
          <figure className="work-tile t-a reveal">
            <figcaption>
              <span className="cap-town">{t('work.tile3.town', 'Material', 'Material')}</span>
              {t('work.tile3.cap', 'Calacatta-look quartz', 'Cuarzo estilo Calacatta')}
            </figcaption>
          </figure>
          <figure className="work-tile t-b feature reveal">
            <figcaption>
              <span className="cap-town">{t('work.tile4.town', 'Material', 'Material')}</span>
              {t('work.tile4.cap', 'Midnight granite', 'Granito medianoche')}
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
