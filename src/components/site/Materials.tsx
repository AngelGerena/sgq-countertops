import { useContent } from '../../lib/SiteContentProvider';
import { useLightbox } from '../../lib/useLightbox';
import Lightbox from './Lightbox';
import ZoomPip from './ZoomPip';

export default function Materials() {
  const { t, lang } = useContent();
  const lb = useLightbox();
  const es = lang === 'es';
  const mats = [
    {
      k: 'granite',
      name: t('materials.granite.name', 'Granite', 'Granito'),
      body: t('materials.granite.body',
        'Natural stone, no two slabs alike. Takes heat straight from the oven and shrugs off knives. The workhorse of Florida kitchens.',
        'Piedra natural, no hay dos losas iguales. Resiste el calor directo del horno y los cuchillos. El caballo de batalla de las cocinas de Florida.'),
      tag: t('materials.granite.tag', 'Natural stone', 'Piedra natural')
    },
    {
      k: 'quartz',
      name: t('materials.quartz.name', 'Quartz', 'Cuarzo'),
      body: t('materials.quartz.body',
        'Engineered for consistency — the veining you pick in the showroom is the veining you get. Non-porous, so it never needs sealing.',
        'Diseñado para la consistencia: el veteado que elige en la sala de exhibición es el que recibe. No poroso, nunca necesita sellado.'),
      tag: t('materials.quartz.tag', 'Low maintenance', 'Bajo mantenimiento')
    },
    {
      k: 'quartzite',
      name: t('materials.quartzite.name', 'Quartzite', 'Cuarcita'),
      body: t('materials.quartzite.body',
        'The look of marble with the hardness of granite. For the kitchen that has to stop people at the doorway.',
        'La apariencia del mármol con la dureza del granito. Para la cocina que debe detener a la gente en la puerta.'),
      tag: t('materials.quartzite.tag', 'Statement stone', 'Piedra de lujo')
    }
  ];
  const slabs = mats.map(m => ({
    src: '/images/materials/mat-' + m.k + '.webp',
    alt: m.name,
    caption: m.body,
    sub: m.name
  }));

  return (
    <section className="band dark" id="materials">
      <div className="band-in">
        <span className="eyebrow reveal">{t('materials.eyebrow', 'The stone', 'La piedra')}</span>
        <h2 className="reveal">{t('materials.title', 'Choose your material', 'Elija su material')}</h2>
        <p className="band-lede reveal">
          {t('materials.intro',
            'Cesar walks every client through the slabs in person. Here is where the conversation starts.',
            'Cesar acompaña a cada cliente a ver las losas en persona. Aquí es donde empieza la conversación.')}
        </p>
        <div className="mat-grid">
          {mats.map((m, i) => (
            <article className={'mat-card reveal'} key={m.k}>
              <div className={'mat-swatch sw-' + m.k}>
                <img
                  src={'/images/materials/mat-' + m.k + '.webp'}
                  alt={m.name}
                  loading="lazy"
                  width={900}
                  height={520}
                />
                <button
                  className="tile-zoom"
                  onClick={() => lb.openAt(slabs, i)}
                  aria-label={(es ? 'Ampliar: ' : 'Enlarge: ') + m.name}
                >
                  <ZoomPip />
                </button>
              </div>
              <div className="mat-body">
                <h3>{m.name}</h3>
                <p>{m.body}</p>
                <span className="mat-tag">{m.tag}</span>
                <a className="mat-more" href={'/stone#' + m.k}>
                  {t('materials.more', 'Compare and see it installed', 'Comparar y verlo instalado')}
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M12 5l7 7-7 7"/></svg>
                </a>
              </div>
            </article>
          ))}
        </div>
        <p className="mat-cta reveal">
          <a className="btn btn-ghost" href="/stone">
            {t('materials.guide', 'Read the full guide to choosing stone',
               'Lea la guía completa para elegir su piedra')}
          </a>
        </p>
      </div>
      <Lightbox
        items={lb.items} index={lb.index} open={lb.open}
        onClose={lb.close} onNext={lb.next} onPrev={lb.prev}
      />
    </section>
  );
}
