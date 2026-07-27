import { useContent } from '../../lib/SiteContentProvider';

export default function Faq() {
  const { t } = useContent();
  const faqs = [
    {
      q: t('faq.1.q', 'How much does a granite or quartz countertop cost?', '¿Cuánto cuesta una encimera de granito o cuarzo?'),
      a: t('faq.1.a',
        'It depends on the stone and the square footage, which is why the measure and estimate are free. You get a written price with the slab, edge profile, sink cutouts and installation all included — no surprises later.',
        'Depende de la piedra y los pies cuadrados, por eso la medición y el estimado son gratis. Recibe un precio por escrito con la losa, el perfil del borde, los cortes para el fregadero y la instalación incluidos — sin sorpresas después.')
    },
    {
      q: t('faq.2.q', 'How long does installation take?', '¿Cuánto tiempo toma la instalación?'),
      a: t('faq.2.a',
        'Most kitchens run seven to ten days from measure to install. The install itself is usually one day, done by the same crew that measured and fabricated your stone.',
        'La mayoría de las cocinas toman de siete a diez días desde la medición hasta la instalación. La instalación en sí normalmente toma un día, hecha por el mismo equipo que midió y fabricó su piedra.')
    },
    {
      q: t('faq.3.q', 'Do you replace countertops without redoing the cabinets?', '¿Reemplazan encimeras sin cambiar los gabinetes?'),
      a: t('faq.3.a',
        'Yes. If your cabinets are sound, we template right over them and swap only the tops. It is the fastest way to transform a kitchen.',
        'Sí. Si sus gabinetes están en buen estado, hacemos la plantilla sobre ellos y cambiamos solo las encimeras. Es la forma más rápida de transformar una cocina.')
    },
    {
      q: t('faq.4.q', 'What areas do you serve?', '¿Qué áreas cubren?'),
      a: t('faq.4.a',
        'Volusia, Seminole and Orange County — Deltona, DeBary, Orange City, Sanford, Lake Mary, DeLand and the surrounding towns. If you are close, call and ask.',
        'Los condados de Volusia, Seminole y Orange — Deltona, DeBary, Orange City, Sanford, Lake Mary y los pueblos cercanos. Si está cerca, llame y pregunte.')
    },
    {
      q: t('faq.5.q', 'Do you speak Spanish?', '¿Hablan español?'),
      a: t('faq.5.a',
        'Sí — Cesar and the crew are fully bilingual. The whole project can run in English, Spanish or both.',
        'Sí — Cesar y el equipo son completamente bilingües. Todo el proyecto puede llevarse en inglés, español o ambos.')
    }
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a }
    }))
  };

  return (
    <section className="section" id="faq">
      <div className="band-in">
        <span className="eyebrow reveal">{t('faq.eyebrow', 'Good to know', 'Bueno saber')}</span>
        <h2 className="reveal">{t('faq.title', 'Questions people ask Cesar', 'Preguntas que le hacen a Cesar')}</h2>
        <div className="faq-list">
          {faqs.map((f, i) => (
            <details className="faq reveal" key={i}>
              <summary>{f.q}<span className="faq-x" aria-hidden="true" /></summary>
              <p className="faq-a">{f.a}</p>
            </details>
          ))}
        </div>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </div>
    </section>
  );
}
