import { useContent } from '../../lib/SiteContentProvider';

export default function Process() {
  const { t } = useContent();
  const steps = [
    { t: t('process.1.title', 'Measure', 'Medición'),
      b: t('process.1.body', 'Cesar comes out, measures the room and talks through materials. Free, no obligation.',
                             'Cesar viene, mide el espacio y conversan sobre materiales. Gratis, sin compromiso.') },
    { t: t('process.2.title', 'Quote', 'Cotización'),
      b: t('process.2.body', 'A written quote with the stone, edge profile and everything included. No surprises later.',
                             'Una cotización escrita con la piedra, el perfil del borde y todo incluido. Sin sorpresas.') },
    { t: t('process.3.title', 'Fabricate', 'Fabricación'),
      b: t('process.3.body', 'Templated and cut to your room, not to a standard size.',
                             'Plantilla y corte a la medida de su espacio, no a un tamaño estándar.') },
    { t: t('process.4.title', 'Install', 'Instalación'),
      b: t('process.4.body', 'Installed by the same crew, cleaned up, and walked through with you before we leave.',
                             'Instalado por el mismo equipo, limpio, y revisado con usted antes de irnos.') }
  ];

  return (
    <section className="band dark" id="process">
      <div className="band-in">
        <h2>{t('process.title', 'From measure to install', 'De la medición a la instalación')}</h2>
        <p className="band-lede">
          {t('process.intro', 'Four steps, start to finish. Most kitchens run seven to ten days.',
                              'Cuatro pasos, de principio a fin. La mayoría de las cocinas toman de siete a diez días.')}
        </p>
        <ol className="steps">
          {steps.map((s, i) => (
            <li key={i}><span className="step-n">{i + 1}</span><h3>{s.t}</h3><p>{s.b}</p></li>
          ))}
        </ol>
      </div>
    </section>
  );
}
