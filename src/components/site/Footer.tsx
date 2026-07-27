import { Link } from 'react-router-dom';
import { useContent } from '../../lib/SiteContentProvider';
import { useSettings } from '../../lib/useSettings';

export default function Footer() {
  const { t } = useContent();
  const s = useSettings();
  const tel = (s?.phone ?? '386-444-5290').replace(/[^0-9]/g, '');
  return (
    <footer className="foot">
      <div className="foot-in">
        <div className="foot-brand">
          <img className="foot-crest" src="/images/crest-280.png" alt="" width="280" height="353" loading="lazy" />
          <span className="wm-name">Santiago's</span>
          <span className="wm-sub">Granite &amp; Quartz</span>
        </div>
        <div className="foot-col">
          <span className="foot-h">{t('footer.contact_h', 'Contact', 'Contacto')}</span>
          <a href={'tel:+1' + tel}>{s?.phone ?? '386-444-5290'}</a>
          {s?.email && <a href={'mailto:' + s.email}>{s.email}</a>}
          <span>{t('footer.hours', s?.hours ?? 'Mon-Sat, 8am-6pm', s?.hours ?? 'Lun-Sáb, 8am-6pm')}</span>
        </div>
        <div className="foot-col">
          <span className="foot-h">{t('footer.area_h', 'Service area', 'Área de servicio')}</span>
          <span>{t('footer.tagline', s?.service_area ?? 'Volusia, Seminole, Orange and surrounding.',
                                     s?.service_area ?? 'Volusia, Seminole, Orange y alrededores.')}</span>
          {s?.license_number && <span>Lic. {s.license_number}</span>}
          <Link to="/blog">{t('footer.blog', 'Ideas & advice', 'Ideas y consejos')}</Link>
        </div>
      </div>
      <div className="foot-bar">
        <span>&copy; {new Date().getFullYear()} {s?.legal_name ?? "Santiago's Granite & Quartz LLC"}</span>
        <Link to="/admin" className="portal-link">Portal</Link>
      </div>
    </footer>
  );
}
