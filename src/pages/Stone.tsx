import { useContent } from '../lib/SiteContentProvider';
import { useReveal } from '../lib/useReveal';
import Header from '../components/site/Header';
import Footer from '../components/site/Footer';
import Lightbox from '../components/site/Lightbox';
import ZoomPip from '../components/site/ZoomPip';
import { useLightbox } from '../lib/useLightbox';

interface Shot { slug: string; en: string; es: string; feature?: boolean }

/* Installed work, grouped by the stone that was actually used. Granite is
   thin because the job photos on file are almost all quartz — once Cesar
   sends granite installs they slot straight in here. */
const GRANITE: Shot[] = [
  { slug: 'mat-granite', en: 'Granite island with full movement across the slab', es: 'Isla de granito con movimiento completo en la losa', feature: true },
];

const QUARTZ: Shot[] = [
  { slug: 'job-black-quartz-island', en: 'Black quartz island with white veining and gold fixtures', es: 'Isla de cuarzo negro con vetas blancas y herrajes dorados', feature: true },
  { slug: 'job-black-quartz-run', en: 'Full-height quartz backsplash carried up from the counter', es: 'Salpicadero de cuarzo de altura completa desde la encimera' },
  { slug: 'job-calacatta-island', en: 'Calacatta-look quartz island on a dark base', es: 'Isla de cuarzo estilo Calacatta sobre base oscura', feature: true },
  { slug: 'job-calacatta-niche', en: 'Full-slab range niche, book-matched', es: 'Nicho de losa completa detrás de la estufa' },
  { slug: 'job-calacatta-vanity', en: 'Calacatta quartz with a short backsplash', es: 'Cuarzo Calacatta con salpicadero corto' },
  { slug: 'job-white-shaker-peninsula', en: 'White quartz peninsula with an undermount sink', es: 'Península de cuarzo blanco con fregadero bajo encimera' },
  { slug: 'job-white-shaker-range', en: 'Quartz counters against a travertine brick backsplash', es: 'Encimeras de cuarzo con salpicadero de travertino' },
  { slug: 'job-coastal-island', en: 'Long white quartz bar with seating for four', es: 'Barra larga de cuarzo blanco con asientos para cuatro' },
];

const QUARTZITE: Shot[] = [
  { slug: 'job-white-island-espresso', en: 'Cream quartzite island against espresso cabinetry', es: 'Isla de cuarcita crema con gabinetes espresso', feature: true },
  { slug: 'mat-quartzite', en: 'Quartzite with marble-like movement and granite hardness', es: 'Cuarcita con movimiento tipo mármol y dureza de granito' },
];

const dir = (slug: string) => (slug.startsWith('mat-') ? 'materials' : 'work');

export default function Stone() {
  const { lang, t } = useContent();
  useReveal();
  const lb = useLightbox();
  const L = (en: string, es: string) => (lang === 'es' ? es : en);
  const zoom = lang === 'es' ? 'Ampliar: ' : 'Enlarge: ';

  const set = (list: Shot[], material: string) =>
    list.map(s => ({
      src: `/images/${dir(s.slug)}/${s.slug}.webp`,
      alt: L(s.en, s.es),
      caption: L(s.en, s.es),
      sub: material,
    }));

  const graniteName = t('stone.granite.title', 'Granite', 'Granito');
  const quartzName = t('stone.quartz.title', 'Quartz', 'Cuarzo');
  const quartziteName = t('stone.quartzite.title', 'Quartzite', 'Cuarcita');

  const graniteSet = set(GRANITE, graniteName);
  const quartzSet = set(QUARTZ, quartzName);
  const quartziteSet = set(QUARTZITE, quartziteName);

  const gallery = (list: Shot[], items: ReturnType<typeof set>) => (
    <div className="cab-gallery">
      {list.map((s, i) => (
        <figure className={'cab-tile reveal' + (s.feature ? ' feature' : '')} key={s.slug}>
          <img src={`/images/${dir(s.slug)}/${s.slug}.webp`} alt={L(s.en, s.es)} loading="lazy" />
          <button className="tile-zoom" onClick={() => lb.openAt(items, i)}
            aria-label={zoom + L(s.en, s.es)}>
            <ZoomPip />
          </button>
          <figcaption>{L(s.en, s.es)}</figcaption>
        </figure>
      ))}
    </div>
  );

  return (
    <div>
      <Header />

      <section className="blog-hero">
        <div className="band-in">
          <span className="eyebrow reveal">{t('stone.eyebrow', 'The stone', 'La piedra')}</span>
          <h1 className="reveal">{t('stone.h1', 'Choosing your countertop', 'Eligiendo su encimera')}</h1>
          <p className="band-lede reveal">
            {t('stone.lede',
              'Three materials, and the honest differences between them. Read this before the showroom and you will walk in knowing what you are looking at.',
              'Tres materiales y las diferencias reales entre ellos. Lea esto antes de ir a la sala de exhibición y sabrá exactamente qué está viendo.')}
          </p>
        </div>
      </section>

      {/* ---------------- GRANITE ---------------- */}
      <section className="band" id="granite">
        <div className="band-in">
          <span className="eyebrow reveal">{t('stone.granite.tag', 'Natural stone', 'Piedra natural')}</span>
          <h2 className="reveal">{graniteName}</h2>
          <p className="band-lede reveal">
            {t('stone.granite.body',
              'Quarried, cut, and polished — nothing added. Every slab is one of a kind, which is the whole appeal and also the thing to understand: the piece you approve at the yard is the piece that goes in your kitchen. Granite takes a hot pan straight off the burner and will not scratch under a knife.',
              'Extraído, cortado y pulido, sin nada añadido. Cada losa es única, y eso es tanto su atractivo como lo que hay que entender: la pieza que usted aprueba en el patio es la que va en su cocina. El granito resiste una olla caliente directa del fuego y no se raya con un cuchillo.')}
          </p>
          {gallery(GRANITE, graniteSet)}
          <ul className="stone-facts reveal">
            <li><strong>{t('stone.f.seal', 'Sealing', 'Sellado')}</strong> {t('stone.granite.seal', 'Once a year, ten minutes, a bottle from any hardware store.', 'Una vez al año, diez minutos, con un producto de cualquier ferretería.')}</li>
            <li><strong>{t('stone.f.heat', 'Heat', 'Calor')}</strong> {t('stone.granite.heat', 'Takes it directly. No trivet needed.', 'Lo resiste directamente. No necesita salvamanteles.')}</li>
            <li><strong>{t('stone.f.match', 'Consistency', 'Consistencia')}</strong> {t('stone.granite.match', 'None, by design. Pick your slab in person.', 'Ninguna, por naturaleza. Elija su losa en persona.')}</li>
          </ul>
        </div>
      </section>

      {/* ---------------- QUARTZ ---------------- */}
      <section className="band dark" id="quartz">
        <div className="band-in">
          <span className="eyebrow reveal">{t('stone.quartz.tag', 'Low maintenance', 'Bajo mantenimiento')}</span>
          <h2 className="reveal">{quartzName}</h2>
          <p className="band-lede reveal">
            {t('stone.quartz.body',
              'Ground natural quartz bound with resin and pigment, so the pattern is engineered rather than found. That means the sample you choose is what arrives — no surprises between the showroom and the install. Non-porous, so it never needs sealing and will not stain from wine or oil.',
              'Cuarzo natural molido con resina y pigmento, así que el patrón es diseñado, no encontrado. Lo que usted elige es lo que llega: sin sorpresas entre la sala de exhibición y la instalación. No poroso, nunca necesita sellado y no se mancha con vino ni aceite.')}
          </p>
          {gallery(QUARTZ, quartzSet)}
          <ul className="stone-facts reveal">
            <li><strong>{t('stone.f.seal', 'Sealing', 'Sellado')}</strong> {t('stone.quartz.seal', 'Never. That is the main reason people choose it.', 'Nunca. Esa es la razón principal por la que se elige.')}</li>
            <li><strong>{t('stone.f.heat', 'Heat', 'Calor')}</strong> {t('stone.quartz.heat', 'Use a trivet. The resin can mark above roughly 300F.', 'Use salvamanteles. La resina puede marcarse por encima de unos 150C.')}</li>
            <li><strong>{t('stone.f.match', 'Consistency', 'Consistencia')}</strong> {t('stone.quartz.match', 'Exact. What you pick is what you get.', 'Exacta. Lo que elige es lo que recibe.')}</li>
          </ul>
        </div>
      </section>

      {/* ---------------- QUARTZITE ---------------- */}
      <section className="band" id="quartzite">
        <div className="band-in">
          <span className="eyebrow reveal">{t('stone.quartzite.tag', 'Statement stone', 'Piedra de lujo')}</span>
          <h2 className="reveal">{quartziteName}</h2>
          <p className="band-lede reveal">
            {t('stone.quartzite.body',
              'Natural stone that reads like marble but wears like granite. It is the answer for anyone who wants that soft veined look without spending the next ten years worrying about a lemon slice. Harder than granite, and priced accordingly.',
              'Piedra natural que se ve como mármol pero se comporta como granito. Es la respuesta para quien quiere ese veteado suave sin pasar diez años preocupado por una rodaja de limón. Más dura que el granito, y con precio acorde.')}
          </p>
          {gallery(QUARTZITE, quartziteSet)}
          <ul className="stone-facts reveal">
            <li><strong>{t('stone.f.seal', 'Sealing', 'Sellado')}</strong> {t('stone.quartzite.seal', 'Once a year, same as granite.', 'Una vez al año, igual que el granito.')}</li>
            <li><strong>{t('stone.f.heat', 'Heat', 'Calor')}</strong> {t('stone.quartzite.heat', 'Takes it directly.', 'Lo resiste directamente.')}</li>
            <li><strong>{t('stone.f.match', 'Consistency', 'Consistencia')}</strong> {t('stone.quartzite.match', 'None. Every slab is its own thing.', 'Ninguna. Cada losa es única.')}</li>
          </ul>
        </div>
      </section>

      {/* ---------------- STRAIGHT COMPARISON ---------------- */}
      <section className="band dark" id="compare">
        <div className="band-in">
          <span className="eyebrow reveal">{t('stone.compare.eyebrow', 'Side by side', 'Comparación')}</span>
          <h2 className="reveal">{t('stone.compare.title', 'The short version', 'La versión corta')}</h2>
          <div className="stone-table-wrap reveal">
            <table className="stone-table">
              <thead>
                <tr>
                  <th>{t('stone.compare.col', '', '')}</th>
                  <th>{graniteName}</th>
                  <th>{quartzName}</th>
                  <th>{quartziteName}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{t('stone.row.seal', 'Needs sealing', 'Requiere sellado')}</td>
                  <td>{t('stone.yes.year', 'Yearly', 'Anual')}</td>
                  <td>{t('stone.no', 'No', 'No')}</td>
                  <td>{t('stone.yes.year', 'Yearly', 'Anual')}</td>
                </tr>
                <tr>
                  <td>{t('stone.row.heat', 'Hot pan direct', 'Olla caliente directa')}</td>
                  <td>{t('stone.yes', 'Yes', 'Sí')}</td>
                  <td>{t('stone.trivet', 'Use a trivet', 'Use salvamanteles')}</td>
                  <td>{t('stone.yes', 'Yes', 'Sí')}</td>
                </tr>
                <tr>
                  <td>{t('stone.row.stain', 'Stain resistance', 'Resistencia a manchas')}</td>
                  <td>{t('stone.good', 'Good, sealed', 'Buena, sellado')}</td>
                  <td>{t('stone.best', 'Best', 'La mejor')}</td>
                  <td>{t('stone.good', 'Good, sealed', 'Buena, sellado')}</td>
                </tr>
                <tr>
                  <td>{t('stone.row.unique', 'Every slab unique', 'Cada losa única')}</td>
                  <td>{t('stone.yes', 'Yes', 'Sí')}</td>
                  <td>{t('stone.no', 'No', 'No')}</td>
                  <td>{t('stone.yes', 'Yes', 'Sí')}</td>
                </tr>
                <tr>
                  <td>{t('stone.row.pick', 'Pick your exact slab', 'Elegir su losa exacta')}</td>
                  <td>{t('stone.must', 'Recommended', 'Recomendado')}</td>
                  <td>{t('stone.notneeded', 'Not needed', 'No hace falta')}</td>
                  <td>{t('stone.must2', 'Recommended', 'Recomendado')}</td>
                </tr>
                <tr>
                  <td>{t('stone.row.cost', 'Typical cost', 'Costo típico')}</td>
                  <td>$$</td>
                  <td>$$</td>
                  <td>$$$</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="stone-note reveal">
            {t('stone.compare.note',
              'There is no wrong answer here. Most Central Florida kitchens end up in quartz because it never needs sealing and the pattern is predictable. Granite and quartzite are for people who want a slab nobody else has.',
              'Aquí no hay respuesta incorrecta. La mayoría de las cocinas del centro de Florida terminan en cuarzo porque nunca necesita sellado y el patrón es predecible. El granito y la cuarcita son para quien quiere una losa que nadie más tiene.')}
          </p>
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="section cab-cta">
        <div className="band-in">
          <h2 className="reveal">
            {t('stone.cta.title', 'Still deciding? That is what the visit is for.',
              '¿Todavía decidiendo? Para eso es la visita.')}
          </h2>
          <p className="band-lede reveal">
            {t('stone.cta.body',
              'Cesar measures the kitchen, brings samples, and tells you plainly which material suits how you actually cook. No charge, no pressure.',
              'Cesar mide la cocina, lleva muestras y le dice con claridad qué material le conviene según cómo cocina realmente. Sin costo ni compromiso.')}
          </p>
          <p className="cab-cta-btns reveal">
            <a className="btn btn-gold" href="/#quote">
              {t('stone.cta.quote', 'Get a free estimate', 'Presupuesto gratis')}
            </a>
            <a className="btn btn-ghost" href="/cabinets">
              {t('stone.cta.cabs', 'See the cabinets', 'Ver los gabinetes')}
            </a>
          </p>
        </div>
      </section>

      <Footer />
      <Lightbox
        items={lb.items} index={lb.index} open={lb.open}
        onClose={lb.close} onNext={lb.next} onPrev={lb.prev}
      />
    </div>
  );
}
