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
          <span className="wm-name">Santiago's</span>
          <span className="wm-sub">Granite &amp; Quartz</span>
        </div>

        <div className="foot-col">
          <a href={'tel:+1' + tel}>{s?.phone ?? '386-444-5290'}</a>
          {s?.email && <a href={'mailto:' + s.email}>{s.email}</a>}
          <span>{t('footer.hours', s?.hours ?? 'Mon-Sat, 8am-6pm', s?.hours ?? 'Lun-Sáb, 8am-6pm')}</span>
        </div>

        <div className="foot-col">
          <span>{t('footer.tagline', s?.service_area ?? 'Volusia, Seminole, Orange and surrounding.',
                                     s?.service_area ?? 'Volusia, Seminole, Orange y alrededores.')}</span>
          {s?.license_number && <span>Lic. {s.license_number}</span>}
        </div>
      </div>
      <div className="foot-bar">
        <span>&copy; {new Date().getFullYear()} {s?.legal_name ?? "Santiago's Granite & Quartz LLC"}</span>
        <Link to="/admin" className="portal-link">Portal</Link>
      </div>
    </footer>
  );
}
