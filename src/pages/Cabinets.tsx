import { Link } from 'react-router-dom';
import { useContent } from '../lib/SiteContentProvider';
import { useReveal } from '../lib/useReveal';
import Header from '../components/site/Header';
import Footer from '../components/site/Footer';
import Lightbox from '../components/site/Lightbox';
import ZoomPip from '../components/site/ZoomPip';
import { useLightbox } from '../lib/useLightbox';

/* The cabinet lines are presented as SGQ's own house collections.
   Supplier names live in the admin portal only — never on this page. */

interface Color { slug: string; en: string; es: string; }

const SHAKER_COLORS: Color[] = [
  { slug: 'shaker-white',       en: 'White',          es: 'Blanco' },
  { slug: 'shaker-grey',        en: 'Grey',           es: 'Gris' },
  { slug: 'shaker-espresso',    en: 'Espresso',       es: 'Espresso' },
  { slug: 'shaker-slate',       en: 'Modern Slate',   es: 'Pizarra moderna' },
  { slug: 'shaker-navy',        en: 'Navy Blue',      es: 'Azul marino' },
  { slug: 'shaker-powder-blue', en: 'Powder Blue',    es: 'Azul empolvado' },
  { slug: 'shaker-light-blue',  en: 'Light Blue',     es: 'Azul claro' },
  { slug: 'shaker-sage',        en: 'Sage Green',     es: 'Verde salvia' },
  { slug: 'shaker-oak',         en: 'Natural Oak',    es: 'Roble natural' },
  { slug: 'shaker-cherry',      en: 'Cherry',         es: 'Cereza' },
  { slug: 'raised-panel-white', en: 'Classic Raised Panel', es: 'Panel elevado clásico' },
];

const EURO_COLORS: Color[] = [
  { slug: 'euro-white-gloss', en: 'White Gloss', es: 'Blanco brillante' },
  { slug: 'euro-light-oak',   en: 'Light Oak',   es: 'Roble claro' },
  { slug: 'euro-walnut',      en: 'Walnut',      es: 'Nogal' },
];

interface Shot { slug: string; en: string; es: string; feature?: boolean; }

const SHAKER_SHOTS: Shot[] = [
  { slug: 'shaker-white-hero',   en: 'White shaker, full kitchen',   es: 'Shaker blanco, cocina completa', feature: true },
  { slug: 'shaker-navy-island',  en: 'Navy island centerpiece',      es: 'Isla azul marino protagonista' },
  { slug: 'shaker-farmhouse',    en: 'Farmhouse warmth',             es: 'Calidez farmhouse' },
  { slug: 'shaker-grey-kitchen', en: 'Grey shaker, open plan',       es: 'Shaker gris, planta abierta' },
  { slug: 'shaker-dark-island',  en: 'Dark island contrast',         es: 'Contraste de isla oscura' },
  { slug: 'shaker-classic',      en: 'Classic and timeless',         es: 'Clásico y atemporal' },
  { slug: 'shaker-espresso-kit', en: 'Espresso, rich and warm',      es: 'Espresso, rico y cálido' },
  { slug: 'shaker-vanity',       en: 'Bathroom vanity',              es: 'Tocador de baño' },
];

const EURO_SHOTS: Shot[] = [
  { slug: 'euro-hero',     en: 'Seamless slab fronts',      es: 'Frentes lisos sin juntas', feature: true },
  { slug: 'euro-island',   en: 'Waterfall island pairing',  es: 'Isla con cascada' },
  { slug: 'euro-two-tone', en: 'Two-tone modern',           es: 'Moderno bicolor' },
  { slug: 'euro-oak',      en: 'Warm oak minimalism',       es: 'Minimalismo en roble cálido' },
  { slug: 'euro-galley',   en: 'Galley efficiency',         es: 'Cocina lineal eficiente' },
  { slug: 'euro-corner',   en: 'Corner-to-corner storage',  es: 'Almacenaje de esquina a esquina' },
  { slug: 'euro-vanity',   en: 'Floating vanity',           es: 'Tocador flotante' },
  { slug: 'euro-loft',     en: 'Loft kitchen',              es: 'Cocina tipo loft' },
];

export default function Cabinets() {
  const { lang, t } = useContent();
  useReveal();
  const lb = useLightbox();
  const L = (en: string, es: string) => (lang === 'es' ? es : en);
  const zoomLabel = lang === 'es' ? 'Ampliar: ' : 'Enlarge: ';

  /* four separate sets, so the arrows stay inside the row you clicked */
  const shot = (list: Shot[], collection: string) =>
    list.map(x => ({
      src: `/images/catalog/cabinets-${x.slug}.webp`,
      alt: L(x.en, x.es),
      caption: L(x.en, x.es),
      sub: collection
    }));
  const swatch = (list: Color[], collection: string) =>
    list.map(c => ({
      src: `/images/catalog/swatch-${c.slug}.webp`,
      alt: L(c.en, c.es),
      caption: L(c.en, c.es),
      sub: collection
    }));

  const shakerName = t('cabinets.shaker.title', 'Classic Shaker Collection', 'Colección Shaker Clásica');
  const euroName = t('cabinets.euro.title', 'European Frameless Collection', 'Colección Europea Sin Marco');
  const shakerShots = shot(SHAKER_SHOTS, shakerName);
  const euroShots = shot(EURO_SHOTS, euroName);
  const shakerSwatches = swatch(SHAKER_COLORS, shakerName);
  const euroSwatches = swatch(EURO_COLORS, euroName);

  return (
    <div className="site">
      <Header />

      <section className="blog-hero">
        <div className="band-in">
          <span className="eyebrow">{t('cabinets.eyebrow', 'Cabinetry', 'Gabinetes')}</span>
          <h1>{t('cabinets.title', 'Cabinets built to carry stone', 'Gabinetes hechos para sostener piedra')}</h1>
          <p>
            {t('cabinets.lede',
              'Countertops are only as good as what holds them up. We supply and install two all-plywood cabinet collections — measured, delivered and fitted by the same crew that templates your stone, so everything lines up on the first try.',
              'Una encimera es tan buena como lo que la sostiene. Suministramos e instalamos dos colecciones de gabinetes de contrachapado — medidos, entregados e instalados por el mismo equipo que plantilla su piedra, para que todo cuadre a la primera.')}
          </p>
        </div>
      </section>

      {/* ---- Classic Shaker collection ---- */}
      <section className="band" id="shaker">
        <div className="band-in">
          <span className="eyebrow reveal">{t('cabinets.shaker.eyebrow', 'Collection one', 'Colección uno')}</span>
          <h2 className="reveal">{t('cabinets.shaker.title', 'Classic Shaker Collection', 'Colección Shaker Clásica')}</h2>
          <p className="band-lede reveal">
            {t('cabinets.shaker.intro',
              'All-wood framed cabinets with soft-close doors and drawers as standard. Eleven finishes, from safe-for-resale white to magazine-ready sage and navy.',
              'Gabinetes de madera con marco, puertas y cajones de cierre suave de serie. Once acabados, desde el blanco seguro para reventa hasta el salvia y azul marino dignos de revista.')}
          </p>

          <div className="cab-gallery">
            {SHAKER_SHOTS.map((s, i) => (
              <figure className={'cab-tile reveal' + (s.feature ? ' feature' : '')} key={s.slug}>
                <img src={`/images/catalog/cabinets-${s.slug}.webp`} alt={L(s.en, s.es)} loading="lazy" />
                <button className="tile-zoom" onClick={() => lb.openAt(shakerShots, i)}
                  aria-label={zoomLabel + L(s.en, s.es)}>
                  <ZoomPip />
                </button>
                <figcaption>{L(s.en, s.es)}</figcaption>
              </figure>
            ))}
          </div>

          <h3 className="cab-colors-h reveal">{t('cabinets.shaker.colors', 'Available finishes', 'Acabados disponibles')}</h3>
          <div className="cab-swatches">
            {SHAKER_COLORS.map((c, i) => (
              <figure className="cab-swatch reveal" key={c.slug}>
                <button className="zoomable" onClick={() => lb.openAt(shakerSwatches, i)}
                  aria-label={zoomLabel + L(c.en, c.es)}>
                  <img src={`/images/catalog/swatch-${c.slug}.webp`} alt={L(c.en, c.es)} loading="lazy" />
                  <ZoomPip />
                </button>
                <figcaption>{L(c.en, c.es)}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ---- European Frameless collection ---- */}
      <section className="band dark" id="frameless">
        <div className="band-in">
          <span className="eyebrow reveal">{t('cabinets.euro.eyebrow', 'Collection two', 'Colección dos')}</span>
          <h2 className="reveal">{t('cabinets.euro.title', 'European Frameless Collection', 'Colección Europea Sin Marco')}</h2>
          <p className="band-lede reveal">
            {t('cabinets.euro.intro',
              'Full-access frameless boxes with flat slab doors — the clean, modern look. More usable space inside every cabinet, and finishes from high-gloss white to rich walnut.',
              'Gabinetes sin marco de acceso total con puertas lisas — el look limpio y moderno. Más espacio útil en cada gabinete, con acabados desde blanco brillante hasta nogal intenso.')}
          </p>

          <div className="cab-gallery">
            {EURO_SHOTS.map((s, i) => (
              <figure className={'cab-tile reveal' + (s.feature ? ' feature' : '')} key={s.slug}>
                <img src={`/images/catalog/cabinets-${s.slug}.webp`} alt={L(s.en, s.es)} loading="lazy" />
                <button className="tile-zoom" onClick={() => lb.openAt(euroShots, i)}
                  aria-label={zoomLabel + L(s.en, s.es)}>
                  <ZoomPip />
                </button>
                <figcaption>{L(s.en, s.es)}</figcaption>
              </figure>
            ))}
          </div>

          <h3 className="cab-colors-h reveal">{t('cabinets.euro.colors', 'Available finishes', 'Acabados disponibles')}</h3>
          <div className="cab-swatches euro">
            {EURO_COLORS.map((c, i) => (
              <figure className="cab-swatch reveal" key={c.slug}>
                <button className="zoomable" onClick={() => lb.openAt(euroSwatches, i)}
                  aria-label={zoomLabel + L(c.en, c.es)}>
                  <img src={`/images/catalog/swatch-${c.slug}.webp`} alt={L(c.en, c.es)} loading="lazy" />
                  <ZoomPip />
                </button>
                <figcaption>{L(c.en, c.es)}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ---- CTA back to the estimate form ---- */}
      <section className="section cab-cta">
        <div className="band-in narrow">
          <h2 className="reveal">{t('cabinets.cta.title', 'Cabinets and countertops, one crew, one price', 'Gabinetes y encimeras, un equipo, un precio')}</h2>
          <p className="band-lede reveal">
            {t('cabinets.cta.body',
              'Tell us about your kitchen and we will put together a package quote — cabinets, stone and installation, with no showroom markup.',
              'Cuéntenos sobre su cocina y armaremos un presupuesto de paquete — gabinetes, piedra e instalación, sin margen de sala de exhibición.')}
          </p>
          <p className="cab-cta-btns reveal">
            <Link className="btn gold" to="/#quote">{t('cabinets.cta.btn', 'Get my free estimate', 'Obtener mi estimado gratis')}</Link>
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
