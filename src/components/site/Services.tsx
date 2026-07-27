import { useContent } from '../../lib/SiteContentProvider';

export default function Services() {
  const { t } = useContent();
  const cards = [
    {
      n: '01',
      dt: t('services.1.title', 'Countertops', 'Encimeras'),
      db: t('services.1.body',
        'Granite, quartz and quartzite — templated to your room, cut in-house, installed by the same crew that measured it.',
        'Granito, cuarzo y cuarcita — con plantilla de su espacio, cortado en casa, instalado por el mismo equipo que midió.')
    },
    {
      n: '02',
      dt: t('services.2.title', 'Cabinets', 'Gabinetes'),
      db: t('services.2.body',
        'New kitchens and refits. Solid boxes, soft-close hardware, and tops and cabinets that were planned together from day one.',
        'Cocinas nuevas y renovaciones. Cajas sólidas, herrajes de cierre suave, y encimeras y gabinetes planeados juntos desde el primer día.')
    },
    {
      n: '03',
      dt: t('services.3.title', 'Replacements', 'Reemplazos'),
      db: t('services.3.body',
        'Keep your cabinets, transform the kitchen. We template over existing boxes and swap only the tops — the fastest upgrade there is.',
        'Conserve sus gabinetes, transforme la cocina. Hacemos plantilla sobre las cajas existentes y cambiamos solo las encimeras — la mejora más rápida que existe.')
    }
  ];
  return (
    <section className="section" id="services">
      <div className="band-in">
        <span className="eyebrow reveal">{t('services.eyebrow', 'Services', 'Servicios')}</span>
        <h2 className="reveal">{t('services.title', 'What we do', 'Lo que hacemos')}</h2>
        <p className="band-lede reveal">
          {t('services.intro',
            'Residential and multi-family. Free measure and quote, no obligation.',
            'Residencial y multifamiliar. Medición y cotización gratis, sin compromiso.')}
        </p>
        <div className="card-grid">
          {cards.map(c => (
            <article className="card reveal" key={c.n}>
              <span className="card-n">{c.n}</span>
              <h3>{c.dt}</h3>
              <p>{c.db}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
