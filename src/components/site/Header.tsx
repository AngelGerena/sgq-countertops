import { useState } from 'react';
import { useContent } from '../../lib/SiteContentProvider';
import { useSettings } from '../../lib/useSettings';

const LINKS = [
  { href: '#work',     en: 'Work',        es: 'Trabajos' },
  { href: '#services', en: 'Services',    es: 'Servicios' },
  { href: '#choose',   en: 'Choose',      es: 'Elegir' },
  { href: '#process',  en: 'Process',     es: 'Proceso' },
  { href: '/blog',     en: 'Blog',        es: 'Blog' },
  { href: '#quote',    en: 'Get a quote', es: 'Cotización' }
];

export default function Header() {
  const { lang, setLang } = useContent();
  const s = useSettings();
  const [open, setOpen] = useState(false);
  const tel = (s?.phone ?? '386-444-5290').replace(/[^0-9]/g, '');

  return (
    <header className="head">
      <div className="head-in">
        <a className="wordmark" href="#top" onClick={() => setOpen(false)}>
          <span className="wm-name">Santiago's</span>
          <span className="wm-sub">Granite &amp; Quartz</span>
        </a>

        <nav className={'nav' + (open ? ' open' : '')}>
          {LINKS.map(l => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
              {lang === 'es' ? l.es : l.en}
            </a>
          ))}
        </nav>

        <div className="head-act">
          <div className="lang" role="group" aria-label="Language">
            <button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>EN</button>
            <button type="button" aria-pressed={lang === 'es'} onClick={() => setLang('es')}>ES</button>
          </div>
          <a className="btn gold sm phone" href={'tel:+1' + tel}>{s?.phone ?? '386-444-5290'}</a>
          <button className={'burger' + (open ? ' on' : '')} aria-label="Menu"
            aria-expanded={open} onClick={() => setOpen(!open)}>
            <span /><span /><span />
          </button>
        </div>
      </div>
    </header>
  );
}
