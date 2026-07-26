import { useContent } from '../../lib/SiteContentProvider';

export default function Services() {
  const { t } = useContent();
  const cards = [
    { n: '1',
      dt: t('services.1.title', 'Countertops', 'Encimeras'),
      db: t('services.1.body',
        'Granite, quartz and quartzite. Templated on site, cut in shop, installed by the same crew that measured.',
        'Granito, cuarzo y cuarcita. Plantilla en sitio, corte en taller e instalación por el mismo equipo que midió.') },
    { n: '2',
      dt: t('services.2.title', 'Cabinets', 'Gabinetes'),
      db: t('services.2.body',
        'Shaker and raised panel in a range of finishes, sourced through a Sanford supplier and fitted to your room.',
        'Shaker y panel elevado en varios acabados, de un proveedor en Sanford y ajustados a su espacio.') },
    { n: '3',
      dt: t('services.3.title', 'Full kitchen', 'Cocina completa'),
      db: t('services.3.body',
        'Cabinets and countertops together, sequenced so the job runs once instead of twice.',
        'Gabinetes y encimeras juntos, coordinados para que el trabajo se haga una sola vez.') }
  ];

  return (
    <section className="section" id="services">
      <div className="band-in">
        <h2>{t('services.title', 'What we do', 'Lo que hacemos')}</h2>
        <p className="band-lede">
          {t('services.intro',
            'Residential and multi-family. Free measure and quote, no obligation.',
            'Residencial y multifamiliar. Medición y cotización gratis, sin compromiso.')}
        </p>
        <div className="card-grid">
          {cards.map(c => (
            <article className="card" key={c.n}>
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
