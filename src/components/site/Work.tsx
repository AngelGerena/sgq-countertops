import { useContent } from '../../lib/SiteContentProvider';

/* All ten tiles are real photos from Cesar's installs — countertops,
   full-height backsplashes and cabinet jobs. No placeholder material
   tiles; every image in this grid is licensed job photography. */

const TILES: {
  src: string; alt: string; feature?: boolean;
  town: [string, string]; cap: [string, string]; key: string;
}[] = [
  {
    key: 'tile1', feature: true,
    src: '/images/work/job-black-quartz-island.webp',
    alt: 'Black quartz island with white veining, gold faucet and white shaker cabinets',
    town: ['Deltona', 'Deltona'],
    cap: ['Black quartz island · gold fixtures · white shaker cabinets',
          'Isla de cuarzo negro · grifería dorada · gabinetes shaker blancos'],
  },
  {
    key: 'tile2',
    src: '/images/work/job-black-quartz-run.webp',
    alt: 'Black quartz countertop with matching full-height backsplash and gold hardware',
    town: ['Full-height backsplash', 'Salpicadero completo'],
    cap: ['Countertop & matching backsplash', 'Encimera y salpicadero a juego'],
  },
  {
    key: 'tile3', feature: true,
    src: '/images/work/job-calacatta-island.webp',
    alt: 'Calacatta-look quartz island over a deep green shaker base with farmhouse sink',
    town: ['Kitchen remodel', 'Remodelación de cocina'],
    cap: ['Calacatta quartz · farmhouse sink · island seating',
          'Cuarzo Calacatta · fregadero campestre · isla con asientos'],
  },
  {
    key: 'tile4',
    src: '/images/work/job-calacatta-niche.webp',
    alt: 'Full-slab Calacatta quartz range niche between white shaker cabinets',
    town: ['Full-slab niche', 'Nicho de losa completa'],
    cap: ['Wrapped range wall in Calacatta quartz',
          'Pared de estufa forrada en cuarzo Calacatta'],
  },
  {
    key: 'tile5', feature: true,
    src: '/images/work/job-white-shaker-peninsula.webp',
    alt: 'White shaker cabinets with quartz peninsula, brick backsplash and under-cabinet lighting',
    town: ['Cabinets & counters', 'Gabinetes y encimeras'],
    cap: ['White shaker cabinets · quartz peninsula · brick backsplash',
          'Gabinetes shaker blancos · península de cuarzo · salpicadero de ladrillo'],
  },
  {
    key: 'tile6',
    src: '/images/work/job-shaker-pantry.webp',
    alt: 'Floor-to-ceiling white shaker pantry cabinets with black hardware and quartz counter',
    town: ['Pantry wall', 'Pared de despensa'],
    cap: ['Floor-to-ceiling shaker pantry storage',
          'Despensa shaker de piso a techo'],
  },
  {
    key: 'tile9', feature: true,
    src: '/images/work/job-coastal-island.webp',
    alt: 'Long white kitchen island with seating for four and blue glass tile backsplash',
    town: ['Entertainer\u2019s island', 'Isla para reuniones'],
    cap: ['Oversize island · seating for four',
          'Isla de gran formato · asientos para cuatro'],
  },
  {
    key: 'tile8',
    src: '/images/work/job-calacatta-vanity.webp',
    alt: 'Calacatta quartz vanity top with backsplash on white shaker cabinets',
    town: ['Laundry & bath', 'Lavandería y baño'],
    cap: ['Calacatta quartz on shaker bases',
          'Cuarzo Calacatta sobre bases shaker'],
  },
  {
    key: 'tile10', feature: true,
    src: '/images/work/job-white-island-espresso.webp',
    alt: 'Cream quartzite island against espresso cabinets with glass mosaic backsplash',
    town: ['Two-tone kitchen', 'Cocina de dos tonos'],
    cap: ['Light stone island over espresso cabinetry',
          'Isla de piedra clara sobre gabinetes espresso'],
  },
  {
    key: 'tile7',
    src: '/images/work/job-white-shaker-range.webp',
    alt: 'White shaker cabinet range wall with quartz counters and travertine brick backsplash',
    town: ['Full kitchen', 'Cocina completa'],
    cap: ['Cabinets, counters & backsplash in one job',
          'Gabinetes, encimeras y salpicadero en un solo trabajo'],
  },
];

export default function Work() {
  const { t } = useContent();
  return (
    <section className="band" id="work">
      <div className="band-in">
        <span className="eyebrow reveal">{t('work.eyebrow', 'The work', 'El trabajo')}</span>
        <h2 className="reveal">{t('work.title', 'Recent work', 'Trabajos recientes')}</h2>
        <p className="band-lede reveal">
          {t('work.intro',
            'Countertops, cabinets and full kitchens across Volusia, Seminole and Orange County. Every one measured, fabricated and installed by Cesar and his crew.',
            'Encimeras, gabinetes y cocinas completas en los condados de Volusia, Seminole y Orange. Cada una medida, fabricada e instalada por Cesar y su equipo.')}
        </p>
        <div className="work-grid">
          {TILES.map(tile => (
            <figure key={tile.key} className={'work-tile reveal' + (tile.feature ? ' feature' : '')}>
              <img src={tile.src} alt={tile.alt} loading="lazy" decoding="async" />
              <figcaption>
                <span className="cap-town">{t(`work.${tile.key}.town`, tile.town[0], tile.town[1])}</span>
                {t(`work.${tile.key}.cap`, tile.cap[0], tile.cap[1])}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
