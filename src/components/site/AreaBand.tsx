import { useContent } from '../../lib/SiteContentProvider';

const TOWNS = [
  'Deltona', 'DeBary', 'Orange City', 'Sanford', 'Lake Mary', 'Deland',
  'Longwood', 'Winter Springs', 'Apopka', 'Orlando', 'Altamonte Springs', 'Oviedo'
];

export default function AreaBand() {
  const { t } = useContent();
  return (
    <section className="band dark area-band" id="area">
      <div className="band-in">
        <span className="eyebrow reveal">{t('area.eyebrow', 'Service area', 'Área de servicio')}</span>
        <h2 className="reveal">{t('area.title', 'Volusia, Seminole & Orange County', 'Volusia, Seminole y Orange')}</h2>
        <p className="band-lede reveal">
          {t('area.intro',
            'Based in Deltona, installing across Central Florida. If your town is close to one of these, you are in range.',
            'Con base en Deltona, instalando en todo el Centro de Florida. Si su ciudad está cerca de alguna de estas, está dentro del área.')}
        </p>
        <div className="town-cloud reveal">
          {TOWNS.map(town => <span className="town" key={town}>{town}</span>)}
        </div>
      </div>
    </section>
  );
}
