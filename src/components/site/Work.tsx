import { useContent } from '../../lib/SiteContentProvider';

/* Placeholder tiles until Cesar's licensed job photos are loaded into `media`.
   Swap the class for an <img> once they exist. */
const TILES = [
  { k: 'a', label: 'Deltona · Calacatta quartz' },
  { k: 'b', label: 'DeBary · Black quartz waterfall' },
  { k: 'c', label: 'Orange City · White shaker galley' },
  { k: 'd', label: 'Sanford · Island with farmhouse sink' }
];

export default function Work() {
  const { t } = useContent();
  return (
    <section className="band" id="work">
      <div className="band-in">
        <h2>{t('work.title', 'Recent work', 'Trabajos recientes')}</h2>
        <p className="band-lede">
          {t('work.intro',
            'Kitchens across Volusia, Seminole and Orange County. Every one measured, fabricated and installed by Cesar and his crew.',
            'Cocinas en los condados de Volusia, Seminole y Orange. Cada una medida, fabricada e instalada por Cesar y su equipo.')}
        </p>
        <div className="work-grid">
          {TILES.map(tile => (
            <figure className={'work-tile t-' + tile.k} key={tile.k}>
              <figcaption>{tile.label}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
